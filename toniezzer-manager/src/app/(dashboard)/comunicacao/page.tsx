import { createClient } from "@/lib/supabase/server";
import { buscarEtapas } from "@/lib/services/etapas";
import { buscarTopicos } from "@/lib/services/topicos-comunicacao";
import { contarMensagensPorTopico } from "@/lib/services/feed-comunicacao";
import { ComunicacaoPageClient } from "@/components/features/comunicacao/comunicacao-page-client";

export default async function ComunicacaoPage() {
  const supabase = await createClient();

  const etapas = await buscarEtapas(supabase);

  const topicosData = await buscarTopicos(supabase);
  const initialTopicos = await Promise.all(
    topicosData.map(async (topico) => {
      const count = await contarMensagensPorTopico(supabase, topico.id);
      return {
        ...topico,
        _count: { mensagens: count },
      };
    })
  );

  return (
    <ComunicacaoPageClient
      initialTopicos={initialTopicos}
      etapas={etapas}
    />
  );
}
