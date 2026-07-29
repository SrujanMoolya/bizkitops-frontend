import { createFileRoute, Link } from "@tanstack/react-router";
import { BLOG_POSTS } from "@/lib/blog-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Calendar, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = BLOG_POSTS.find((p) => p.slug === params.slug);
    if (!post) {
      throw new Error("Post not found");
    }
    return { post };
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    const title = post?.title ? `${post.title} — BizkitOps Blog` : "BizkitOps Blog Article";
    const desc = post?.excerpt ?? "Read the latest SME and business compliance guides from BizkitOps.";
    const keywords = post?.keywords?.join(", ") ?? "";
    const postUrl = `https://bizkitops.app/blog/${post?.slug ?? ""}`;
    const imageUrl = post?.imageUrl ?? "https://bizkitops.app/og-image.png";

    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "keywords", content: keywords },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: postUrl },
        { property: "og:image", content: imageUrl },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: imageUrl },
      ],
      links: [
        { rel: "canonical", href: postUrl }
      ]
    };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { post } = Route.useLoaderData();
  const [copied, setCopied] = useState(false);

  // Recommendations: get up to 2 other posts
  const recommendations = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  let isoDate = "";
  try {
    isoDate = new Date(post.date).toISOString().split("T")[0];
  } catch (e) {
    isoDate = "2026-06-01";
  }

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.imageUrl,
    "datePublished": isoDate,
    "author": {
      "@type": "Person",
      "name": post.author.split(",")[0],
    },
    "publisher": {
      "@type": "Organization",
      "name": "BizkitOps",
      "logo": {
        "@type": "ImageObject",
        "url": "https://bizkitops.app/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://bizkitops.app/blog/${post.slug}`
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Article Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />

      {/* Header */}
      <header className="border-b border-border bg-card/70 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="BizkitOps Logo" className="h-8 w-8 object-contain rounded" />
            <span className="font-display text-xl font-bold">BizkitOps</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/blog" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> All Articles
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="container mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Article (Col span 3) */}
          <article className="lg:col-span-3 space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="bg-primary-soft text-primary border-none">
                  {post.category}
                </Badge>
                <span className="flex items-center gap-1 ml-2">
                  <Calendar className="h-3 w-3" /> {post.date}
                </span>
                <span className="flex items-center gap-1 ml-2">
                  <Clock className="h-3 w-3" /> {post.readTime}
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                {post.title}
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg italic leading-relaxed pt-2">
                "{post.excerpt}"
              </p>
              <div className="flex items-center justify-between py-4 border-y border-border">
                <div className="text-sm">
                  <p className="font-semibold">{post.author.split(",")[0]}</p>
                  <p className="text-xs text-muted-foreground">{post.author.split(",")[1] ?? "Expert Contributor"}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5 text-xs">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  Share Article
                </Button>
              </div>
            </div>

            {/* Featured Image */}
            <div className="h-64 sm:h-96 rounded-2xl overflow-hidden shadow-soft">
              <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
            </div>

            {/* Markdown Body */}
            <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-sm sm:text-base leading-relaxed">
              {post.content.split("\n\n").map((para, i) => {
                const trimmed = para.trim();
                if (trimmed.startsWith("## ")) {
                  return (
                    <h2 key={i} className="font-display text-xl sm:text-2xl font-bold tracking-tight pt-4 border-b border-border pb-2">
                      {trimmed.replace("## ", "")}
                    </h2>
                  );
                }
                if (trimmed.startsWith("### ")) {
                  return (
                    <h3 key={i} className="font-display text-lg sm:text-xl font-bold tracking-tight pt-2">
                      {trimmed.replace("### ", "")}
                    </h3>
                  );
                }
                if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
                  return (
                    <ul key={i} className="list-disc pl-5 space-y-2 text-muted-foreground my-4">
                      {trimmed.split("\n").map((li, idx) => (
                        <li key={idx}>{li.replace(/^[\*\-]\s+/, "")}</li>
                      ))}
                    </ul>
                  );
                }
                if (trimmed.startsWith("1. ")) {
                  return (
                    <ol key={i} className="list-decimal pl-5 space-y-2 text-muted-foreground my-4">
                      {trimmed.split("\n").map((li, idx) => (
                        <li key={idx}>{li.replace(/^\d+\.\s+/, "")}</li>
                      ))}
                    </ol>
                  );
                }
                if (trimmed.startsWith("> ")) {
                  return (
                    <blockquote key={i} className="border-l-4 border-primary pl-4 py-2 italic text-muted-foreground my-4 bg-muted/30 rounded-r">
                      {trimmed.replace(/^>\s+/, "")}
                    </blockquote>
                  );
                }
                if (trimmed) {
                  // Bold markdown parser simple implementation
                  const formatted = trimmed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
                  return (
                    <p
                      key={i}
                      className="text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: formatted }}
                    />
                  );
                }
                return null;
              })}
            </div>

            {/* Article Footer Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase mr-2">Keywords:</span>
              {post.keywords.map((kw) => (
                <Badge key={kw} variant="outline" className="text-xs bg-muted/20 text-muted-foreground">
                  {kw}
                </Badge>
              ))}
            </div>
          </article>

          {/* Sidebar Recommendations */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Promotion Widget */}
              <div className="rounded-2xl border border-primary/20 bg-primary-soft p-5 text-center shadow-soft relative overflow-hidden">
                <Badge className="bg-primary text-primary-foreground mb-3">Upgrade Today</Badge>
                <h3 className="font-display font-bold text-lg leading-snug">Run your business with BizkitOps</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Get premium invoicing, canvas signatures, inventory tracking, and CRM pipeline tools in one unified workspace.
                </p>
                <Button asChild className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/95 shadow-soft">
                  <Link to="/register">Start Free Trial</Link>
                </Button>
                <p className="text-[10px] text-muted-foreground mt-2">7 days free · Cancel anytime</p>
              </div>

              {/* Recommendations */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">Recommended Reads</h3>
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <div key={rec.slug} className="space-y-1">
                      <Badge className="text-[10px] bg-muted text-muted-foreground border-none">
                        {rec.category}
                      </Badge>
                      <h4 className="font-semibold text-sm leading-snug hover:text-primary">
                        <Link to="/blog/$slug" params={{ slug: rec.slug }}>
                          {rec.title}
                        </Link>
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {rec.excerpt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12 bg-card/30">
        <div className="container mx-auto max-w-5xl px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>© 2026 BizkitOps. Made in India.</span>
          <div className="flex gap-4">
            <Link to="/blog" className="hover:text-foreground">Blog Home</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms & Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
