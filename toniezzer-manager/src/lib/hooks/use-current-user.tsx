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

interface CurrentUserContextType {
  currentUser: Tables<"users"> | null;
  users: Tables<"users">[];
  setCurrentUserId: (id: string) => void;
  loading: boolean;
}

const CurrentUserContext = createContext<CurrentUserContextType | undefined>(
  undefined
);

const STORAGE_KEY = "toniezzer-current-user-id";

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<Tables<"users">[]>([]);
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("ativo", true)
        .order("nome_completo");

      if (data && data.length > 0) {
        setUsers(data);

        // Tentar recuperar do localStorage
        const savedId = localStorage.getItem(STORAGE_KEY);
        if (savedId && data.find((u) => u.id === savedId)) {
          setCurrentUserIdState(savedId);
        } else {
          // Usar o primeiro usuário como padrão
          setCurrentUserIdState(data[0].id);
          localStorage.setItem(STORAGE_KEY, data[0].id);
        }
      }

      setLoading(false);
    };

    fetchUsers();
  }, []);

  const setCurrentUserId = (id: string) => {
    setCurrentUserIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const currentUser = users.find((u) => u.id === currentUserId) || null;

  return (
    <CurrentUserContext.Provider
      value={{ currentUser, users, setCurrentUserId, loading }}
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

