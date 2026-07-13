import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { ShareButtons } from "@/components/home/ShareButtons";
import { T } from "@/components/layout/T";

interface Props { params: { slug: string } }

async function getArticle(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("news")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: { images: article.cover_image_url ? [article.cover_image_url] : [] },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  // Görüntülenme sayısı artışı (best-effort, hata sayfayı etkilemez)
  try {
    const service = createServiceClient();
    await service.from("news").update({ view_count: article.view_count + 1 }).eq("id", article.id);
  } catch {}

  const { data: attachments } = await createClient()
    .from("news_attachments")
    .select("id, file_url, file_name")
    .eq("news_id", article.id)
    .order("created_at", { ascending: true });

  return (
    <article className="max-w-3xl mx-auto px-4 py-20">
      <T k="page_news_detail_eyebrow" as="p" className="eyebrow mb-3" />
      <h1 className="font-display text-4xl mb-4">{article.title}</h1>
      <div className="mb-6">
        <ShareButtons
          title={article.title}
          url={`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/haberler/${article.slug}`}
        />
      </div>
      {article.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.cover_image_url} alt={article.title} className="w-full rounded-2xl mb-8" />
      )}
      <div className="prose prose-invert max-w-none text-tuna-mist leading-relaxed whitespace-pre-line">
        {article.content}
      </div>
      {article.video_url && (
        <video src={article.video_url} controls className="mt-8 w-full rounded-2xl bg-black" />
      )}
      {!!attachments?.length && (
        <div className="mt-8">
          <h2 className="font-display text-xl mb-3">Belgeler</h2>
          <ul className="space-y-2">
            {attachments.map((a) => (
              <li key={a.id}>
                <a
                  href={a.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-tuna-gold hover:underline"
                >
                  <FileText size={16} />
                  {a.file_name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
