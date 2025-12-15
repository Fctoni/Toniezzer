"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KanbanEmails } from "./kanban-emails";
import { Mail, Search, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/lib/types/database";

interface EmailsClientProps {
  emails: Tables<"emails_monitorados">[];
}

export function EmailsClient({ emails: initialEmails }: EmailsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);

  const handleIgnorar = async (id: string) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("emails_monitorados")
      .update({ status: "ignorado" })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao ignorar email");
      return;
    }

    toast.success("Email marcado como ignorado");
    router.refresh();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      // 1. Sincronizar emails do servidor IMAP
      toast.info("Conectando ao servidor de emails...");

      const syncResponse = await fetch("/api/emails/sync", { method: "POST" });
      const syncResult = await syncResponse.json();

      if (!syncResponse.ok) {
        console.error("Erro na sincronização:", syncResult);
        toast.error("Erro ao sincronizar", {
          description: syncResult.error || "Erro desconhecido",
        });
        return;
      }

      toast.success(`${syncResult.newEmails} novos emails encontrados`);

      // 2. Processar emails com IA (se houver novos)
      if (syncResult.newEmails > 0) {
        toast.info("Processando emails com IA...");

        const processResponse = await fetch("/api/emails/process", {
          method: "POST",
        });
        const processResult = await processResponse.json();

        if (processResponse.ok) {
          toast.success("Emails processados!", {
            description: `${processResult.processed} emails analisados pela IA`,
          });
        } else {
          toast.warning("Erro ao processar com IA", {
            description: processResult.error,
          });
        }
      }

      router.refresh();
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro na sincronização");
    } finally {
      setSyncing(false);
    }
  };

  const emailsFiltrados = initialEmails.filter(
    (e) =>
      e.assunto.toLowerCase().includes(search.toLowerCase()) ||
      e.remetente.toLowerCase().includes(search.toLowerCase()) ||
      e.remetente_nome?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Sync Button and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por remetente ou assunto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
          />
          {syncing ? "Sincronizando..." : "Sincronizar"}
        </Button>
      </div>

      {/* Kanban */}
      {emailsFiltrados.length === 0 && !search ? (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum email encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Emails enviados para casa@toniezzer.com aparecerão aqui
            automaticamente.
          </p>
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
            />
            Verificar Agora
          </Button>
        </div>
      ) : (
        <KanbanEmails emails={emailsFiltrados} onIgnorar={handleIgnorar} />
      )}
    </>
  );
}


