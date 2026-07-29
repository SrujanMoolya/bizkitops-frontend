import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BLOG_POSTS } from "@/lib/blog-data";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Clock, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blogs & Guides — BizkitOps" },
      {
        name: "description",
        content: "Learn how to optimize your invoicing, manage inventory, calculate GST, and use CRM tools to grow your business in India.",
      },
    ],
  }),
  component: BlogIndexPage,
});

function BlogIndexPage() {
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setSessionLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(BLOG_POSTS.map((p) => p.category)));

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory ? post.category === selectedCategory : true;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/70 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="BizkitOps Logo" className="h-8 w-8 object-contain rounded" />
            <span className="font-display text-xl font-bold">BizkitOps</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/">Home</Link>
            </Button>
            {sessionLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : session?.user ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/dashboard/settings">Profile</Link>
                </Button>
                <Button asChild size="sm" className="shadow-soft bg-primary hover:bg-primary/95 text-primary-foreground">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild size="sm" className="shadow-soft bg-primary hover:bg-primary/95 text-primary-foreground">
                  <Link to="/register">Start Free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-hero-gradient py-12 md:py-16 border-b border-border">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary mb-4 shadow-soft">
            <BookOpen className="h-5 w-5" />
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
            BizkitOps Growth Blog
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-base">
            Expert insights, tactical guides, and regulatory resources to help Indian retail and service businesses scale successfully.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <main className="container mx-auto max-w-6xl px-4 py-10">
        {/* Search & Category Filter bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search guides, keywords, topics..."
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="rounded-full"
            >
              All Topics
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="rounded-full"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Blog Posts list */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredPosts.map((post) => (
              <Card key={post.slug} className="flex flex-col overflow-hidden border border-border shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all">
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover hover:scale-105 transition duration-500"
                  />
                  <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                    {post.category}
                  </Badge>
                </div>
                <CardHeader className="flex-1 p-5">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {post.readTime}
                    </span>
                  </div>
                  <CardTitle className="font-display font-bold text-xl leading-snug line-clamp-2 hover:text-primary">
                    <Link to="/blog/$slug" params={{ slug: post.slug }}>
                      {post.title}
                    </Link>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </CardHeader>
                <CardFooter className="p-5 pt-0 border-t border-border mt-auto flex items-center justify-between">
                  <span className="text-xs text-muted-foreground italic font-medium">By {post.author.split(",")[0]}</span>
                  <Button asChild size="sm" variant="ghost" className="text-primary gap-1 p-0 hover:bg-transparent hover:underline">
                    <Link to="/blog/$slug" params={{ slug: post.slug }}>
                      Read article →
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card">
            <p className="text-muted-foreground text-base">No articles found matching your query.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(""); setSelectedCategory(null); }}>
              Reset Filters
            </Button>
          </div>
        )}

        {/* Newsletter Callout */}
        <section className="mt-16 rounded-3xl bg-secondary text-secondary-foreground p-8 md:p-12 text-center shadow-card relative overflow-hidden">
          <div className="relative z-10 max-w-xl mx-auto">
            <Badge className="bg-primary text-primary-foreground mb-3">MSME Newsletter</Badge>
            <h2 className="font-display text-2xl md:text-3xl font-bold">Get smart business tips in your inbox</h2>
            <p className="mt-2 text-sm opacity-90 leading-relaxed">
              We send practical operational tutorials, GST deadline reminders, and ERP templates once a fortnight. No spam, ever.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); alert("Thanks for subscribing!"); }} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <Input
                type="email"
                required
                placeholder="Enter business email"
                className="bg-card text-foreground border-transparent placeholder:text-muted-foreground"
              />
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/95 shrink-0">
                Subscribe
              </Button>
            </form>
          </div>
          {/* Subtle decorative ring background */}
          <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full border-4 border-primary/10" />
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full border-4 border-primary/10" />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card/30">
        <div className="container mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="BizkitOps Logo" className="h-6 w-6 object-contain rounded" />
            <span>© 2026 BizkitOps Technologies. Made in India.</span>
          </div>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms & Conditions</Link>
            <Link to="/" className="hover:text-foreground">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
