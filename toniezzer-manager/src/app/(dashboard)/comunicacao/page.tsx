import { createClient } from "@/lib/supabase/server";
import { fetchStages } from "@/lib/services/etapas";
import { fetchTopics } from "@/lib/services/topicos-comunicacao";
import { countMessagesByTopic } from "@/lib/services/feed-comunicacao";
import { ComunicacaoPageClient } from "@/components/features/comunicacao/comunicacao-page-client";

export default async function ComunicacaoPage() {
  const supabase = await createClient();

  const etapas = await fetchStages(supabase);

  const topicosData = await fetchTopics(supabase);
  const initialTopicos = await Promise.all(
    topicosData.map(async (topico) => {
      const count = await countMessagesByTopic(supabase, topico.id);
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
