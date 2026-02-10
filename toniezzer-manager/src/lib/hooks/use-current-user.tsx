"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/lib/types/database";
import { User } from "@supabase/supabase-js";
import { buscarUsuariosAtivos } from "@/lib/services/users";

interface CurrentUserContextType {
  // Usuario autenticado do Supabase Auth
  authUser: User | null;
  // Perfil do usuario na tabela public.users
  currentUser: Tables<"users"> | null;
  // Lista de todos os usuarios (para mencoes, atribuicoes, etc)
  users: Tables<"users">[];
  // Estado de carregamento
  loading: boolean;
  // Funcao de logout
  signOut: () => Promise<void>;
}

const CurrentUserContext = createContext<CurrentUserContextType | undefined>(
  undefined
);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<Tables<"users"> | null>(null);
  const [users, setUsers] = useState<Tables<"users">[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Flag para evitar inicializacao duplicada
  const isInitialized = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const initializeAuth = async () => {
      // Evitar inicializacao duplicada (StrictMode chama useEffect 2x)
      if (isInitialized.current) {
        console.log("[Auth] Ja inicializado, ignorando...");
        return;
      }
      
      isInitialized.current = true;
      console.log("[Auth] Iniciando...");
      
      try {
        // 1. Primeiro verificar a sessao existente
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("[Auth] Erro getSession:", sessionError.message);
        }
        
        console.log("[Auth] Sessao:", session?.user?.email || "nenhuma");
        
        // 2. Se nao tem sessao, finalizar loading e deixar middleware redirecionar
        if (!session?.user) {
          console.log("[Auth] Sem sessao ativa");
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        // 3. Temos sessao, buscar usuarios
        if (mounted) {
          setAuthUser(session.user);
        }
        
        console.log("[Auth] Buscando usuarios...");
        
        let usersData: Tables<"users">[] = [];
        try {
          usersData = await buscarUsuariosAtivos(supabase);
        } catch (usersError) {
          console.error("[Auth] Erro buscar usuarios:", usersError);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        console.log("[Auth] Usuarios encontrados:", usersData?.length || 0);

        if (mounted && usersData && usersData.length > 0) {
          setUsers(usersData);

          // Buscar perfil por email
          const userProfile = usersData.find((u) => u.email === session.user.email);
          console.log("[Auth] Perfil encontrado:", userProfile?.nome_completo || "fallback");
          setCurrentUser(userProfile || usersData[0]);
        }
      } catch (error) {
        console.error("[Auth] Erro critico:", error);
      } finally {
        console.log("[Auth] Finalizado");
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Escutar mudancas de autenticacao (apenas para logout/refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[Auth] Estado mudou:", event);
        
        if (!mounted) return;
        
        // Tratar apenas eventos importantes apos inicializacao
        if (event === "SIGNED_OUT") {
          setAuthUser(null);
          setCurrentUser(null);
          setUsers([]);
          window.location.href = '/login';
        } else if (event === "TOKEN_REFRESHED") {
          console.log("[Auth] Token atualizado");
          setAuthUser(session?.user || null);
        }
        // SIGNED_IN e INITIAL_SESSION sao tratados pelo initializeAuth
      }
    );

    // Inicializar
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setAuthUser(null);
    setCurrentUser(null);
    window.location.href = "/login";
  };

  return (
    <CurrentUserContext.Provider
      value={{ authUser, currentUser, users, loading, signOut }}
    >
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (context === undefined) {
    throw new Error("useCurrentUser must be used within a CurrentUserProvider");
  }
  return context;
}
