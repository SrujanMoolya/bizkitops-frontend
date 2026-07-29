import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText, Scale, CheckSquare, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions — BizkitOps" },
      {
        name: "description",
        content: "Read the Terms & Conditions governing your use of BizkitOps billing, invoices, store templates, and client portals.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/70 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="BizkitOps Logo" className="h-8 w-8 object-contain rounded" />
            <span className="font-display text-xl font-bold">BizkitOps</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Main content container */}
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary mb-4 shadow-soft">
            <FileText className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Terms and Conditions</h1>
          <p className="text-muted-foreground mt-2">Last updated: June 12, 2026</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Quick reference sidebar */}
          <aside className="md:col-span-1 space-y-4">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Quick Rules</h3>
              <div className="flex items-start gap-2 text-xs">
                <Scale className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Governed under Indian laws and MSME provisions.</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <CheckSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>You remain full owner of all operational files.</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Sub-billing is automatically non-refundable.</span>
              </div>
            </div>
          </aside>

          {/* Legal details body */}
          <article className="md:col-span-3 prose prose-slate dark:prose-invert max-w-none space-y-8">
            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold border-b border-border pb-2">1. Agreement to Terms</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                By accessing or registering on `bizkitops.app` or using our SaaS dashboards, you agree to comply with 
                and be bound by these Terms and Conditions. If you do not accept these terms, you must immediately 
                refrain from accessing our services.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold border-b border-border pb-2">2. Eligibility & Accounts</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                To create a business profile, you must represent a valid sole proprietorship, partnership, LL.P, 
                company, or individual freelancer operating in good legal standing. You are responsible for safeguarding 
                your login keys and password. Any actions executed using your dashboard session will be legally attributed to you.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold border-b border-border pb-2">3. Subscription Trials & Cancellations</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We grant a 7-day complimentary trial of the BizkitOps Pro plan. Once this trial ends, subscription charges 
                based on your chosen tier will apply. Subscriptions are billed on an automated basis (monthly or annually). 
                You may cancel your plan at any time; however, payments are non-refundable and service will continue 
                until the end of the current billing interval.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold border-b border-border pb-2">4. Acceptable System Use</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                You agree not to exploit the invoice designer, public storefronts, and lead pipelines to:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-2">
                <li>Create fraudulent bills, fake receipts, or violate local GST registration regulations.</li>
                <li>Upload spam listings, malware, or prohibited items via storefront pages.</li>
                <li>Send unsolicited messages or spam texts using the WhatsApp link interfaces.</li>
                <li>Scrape, reverse-engineer, or overload the BizkitOps hosting nodes.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold border-b border-border pb-2">5. Service Availability Disclaimer</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                BizkitOps is provided on an "as-is" and "as-available" basis. While we strive to maintain 99.9% application 
                uptime and perform daily secure backups, we do not warrant that billing services will be entirely free of 
                intermittent network delays. We hold no liability for lost profit margins or tax calculation discrepancies. 
                Business compliance and tax filing remain your sole responsibility.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold border-b border-border pb-2">6. Intellectual Property & Ownership</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                BizkitOps software, styling tokens, responsive grids, and source codes are properties of BizkitOps Technologies. 
                You retain complete, exclusive ownership of your business data, logo files, and customer lists. We represent 
                no claim over customer databases loaded into the CRM.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold border-b border-border pb-2">7. Governing Jurisdiction</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                These Terms are governed and interpreted under the laws of the Republic of India. Any disputes or litigation 
                arising from this platform will be submitted exclusively to the competent courts of Bengaluru, Karnataka.
              </p>
            </section>
          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12 bg-card/30">
        <div className="container mx-auto max-w-5xl px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>© 2026 BizkitOps. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link to="/" className="hover:text-foreground">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
