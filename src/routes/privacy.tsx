import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Mail, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — BizkitOps" },
      {
        name: "description",
        content: "Read our privacy policy to understand how BizkitOps securely collects, processes, and protects your business and customer details.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
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
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground mt-2">Last updated: June 12, 2026</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Quick reference sidebar */}
          <aside className="md:col-span-1 space-y-4">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Quick Info</h3>
              <div className="flex items-start gap-2 text-xs">
                <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>We use 256-bit encryption for all records.</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <Globe className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Your customer data is never shared or sold.</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Reach us at support@bizkitops.app</span>
              </div>
            </div>
          </aside>

          {/* Legal details body */}
          <article className="md:col-span-3 prose prose-slate dark:prose-invert max-w-none space-y-8">
            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold border-b border-border pb-2">1. Overview</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                BizkitOps ("we", "our", "us") respects your privacy. This policy explains how we collect, handle, 
                and protect information when you register and use the BizkitOps software application and related 
                websites. By utilizing our services, you consent to the processes outlined in this Privacy Policy.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold border-b border-border pb-2">2. Information Collection</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We gather information required to successfully provide you with ERP and billing services, including:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-2">
                <li>
                  <strong>Account Profile:</strong> Contact details such as name, email address, password, 
                  phone number, and business details (business name, category, location, and GSTIN).
                </li>
                <li>
                  <strong>Business Operations Data:</strong> Invoices generated, catalog listings, inventory 
                  counts, expense receipts, lead details, staff roster, and appointment booking entries.
                </li>
                <li>
                  <strong>Usage Telemetry:</strong> Log data, device descriptors, browser variants, and click 
                  statistics gathered via cookies to optimize frontend speeds.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold border-b border-border pb-2">3. Storage & Encryption</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Our databases are managed securely using Supabase. All database connections and transit requests 
                leverage TLS 1.3 transport security. Sensitive columns (including auth profiles) are stored using 
                AES-256 standard encryption. Backups are performed daily and kept in encrypted storage slots.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold border-b border-border pb-2">4. Payment Processing</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Subscription payments are securely routed and processed through authorized gateways (including 
                Razorpay & Stripe). BizkitOps does not store raw credit card numbers or banking passwords on 
                our local servers. All payment flows comply strictly with PCI-DSS guidelines.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold border-b border-border pb-2">5. Data Sharing Policies</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                <strong>BizkitOps has a zero-monetization policy on your user data.</strong> We will never sell, lease, 
                or transfer your business records, invoices, or customer databases to third-party ad networks or data brokers. 
                Data sharing is limited to:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-2">
                <li>Underlying platform vendors required to run the service (Supabase DB, hosting servers).</li>
                <li>Compliance requests where we are legally mandated by a formal regulatory authority or court order.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold border-b border-border pb-2">6. Your Rights</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                You possess full access to modify or delete your account records. You can download your reports (CSV/Excel) 
                at any time from your dashboard. If you request account closure, all active business records will be purged 
                from our live database nodes within 14 business days.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold border-b border-border pb-2">7. Contact Information</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                If you have questions regarding this privacy policy or wish to initiate a formal data retrieval, 
                please email us at: <a href="mailto:support@bizkitops.app" className="text-primary hover:underline">support@bizkitops.app</a>.
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
            <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link to="/" className="hover:text-foreground">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
