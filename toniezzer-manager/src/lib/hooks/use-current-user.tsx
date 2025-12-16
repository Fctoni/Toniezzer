"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/lib/types/database";
import { User } from "@supabase/supabase-js";

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

  useEffect(() => {
    const supabase = createClient();

    const initializeAuth = async () => {
      try {
        // Buscar usuario autenticado
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error("Erro ao buscar usuario auth:", authError);
        }
        
        setAuthUser(user);

        // Buscar todos os usuarios ativos
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("*")
          .eq("ativo", true)
          .order("nome_completo");

        if (usersError) {
          console.error("Erro ao buscar usuarios:", usersError);
        }

        if (usersData && usersData.length > 0) {
          setUsers(usersData);

          // Se temos usuario autenticado, buscar seu perfil por email
          if (user?.email) {
            const userProfile = usersData.find((u) => u.email === user.email);
            setCurrentUser(userProfile || usersData[0]);
          } else {
            // Sem usuario autenticado ou sem email, usar primeiro usuario
            setCurrentUser(usersData[0]);
          }
        }
      } catch (error) {
        console.error("Erro ao inicializar autenticacao:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Escutar mudancas de autenticacao
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        
        if (event === "SIGNED_OUT") {
          setAuthUser(null);
          setCurrentUser(null);
          return;
        }
        
        setAuthUser(session?.user || null);

        if (session?.user?.email) {
          // Buscar perfil do usuario logado
          const { data: usersData } = await supabase
            .from("users")
            .select("*")
            .eq("ativo", true)
            .order("nome_completo");

          if (usersData && usersData.length > 0) {
            setUsers(usersData);
            const userProfile = usersData.find(
              (u) => u.email === session.user.email
            );
            setCurrentUser(userProfile || usersData[0]);
          }
        }
      }
    );

    return () => {
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
