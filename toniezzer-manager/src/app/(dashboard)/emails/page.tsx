import { createClient } from "@/lib/supabase/server";
import { EmailsClient } from "@/components/features/emails/emails-client";
import { Mail } from "lucide-react";
import type { Tables } from "@/lib/types/database";

export default async function EmailsPage() {
  const supabase = await createClient();

  const { data: emails, error } = await supabase
    .from("emails_monitorados")
    .select("*")
    .order("data_recebimento", { ascending: false });

  if (error) {
    console.error("Erro ao carregar emails:", error);
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Emails Monitorados
          </h1>
          <p className="text-muted-foreground">
            Notas fiscais recebidas em casa@toniezzer.com
          </p>
        </div>
      </div>

      {/* Client Component for sync and filters */}
      <EmailsClient emails={emails || []} />

      {/* Info */}
      <div className="text-xs text-muted-foreground text-center">
        💡 O sistema verifica novos emails automaticamente a cada 15 minutos.
      </div>
    </div>
  );
}
