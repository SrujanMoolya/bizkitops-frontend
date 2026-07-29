import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  CheckCircle2,
  Receipt,
  Wallet,
  Package,
  Users,
  Calendar,
  Globe,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Star,
  Zap,
  Plus,
  Minus,
  Check,
  Building2,
  Lock,
  ThumbsUp,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BizkitOps — All-in-one Business OS for Indian MSMEs & Retailers" },
      {
        name: "description",
        content:
          "Create GST-ready invoices, track expenses, manage inventory, schedule appointments, run a simple CRM, and launch your free storefront website. All-in-one app for Indian MSMEs from ₹499/month.",
      },
      {
        name: "keywords",
        content:
          "Best Business Management Software 2026, End-to-end ERP software - Fully integrated systems, Business ERP Software | Try Free for 7 Days, ERP Software for India, GST billing software, Kirana shop billing app, business management app, simple CRM India, online booking software, expense tracker, inventory management, MSME business software, Vyapar alternative, Khatabook online, BizkitOps, best business management software for small business in India, end-to-end ERP software for MSME, free trial ERP software India, SME business management app India, fully integrated business systems for retailers, all in one business OS, best GST billing and inventory management software, online invoice generator for small business India, lead management and CRM software for Indian startups, appointment booking and scheduling software India, free storefront website builder for local shops, cloud based business ERP software India, GST compliant invoicing and bookkeeping software",
      },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { property: "og:title", content: "BizkitOps — All-in-one Business OS for Indian MSMEs & Retailers" },
      {
        property: "og:description",
        content:
          "Streamline your business with GST invoicing, expense tracking, inventory management, drag-and-drop CRM, online appointment booking, and a free business website storefront.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://bizkitops.app" },
      { property: "og:image", content: "https://bizkitops.app/og-image.png" },
      { property: "og:site_name", content: "BizkitOps" },
      { property: "og:locale", content: "en_IN" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "BizkitOps — All-in-one Business OS for Indian MSMEs" },
      {
        name: "twitter:description",
        content: "Run your entire business from one simple app. Invoicing, inventory, CRM, appointments & free storefront.",
      },
      { name: "twitter:image", content: "https://bizkitops.app/og-image.png" },
    ],
    links: [
      { rel: "canonical", href: "https://bizkitops.app" }
    ]
  }),
  component: Landing,
});

const features = [
  {
    icon: Receipt,
    name: "GST Invoicing",
    desc: "Create professional GST-compliant invoices with signatures and company seals in under 30 seconds. Share on WhatsApp instantly.",
  },
  {
    icon: Wallet,
    name: "Expense Tracking",
    desc: "Snap receipts, tag categories, and generate reports. Never lose track of your input tax credits (ITC) again.",
  },
  {
    icon: Package,
    name: "Smart Inventory",
    desc: "Track real-time stock levels with automatic low-stock notifications and supplier purchase order automation.",
  },
  {
    icon: Users,
    name: "CRM & Pipelines",
    desc: "A visual drag-and-drop kanban board built for Indian small businesses. Close and follow up with hot leads directly.",
  },
  {
    icon: Calendar,
    name: "Appointment Scheduler",
    desc: "Let clients book service slots online. Automatic WhatsApp and email alerts reduce appointment no-shows.",
  },
  {
    icon: Globe,
    name: "Business Storefront",
    desc: "Your own web storefront at bizkitops.app/store/yourname — showcase services, gather client reviews, and take bookings.",
  },
];

const benefits = [
  { icon: Smartphone, label: "Mobile-first layout — manages on any phone screen" },
  { icon: MessageCircle, label: "WhatsApp-friendly document sharing built-in" },
  { icon: ShieldCheck, label: "Secure cloud database with automatic daily backups" },
  { icon: Zap, label: "Get started and live in under 5 minutes" },
];

const plans = [
  {
    name: "Basic",
    price: "₹499",
    period: "/month",
    tag: "For solo founders & small shops",
    features: [
      "Up to 50 invoices/month",
      "GST billing settings",
      "Customers & expense tracking",
      "Inventory (up to 100 items)",
      "Standard email support",
    ],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Pro",
    price: "₹999",
    period: "/month",
    tag: "Most popular choice",
    features: [
      "Unlimited invoices & signatures",
      "Interactive CRM + Lead board",
      "Online appointment slots",
      "Custom storefront with reviews",
      "Roster staff logins (up to 5 staff)",
      "Priority WhatsApp support",
    ],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Custom / Enterprise",
    price: "Talk to us",
    period: "",
    tag: "For growing teams & dealers",
    features: [
      "Unlimited everything",
      "Custom ERP modules built for you",
      "Dedicated account success manager",
      "On-call data migration & setup",
      "Custom email/SMS gateway integration",
    ],
    cta: "Contact sales",
    highlight: false,
  },
];

const testimonials = [
  {
    name: "Ramesh Shetty",
    role: "Owner, Coastal Bites — Mangalore",
    quote:
      "Earlier I was juggling 3 different applications for billing, stock, and booking. BizkitOps replaced all of them. My CA loves how organized the GST reports are.",
  },
  {
    name: "Priya Iyer",
    role: "Founder, Bloom Salon — Bengaluru",
    quote:
      "Online slot booking cut down my salon's no-shows by more than 50%. The public storefront page brought in over 40 walk-in bookings last month alone.",
  },
  {
    name: "Arjun Patel",
    role: "MD, Patel Hardware — Surat",
    quote:
      "Finally, business software that my on-field staff actually uses. The automated low-stock warnings saved us twice from running out of fast-moving products.",
  },
];

const faqs = [
  {
    q: "Is there really a free trial? Do you require a card?",
    a: "Yes — 7 days, full Pro level access. No credit card, no debit card, and no billing details are required to start your trial. You can cancel at any time.",
  },
  {
    q: "How does the GST invoicing system work?",
    a: "BizkitOps calculates CGST, SGST, and IGST automatically based on your shop's state and your buyer's state. You can also print customized UPI QR codes on the invoice for fast payment collections.",
  },
  {
    q: "Can I manage everything from my smartphone?",
    a: "Yes. BizkitOps is designed mobile-first. Most of our active merchants operate their businesses exclusively on their mobile phones, keeping track of sales, inventory, and staff rosters from anywhere.",
  },
  {
    q: "What is the custom Business Storefront website?",
    a: "Every registered business gets a public mini-site (e.g., bizkitops.app/store/your-business) where buyers can browse services, look at catalogs, leave verified reviews, and book service appointments.",
  },
  {
    q: "Is my database secure?",
    a: "We use banking-grade encryption standards for database columns and transit paths. Daily secure backups are taken automatically. Your business records remain yours and are never shared or sold.",
  },
];

function Landing() {
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

  const [activeWidgetTab, setActiveWidgetTab] = useState<"invoice" | "inventory" | "crm" | "storefront">("invoice");

  // State for Invoice Widget
  const [invoiceItems, setInvoiceItems] = useState([
    { name: "Wireless Keyboard", price: 1200, qty: 1 },
    { name: "Ergonomic Mouse", price: 800, qty: 1 },
  ]);
  const [gstType, setGstType] = useState<"cgst_sgst" | "igst">("cgst_sgst");
  const [showSigned, setShowSigned] = useState(false);

  // State for Inventory Widget
  const [inventoryItems, setInventoryItems] = useState([
    { id: 1, name: "Premium Cables", stock: 12, lowStockThreshold: 5 },
    { id: 2, name: "Smart Adapters", stock: 4, lowStockThreshold: 5 },
    { id: 3, name: "Desk Mats", stock: 25, lowStockThreshold: 5 },
  ]);

  // State for CRM Widget
  const [leads, setLeads] = useState([
    { id: "lead-1", name: "Rohan Das (Bulk Order)", amt: "₹45,000", stage: "Lead" },
    { id: "lead-2", name: "Ananya Sen (Consultation)", amt: "₹12,000", stage: "Contacted" },
    { id: "lead-3", name: "Suresh Rao (Deal Draft)", amt: "₹75,000", stage: "Proposal" },
  ]);

  // State for Storefront Widget
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Math helper for invoice
  const subtotal = invoiceItems.reduce((acc, curr) => acc + curr.price * curr.qty, 0);
  const taxRate = 0.18; // 18% GST
  const gstAmount = subtotal * taxRate;
  const totalAmount = subtotal + gstAmount;

  // Add/Sub quantity
  const updateQty = (index: number, delta: number) => {
    const updated = [...invoiceItems];
    updated[index].qty = Math.max(1, updated[index].qty + delta);
    setInvoiceItems(updated);
  };

  // Inventory Restock / Simulate sale
  const adjustStock = (id: number, delta: number) => {
    setInventoryItems(
      inventoryItems.map((item) => {
        if (item.id === id) {
          return { ...item, stock: Math.max(0, item.stock + delta) };
        }
        return item;
      })
    );
  };

  // Move Lead
  const moveLead = (id: string, dir: "next" | "prev") => {
    const stages = ["Lead", "Contacted", "Proposal", "Won"];
    setLeads(
      leads.map((lead) => {
        if (lead.id === id) {
          const currIdx = stages.indexOf(lead.stage);
          let nextIdx = currIdx;
          if (dir === "next" && currIdx < stages.length - 1) nextIdx++;
          if (dir === "prev" && currIdx > 0) nextIdx--;
          return { ...lead, stage: stages[nextIdx] };
        }
        return lead;
      })
    );
  };

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://bizkitops.app/#software",
        "name": "BizkitOps",
        "url": "https://bizkitops.app",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web, Mobile, Android, iOS",
        "offers": {
          "@type": "AggregateOffer",
          "priceCurrency": "INR",
          "lowPrice": "499.00",
          "highPrice": "999.00",
          "offerCount": "2",
          "priceValuedRanges": "monthly"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "ratingCount": "154"
        },
        "featureList": [
          "GST-compliant Invoicing & Billing",
          "Expense Tracking & Receipt Log",
          "Inventory Stock Alerts & Levels",
          "CRM Lead Pipeline & WhatsApp Messaging",
          "Online Appointment Booking & Scheduling",
          "Instant Business Storefront Website"
        ]
      },
      {
        "@type": "Organization",
        "@id": "https://bizkitops.app/#organization",
        "name": "BizkitOps India",
        "url": "https://bizkitops.app",
        "logo": {
          "@type": "ImageObject",
          "url": "https://bizkitops.app/logo.png"
        },
        "description": "Providing affordable, mobile-first business management software solutions for Indian MSMEs and retail merchants.",
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "email": "support@bizkitops.app",
          "availableLanguage": ["English", "Hindi", "Kannada"]
        }
      },
      {
        "@type": "ItemList",
        "@id": "https://bizkitops.app/#navigation",
        "name": "Main Navigation Menu",
        "itemListElement": [
          {
            "@type": "SiteNavigationElement",
            "position": 1,
            "name": "SME Blog & Guides",
            "url": "https://bizkitops.app/blog"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 2,
            "name": "Contact Support & Sales",
            "url": "https://bizkitops.app/contact"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 3,
            "name": "Login",
            "url": "https://bizkitops.app/login"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 4,
            "name": "Register & Start Free Trial",
            "url": "https://bizkitops.app/register"
          }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": "https://bizkitops.app/#faq",
        "mainEntity": faqs.map((faq) => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a,
          },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden font-sans">
      
      {/* Motion Graphics & Glowing Blob Backgrounds */}
      <style>{`
        @keyframes float-blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float-blob-reverse {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-40px, 40px) scale(1.15); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: float-blob 20s infinite ease-in-out;
        }
        .animate-blob-reverse {
          animation: float-blob-reverse 25s infinite ease-in-out;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .glass-panel {
          background: rgba(var(--card), 0.7);
          backdrop-filter: blur(12px);
          border: 1px border-border;
        }
      `}</style>

      {/* Decorative Blob 1 */}
      <div className="absolute top-[8%] left-[-10%] w-[35rem] h-[35rem] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-blob z-0" />
      {/* Decorative Blob 2 */}
      <div className="absolute top-[35%] right-[-10%] w-[30rem] h-[30rem] bg-accent/8 rounded-full blur-[100px] pointer-events-none animate-blob-reverse z-0" />
      {/* Decorative Blob 3 */}
      <div className="absolute bottom-[10%] left-[5%] w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[130px] pointer-events-none animate-blob z-0" />

      {/* Schema Markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      {/* Header */}
      <header className="border-b border-border bg-card/75 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="BizkitOps Logo" className="h-8 w-8 object-contain rounded" />
            <span className="font-display text-xl font-bold tracking-tight">BizkitOps</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-foreground transition-colors">
              Live Demo
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">
              Reviews
            </a>
            <Link to="/blog" className="hover:text-foreground transition-colors">
              Blog & Guides
            </Link>
          </nav>
          <div className="flex items-center gap-2">
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

      {/* Hero Section */}
      <section className="relative z-10 px-4 pt-16 pb-20 md:pt-24 md:pb-28 text-center animate-fade-in-up">
        <div className="container mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft/80 px-4 py-1.5 text-xs font-semibold text-primary mb-8 shadow-soft">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            Empowering 1,200+ Indian MSMEs & Retailers Nationwide
          </div>
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none text-foreground max-w-4xl mx-auto">
            Run your entire business <br className="hidden sm:block" />
            from <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">one simple dashboard.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            GST compliant invoicing, instant expense logs, real-time stock alerts, simple lead pipelines, online appointments, and your own public storefront website. From ₹499/month.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {sessionLoading ? (
              <div className="h-12 w-48 animate-pulse rounded-xl bg-muted" />
            ) : session?.user ? (
              <Button asChild size="lg" className="gap-2 shadow-card bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold px-6 py-6 rounded-xl">
                <Link to="/dashboard">
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="gap-2 shadow-card bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold px-6 py-6 rounded-xl">
                  <Link to="/register">
                    Start 7-Day Free Trial <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="px-6 py-6 rounded-xl text-sm font-medium hover:bg-muted/30">
                  <Link to="/login">Access Dashboard</Link>
                </Button>
              </>
            )}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs sm:text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-accent shrink-0" /> No credit card setup
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-accent shrink-0" /> GST-compliant reports
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-accent shrink-0" /> WhatsApp bill sharing
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-accent shrink-0" /> Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Trust Strip & Benefits */}
      <section className="relative z-10 border-y border-border bg-card/50 backdrop-blur-md">
        <div className="container mx-auto max-w-6xl px-4 py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {benefits.map((b) => (
            <div
              key={b.label}
              className="flex items-center gap-3.5 text-sm text-muted-foreground font-medium"
            >
              <div className="h-10 w-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0 shadow-soft">
                <b.icon className="h-5 w-5" />
              </div>
              <span className="leading-snug">{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3D App Showcase Section */}
      <section className="relative z-10 py-24 bg-gradient-to-b from-card/30 via-background to-card/50 overflow-hidden border-b border-border">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-semibold px-3 py-1 text-xs">
                <Smartphone className="h-3.5 w-3.5 mr-1" /> Mobile Experience
              </Badge>
              <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
                Run your business from anywhere with our <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Android App</span>
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Scan barcodes directly with your phone's camera, create and send GST invoices via WhatsApp on the go, track live inventory levels, and manage customer relations from the palm of your hand.
              </p>
              
              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Offline-First Invoicing</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Create invoices without an active internet connection. Automatically syncs once online.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Fast WhatsApp Sharing</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Share PDF bills, ledger reports, and payment links with single-tap WhatsApp integration.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Barcode Scanner Tool</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Use your mobile camera as a point-of-sale scanner to load inventory items instantly.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <a
                  href="https://play.google.com/store/apps/details?id=com.svvaap.bizkitops"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-2xl px-6 py-3.5 transition-all duration-300 transform hover:-translate-y-1 shadow-card group"
                >
                  <svg className="h-7 w-7 text-white fill-current" viewBox="0 0 512 512">
                    <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58 33.1-60.1-60.1 60.1-60.1 58 33.1c18.5 10.6 18.5 33.4 0 44zM325.3 277.7l60.1 60.1L104.6 499l220.7-221.3z" />
                  </svg>
                  <div className="text-left leading-none">
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">Get it on</span>
                    <span className="text-base font-extrabold block mt-0.5">Google Play</span>
                  </div>
                </a>
                <div className="text-xs text-muted-foreground font-medium bg-muted/40 border border-border px-4 py-2.5 rounded-xl">
                  🍎 iOS version coming Q4 2026
                </div>
              </div>
            </div>

            {/* Right Column: 3D Showcase */}
            <div className="lg:col-span-6 flex justify-center items-center py-10 relative">
              <style>{`
                .phone-container {
                  perspective: 1200px;
                }
                .phone-3d {
                  transform: rotateY(-18deg) rotateX(12deg) rotateZ(4deg);
                  transform-style: preserve-3d;
                  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s ease;
                }
                .phone-container:hover .phone-3d {
                  transform: rotateY(-8deg) rotateX(6deg) rotateZ(2deg) scale(1.03);
                  box-shadow: 25px 25px 60px rgba(0,0,0,0.55), -5px -5px 30px rgba(255,255,255,0.05);
                }
                .phone-card-1 {
                  transform: translateZ(50px) translateX(-50px) translateY(80px);
                  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .phone-container:hover .phone-card-1 {
                  transform: translateZ(80px) translateX(-70px) translateY(70px);
                }
                .phone-card-2 {
                  transform: translateZ(30px) translateX(120px) translateY(-60px);
                  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .phone-container:hover .phone-card-2 {
                  transform: translateZ(60px) translateX(140px) translateY(-50px);
                }
              `}</style>

              <div className="phone-container relative w-full flex justify-center items-center">
                {/* 3D Phone Body */}
                <div className="phone-3d relative w-[280px] sm:w-[300px] aspect-[9/18.5] rounded-[48px] bg-neutral-950 border-[6px] border-neutral-800 p-2.5 shadow-[15px_15px_40px_rgba(0,0,0,0.5),-5px_-5px_20px_rgba(255,255,255,0.02)] z-10 overflow-hidden">
                  
                  {/* Dynamic Island / Notch */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-between px-3 text-[8px] text-white/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span>BizkitOps OS</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-700" />
                  </div>

                  {/* Reflection gloss layer */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-20" />

                  {/* Simulated Screen Content */}
                  <div className="w-full h-full rounded-[38px] bg-neutral-900 border border-neutral-800 overflow-hidden relative flex flex-col p-4 text-left select-none text-white">
                    {/* Status Bar */}
                    <div className="flex justify-between items-center text-[10px] font-semibold opacity-70 pt-2 pb-4 px-2">
                      <span>12:30</span>
                      <div className="flex items-center gap-1.5">
                        <span>5G</span>
                        <div className="w-4 h-2.5 border border-white/60 rounded-sm p-0.5 flex items-center"><div className="w-full h-full bg-white rounded-xs" /></div>
                      </div>
                    </div>

                    {/* App Header */}
                    <div className="flex justify-between items-center px-1 mb-5">
                      <div>
                        <span className="text-[10px] opacity-60 block">Welcome back</span>
                        <span className="text-sm font-bold block">Grand Store</span>
                      </div>
                      <span className="bg-primary/10 border border-primary/20 text-primary text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-primary" /> Live
                      </span>
                    </div>

                    {/* Screen Quick Stats Card */}
                    <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-2xl p-3 space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] opacity-70">Today's Sales</span>
                        <span className="text-[9px] text-green-500 font-bold flex items-center gap-0.5">
                          ▲ +14%
                        </span>
                      </div>
                      <div className="text-xl font-extrabold">₹18,450</div>
                      <div className="w-full bg-neutral-700/50 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary w-2/3 h-full rounded-full" />
                      </div>
                    </div>

                    {/* Quick Action POS Button */}
                    <div className="bg-primary hover:bg-primary/95 text-primary-foreground rounded-2xl p-3 flex items-center justify-between mb-4 shadow-md transition cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center">
                          <Smartphone className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold block leading-tight">Billing Keyboard</span>
                          <span className="text-[8px] opacity-80 block">Tap to open instant POS</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 opacity-80" />
                    </div>

                    {/* Invoice Item list simulation */}
                    <div className="flex-1 space-y-2.5 overflow-hidden">
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 px-1 block">Recent invoices</span>

                      <div className="bg-neutral-800/40 rounded-xl p-2.5 flex items-center justify-between border border-neutral-800/50">
                        <div>
                          <span className="text-[10px] font-semibold block leading-tight">#INV-2026-921</span>
                          <span className="text-[8px] opacity-50 block">Ramesh K. • 12:15 PM</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold block">₹2,840</span>
                          <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[8px] px-1.5 py-0.2 rounded-full font-bold">Paid</span>
                        </div>
                      </div>

                      <div className="bg-neutral-800/40 rounded-xl p-2.5 flex items-center justify-between border border-neutral-800/50">
                        <div>
                          <span className="text-[10px] font-semibold block leading-tight">#INV-2026-920</span>
                          <span className="text-[8px] opacity-50 block">Preeti S. • 11:40 AM</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold block">₹12,500</span>
                          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] px-1.5 py-0.2 rounded-full font-bold">Unpaid</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Nav Bar inside Screen */}
                    <div className="border-t border-neutral-800 pt-3 mt-2 flex justify-between items-center px-2 text-[9px] opacity-80">
                      <div className="flex flex-col items-center gap-0.5 text-primary">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary mb-0.5" />
                        <span>Home</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 opacity-60">
                        <span>🧾 bills</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 opacity-60">
                        <span>📦 stock</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 opacity-60">
                        <span>⚙️ settings</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating 3D Cards */}
                {/* Floating Card 1: GST Sent */}
                <div className="phone-card-1 absolute z-20 bg-card border border-border/80 rounded-2xl p-4 shadow-2xl flex items-center gap-3 max-w-[170px] pointer-events-none select-none">
                  <div className="h-8 w-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                    ✅
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">WhatsApp Invoicing</span>
                    <span className="text-xs font-bold text-foreground block">Bill Sent to Client</span>
                  </div>
                </div>

                {/* Floating Card 2: Low Stock Warning */}
                <div className="phone-card-2 absolute z-0 bg-card border border-border/80 rounded-2xl p-4 shadow-2xl flex items-center gap-3 max-w-[170px] pointer-events-none select-none">
                  <div className="h-8 w-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                    ⚠️
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Inventory Control</span>
                    <span className="text-xs font-bold text-foreground block">Maggi - Low Stock!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Demo Widget Section */}
      <section id="demo" className="relative z-10 container mx-auto max-w-5xl px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-3 bg-accent/10 text-accent hover:bg-accent/10 border-none font-semibold px-3 py-1">
            <Sparkles className="h-3 w-3 mr-1" /> Try it now
          </Badge>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight">
            See how easy it works
          </h2>
          <p className="text-muted-foreground mt-3 text-sm sm:text-base">
            Click the tabs below to interact with a simplified live simulation of our business modules.
          </p>
        </div>

        {/* Demo Window Wrapper */}
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          {/* Tab Selector */}
          <div className="flex flex-wrap border-b border-border bg-muted/20">
            <button
              onClick={() => setActiveWidgetTab("invoice")}
              className={`flex-1 min-w-[120px] px-5 py-4 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeWidgetTab === "invoice"
                  ? "border-primary text-primary bg-card"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
              }`}
            >
              <Receipt className="h-4 w-4" /> GST Invoices
            </button>
            <button
              onClick={() => setActiveWidgetTab("inventory")}
              className={`flex-1 min-w-[120px] px-5 py-4 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeWidgetTab === "inventory"
                  ? "border-primary text-primary bg-card"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
              }`}
            >
              <Package className="h-4 w-4" /> Stock Control
            </button>
            <button
              onClick={() => setActiveWidgetTab("crm")}
              className={`flex-1 min-w-[120px] px-5 py-4 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeWidgetTab === "crm"
                  ? "border-primary text-primary bg-card"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
              }`}
            >
              <Users className="h-4 w-4" /> CRM Pipeline
            </button>
            <button
              onClick={() => setActiveWidgetTab("storefront")}
              className={`flex-1 min-w-[120px] px-5 py-4 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeWidgetTab === "storefront"
                  ? "border-primary text-primary bg-card"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
              }`}
            >
              <Globe className="h-4 w-4" /> Storefront Page
            </button>
          </div>

          {/* Tab Content Display */}
          <div className="p-6 min-h-[360px] flex flex-col justify-between">
            {/* INVOICE TAB */}
            {activeWidgetTab === "invoice" && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <h3 className="font-bold text-base">Invoice #INV-2026-004</h3>
                    <p className="text-xs text-muted-foreground">Client: Rajesh Kumar · Bengaluru</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={gstType === "cgst_sgst" ? "default" : "outline"}
                      onClick={() => setGstType("cgst_sgst")}
                    >
                      CGST + SGST (Intrastate)
                    </Button>
                    <Button
                      size="sm"
                      variant={gstType === "igst" ? "default" : "outline"}
                      onClick={() => setGstType("igst")}
                    >
                      IGST (Interstate)
                    </Button>
                  </div>
                </div>

                {/* Items rows */}
                <div className="space-y-2.5">
                  {invoiceItems.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between bg-muted/30 p-3 rounded-lg text-sm">
                      <div className="font-semibold">{item.name}</div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">₹{item.price}</span>
                        <div className="flex items-center gap-2 border border-border rounded bg-card px-1.5 py-0.5">
                          <button onClick={() => updateQty(idx, -1)} className="hover:text-primary">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-4 text-center font-bold text-xs">{item.qty}</span>
                          <button onClick={() => updateQty(idx, 1)} className="hover:text-primary">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="font-bold w-16 text-right">₹{item.price * item.qty}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculations block */}
                <div className="border-t border-border pt-3 flex flex-col items-end text-xs space-y-1">
                  <div className="flex justify-between w-48 text-muted-foreground">
                    <span>Subtotal:</span>
                    <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {gstType === "cgst_sgst" ? (
                    <>
                      <div className="flex justify-between w-48 text-muted-foreground">
                        <span>CGST (9%):</span>
                        <span className="font-semibold">₹{(gstAmount / 2).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between w-48 text-muted-foreground">
                        <span>SGST (9%):</span>
                        <span className="font-semibold">₹{(gstAmount / 2).toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between w-48 text-muted-foreground">
                      <span>IGST (18%):</span>
                      <span className="font-semibold">₹{gstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between w-48 text-sm font-bold border-t border-border pt-1.5 mt-1 text-primary">
                    <span>Grand Total:</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Signature Demo */}
                <div className="flex justify-between items-center bg-accent-soft/40 p-3 rounded-lg border border-accent/25">
                  <div className="text-xs">
                    <span className="font-semibold text-accent block">Digital Authorizations</span>
                    <span className="text-muted-foreground">Include canvas draws and stamp PNGs instantly on PDFs.</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSigned(!showSigned)}
                    className="text-xs bg-card hover:bg-muted"
                  >
                    {showSigned ? "Remove Signature" : "Apply Signed Seal"}
                  </Button>
                </div>

                {showSigned && (
                  <div className="flex justify-end pr-8">
                    <div className="border border-dashed border-primary/40 bg-card p-2 rounded flex flex-col items-center shadow-soft animate-fade-in-up">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Authorized Signatory</span>
                      <span className="font-display font-bold italic text-primary text-sm font-cursive tracking-wider" style={{ fontFamily: "'Great Vibes', cursive" }}>
                        Rajesh Kumar
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* INVENTORY TAB */}
            {activeWidgetTab === "inventory" && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="border-b border-border pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-base">Current Store Stock</h3>
                    <p className="text-xs text-muted-foreground">Auto-updates as you bill items on invoices.</p>
                  </div>
                  <Badge className="bg-primary text-primary-foreground text-xs">3 Items Logged</Badge>
                </div>

                <div className="space-y-2.5">
                  {inventoryItems.map((item) => {
                    const isLow = item.stock <= item.lowStockThreshold;
                    return (
                      <div key={item.id} className="flex items-center justify-between bg-muted/30 p-3 rounded-lg text-sm">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{item.name}</span>
                          {isLow && (
                            <Badge className="bg-red-500 text-white text-[10px] uppercase font-bold animate-pulse hover:bg-red-500">
                              Low Stock Warning
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`font-bold ${isLow ? "text-red-500" : "text-foreground"}`}>
                            {item.stock} units
                          </span>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => adjustStock(item.id, -1)} className="h-7 px-2">
                              Sell 1
                            </Button>
                            <Button size="sm" variant="default" onClick={() => adjustStock(item.id, 5)} className="h-7 px-2 bg-primary">
                              Restock 5
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-muted/20 p-3 rounded-lg border border-border text-xs text-muted-foreground">
                  <strong>💡 How alerts work:</strong> When stock drops below 5 units, BizkitOps flashes low stock highlights and tags alerts directly to your reports dashboard so you can order replacement stock on time.
                </div>
              </div>
            )}

            {/* CRM TAB */}
            {activeWidgetTab === "crm" && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="border-b border-border pb-3">
                  <h3 className="font-bold text-base">Retail CRM Leads Pipeline</h3>
                  <p className="text-xs text-muted-foreground">Track pipeline opportunities from inquiry to final checkout.</p>
                </div>

                {/* Kanban simulation grid */}
                <div className="grid grid-cols-4 gap-2.5">
                  {["Lead", "Contacted", "Proposal", "Won"].map((stage) => {
                    const stageLeads = leads.filter((l) => l.stage === stage);
                    return (
                      <div key={stage} className="bg-muted/40 p-2.5 rounded-lg border border-border/70 flex flex-col min-h-[160px]">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase mb-2 block border-b border-border pb-1">
                          {stage} ({stageLeads.length})
                        </span>
                        <div className="space-y-2 flex-1">
                          {stageLeads.map((lead) => (
                            <div key={lead.id} className="bg-card p-2 rounded border border-border shadow-soft text-xs space-y-2">
                              <div>
                                <p className="font-bold truncate">{lead.name}</p>
                                <p className="text-[10px] text-primary font-semibold">{lead.amt}</p>
                              </div>
                              <div className="flex gap-1 justify-end pt-1 border-t border-border/50">
                                <button
                                  onClick={() => moveLead(lead.id, "prev")}
                                  className="p-0.5 hover:text-primary disabled:opacity-30"
                                  disabled={stage === "Lead"}
                                >
                                  ←
                                </button>
                                <button
                                  onClick={() => moveLead(lead.id, "next")}
                                  className="p-0.5 hover:text-primary disabled:opacity-30"
                                  disabled={stage === "Won"}
                                >
                                  →
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  💡 Move cards using the arrows. Drag-and-drop simplifies lead nurturing and lets you send direct WhatsApp follow-ups.
                </div>
              </div>
            )}

            {/* STOREFRONT TAB */}
            {activeWidgetTab === "storefront" && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="border-b border-border pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-base">Client Booking Storefront (Preview)</h3>
                    <p className="text-xs text-muted-foreground">Live mini-site published automatically for your business.</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                    <Star className="h-3 w-3 fill-current" /> 4.9 (12 reviews)
                  </div>
                </div>

                {/* Shop view widget */}
                <div className="max-w-md mx-auto border border-border bg-card rounded-xl p-4 shadow-soft space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm">Pixel Studio</h4>
                      <p className="text-[10px] text-muted-foreground">14, Residency Road, Bengaluru</p>
                    </div>
                    <Badge className="bg-green-500 text-white text-[10px]">Open Booking</Badge>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Select Slot for Tomorrow:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {["10:00 AM", "02:00 PM", "04:30 PM"].map((slot) => (
                        <button
                          key={slot}
                          onClick={() => {
                            setSelectedSlot(slot);
                            setBookingConfirmed(false);
                          }}
                          className={`py-2 px-1 text-center text-xs font-semibold rounded-lg border transition ${
                            selectedSlot === slot
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border hover:bg-muted/40"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedSlot && (
                    <div className="pt-2 border-t border-border flex flex-col gap-2">
                      {bookingConfirmed ? (
                        <div className="bg-green-500/10 border border-green-500/25 p-2 rounded-lg text-xs text-green-600 font-semibold flex items-center justify-center gap-2">
                          <Check className="h-4 w-4" /> Appointment confirmed for {selectedSlot}!
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full bg-primary text-primary-foreground text-xs"
                          onClick={() => setBookingConfirmed(true)}
                        >
                          Confirm Appointment
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CTA inside Demo Widget */}
            <div className="pt-4 border-t border-border mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>All changes automatically sync to your backend dashboard.</span>
              <Button asChild size="sm" variant="ghost" className="text-primary gap-1 p-0 hover:bg-transparent hover:underline text-xs">
                <Link to="/register">Create my account →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="relative z-10 bg-muted/40 border-y border-border py-16">
        <div className="container mx-auto max-w-6xl px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <p className="text-3xl md:text-5xl font-extrabold text-primary font-display">₹5 Cr+</p>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Invoices Processed</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl md:text-5xl font-extrabold text-primary font-display">1,200+</p>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Indian MSMEs</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl md:text-5xl font-extrabold text-primary font-display">2.5 Hrs</p>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Saved Daily Per Shop</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl md:text-5xl font-extrabold text-primary font-display">99.9%</p>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Secure Cloud Uptime</p>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="relative z-10 container mx-auto max-w-6xl px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-3 bg-primary-soft text-primary hover:bg-primary-soft border-none font-semibold px-3 py-1">
            Core Modules
          </Badge>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight">
            Integrated tools for every workflow
          </h2>
          <p className="text-muted-foreground mt-3 text-sm sm:text-base">
            Why subscribe to five separate applications? BizkitOps packs accounting, CRM, schedule portals, and staff tracking under one billing plan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.name}
              className="rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden"
            >
              {/* Subtle hover background highlight */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="h-12 w-12 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300 shadow-soft">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-xl leading-tight group-hover:text-primary transition-colors">
                {f.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 bg-muted/20 border-y border-border py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-3 bg-accent/10 text-accent hover:bg-accent/10 border-none font-semibold px-3 py-1">
              Honest Plans
            </Badge>
            <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight">
              Pricing that fits your kirana budget
            </h2>
            <p className="text-muted-foreground mt-3 text-sm sm:text-base">
              Try it free for 7 days. Select a subscription that fits your staff roster and billing requirements. No hidden charges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl border bg-card p-8 flex flex-col relative transition-all duration-300 ${
                  p.highlight
                    ? "border-primary shadow-card ring-4 ring-primary/10 md:scale-[1.03] z-10"
                    : "border-border shadow-soft"
                }`}
              >
                {p.highlight && (
                  <Badge className="absolute -top-3.5 left-6 bg-primary text-primary-foreground font-semibold px-3 py-1 shadow-soft">
                    {p.tag}
                  </Badge>
                )}
                {!p.highlight && (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-4 block">
                    {p.tag}
                  </span>
                )}
                
                {p.highlight && <div className="h-4" />} {/* Spacer for highlight tag */}

                <h3 className="font-display text-2xl font-bold">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-extrabold text-foreground">{p.price}</span>
                  <span className="text-muted-foreground text-sm font-medium">{p.period}</span>
                </div>
                
                <ul className="mt-8 space-y-4 text-sm flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className="mt-8 w-full py-5 rounded-xl font-semibold shadow-soft"
                  variant={p.highlight ? "default" : "outline"}
                >
                  <Link to={p.name === "Custom / Enterprise" ? "/contact" : "/register"}>{p.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 container mx-auto max-w-6xl px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-3 bg-primary-soft text-primary hover:bg-primary-soft border-none font-semibold px-3 py-1">
            Loved By Merchants
          </Badge>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight">
            Real feedback from business owners
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-border bg-card p-6 shadow-soft flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-0.5 mb-4 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  "{t.quote}"
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-border flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-bold text-sm">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordions */}
      <section id="faq" className="relative z-10 bg-muted/20 border-y border-border py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 bg-primary-soft text-primary hover:bg-primary-soft border-none font-semibold px-3 py-1">
              FAQ Center
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              Common questions answered
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="bg-card border border-border rounded-xl px-4">
                <AccordionTrigger className="text-left font-semibold text-sm sm:text-base py-4 hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-xs sm:text-sm pb-4 leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA Strip */}
      <section className="relative z-10 container mx-auto max-w-6xl px-4 py-20">
        <div className="rounded-3xl bg-secondary text-secondary-foreground p-8 md:p-16 text-center shadow-card relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight">
              Ready to upgrade your store operations?
            </h2>
            <p className="text-sm sm:text-base opacity-90 leading-relaxed max-w-lg mx-auto">
              Join 1,200+ Indian retailers using BizkitOps. Start your 7-day free trial now. Setup takes under 5 minutes.
            </p>
            <Button asChild size="lg" className="mt-4 gap-2 bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-semibold px-6 py-6 rounded-xl">
              <Link to="/register">
                Start Trial Account <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {/* Decorative shapes */}
          <div className="absolute right-0 top-0 h-32 w-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute left-0 bottom-0 h-32 w-32 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
        </div>
      </section>

      {/* Upgraded Footer (Sitemap Grid) */}
      <footer className="border-t border-border py-12 bg-card relative z-10">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
            {/* Brand details Column */}
            <div className="col-span-2 space-y-4">
              <Link to="/" className="flex items-center gap-2">
                <img src="/logo.png" alt="BizkitOps Logo" className="h-7 w-7 object-contain rounded" />
                <span className="font-display text-lg font-bold">BizkitOps</span>
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                All-in-one business management software (SaaS ERP) tailored for Indian Kiranas, retailers, service providers, and agencies. Modern, mobile-first, and GST-ready.
              </p>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> Bengaluru, IN</span>
                <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> SSL Secured</span>
              </div>
            </div>

            {/* Sitemap Column 1: Product */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Product</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Core Modules</a></li>
                <li><a href="#demo" className="hover:text-foreground transition-colors">Interactive Demo</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing Plans</a></li>
                <li><Link to="/register" className="hover:text-foreground transition-colors">Create Profile</Link></li>
              </ul>
            </div>

            {/* Sitemap Column 2: Resources & Compliance */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Resources</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link to="/blog" className="hover:text-foreground transition-colors">SME Blog & Guides</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Sitemap Column 3: Contact/Support */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Contact Support</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link to="/contact" className="hover:text-foreground transition-colors font-semibold">
                    Contact Form
                  </Link>
                </li>
                <li>
                  <a href="mailto:workwithsvvaap@gmail.com" className="hover:text-foreground transition-colors flex items-center gap-1">
                    workwithsvvaap@gmail.com
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/917899535703?text=Hi%20BizkitOps" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1 text-green-600 font-semibold">
                    WhatsApp Support (+91 78995 35703)
                  </a>
                </li>
                <li className="text-[10px] text-muted-foreground pt-1 italic">
                  Availability: Mon - Sat <br /> 9:00 AM - 7:00 PM IST
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom strip */}
          <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© 2026 BizKitOps by <a href="https://21xengineers.svvaap.in" target="_blank" rel="noopener noreferrer">21xEngineers</a> - <a href="https://svvaap.in" target="_blank" rel="noopener noreferrer">Svvaap Innovations</a>. Made in India with ❤️</p>
            <p className="flex items-center gap-1.5"><ThumbsUp className="h-3.5 w-3.5 text-accent" /> Recommended by Indian CAs</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
