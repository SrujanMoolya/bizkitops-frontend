import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Building2,
  Lock,
  ThumbsUp,
  Loader2,
  Send,
  CheckCircle,
  Building,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Support & Sales — BizkitOps" },
      {
        name: "description",
        content: "Get in touch with the BizkitOps and SVVAAP Technologies team. Connect via email, WhatsApp, or submit a custom enterprise ERP request.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [planInterest, setPlanInterest] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all required fields (Name, Email, and Message).");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("contact_requests").insert({
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        company: companyName.trim() || null,
        company_size: companySize || null,
        message: message.trim(),
        plan_interest: planInterest || "custom",
      });

      if (error) {
        throw error;
      }

      setSubmitted(true);
      toast.success("Message sent successfully!");
      // Reset form fields
      setFullName("");
      setEmail("");
      setPhone("");
      setCompanyName("");
      setCompanySize("");
      setPlanInterest("");
      setMessage("");
    } catch (error: any) {
      console.error("Error submitting contact request:", error);
      toast.error(error.message || "Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden font-sans text-foreground">
      {/* Decorative Blob backgrounds */}
      <div className="absolute top-[10%] left-[-15%] w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[-15%] w-[35rem] h-[35rem] bg-accent/8 rounded-full blur-[110px] pointer-events-none z-0" />

      {/* Header */}
      <header className="border-b border-border bg-card/75 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="BizkitOps Logo" className="h-8 w-8 object-contain rounded" />
            <span className="font-display text-xl font-bold tracking-tight">BizkitOps</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/">Home</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/blog">Blog</Link>
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

      {/* Main Page Area */}
      <main className="container mx-auto max-w-6xl px-4 py-16 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft/80 px-4 py-1.5 text-xs font-semibold text-primary mb-4 shadow-soft">
            <Sparkles className="h-3.5 w-3.5" />
            We build tools for the next generation of retailers
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Get in Touch with Us
          </h1>
          <p className="text-muted-foreground mt-4 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Have questions about billing, custom integrations, enterprise access, or partnering with us? Let's connect.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Details Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card/50 border border-border/80 backdrop-blur-md rounded-3xl p-6 md:p-8 space-y-8 shadow-card">
              <div>
                <h3 className="text-xl font-bold font-display">SVVAAP Innovations</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  BizkitOps is built, optimized, and operated by SVVAAP Innovations. We specialize in building cloud-native, GST-ready ERP, and operations systems for Indian MSMEs.
                </p>
              </div>

              {/* WhatsApp Row */}
              <div className="bg-[#25D366]/5 rounded-2xl p-5 border border-[#25D366]/20 space-y-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 shrink-0 items-center justify-center flex rounded-xl bg-[#25D366]/10 text-[#25D366]">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">WhatsApp Support</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Chat with us for fast sales & service replies.</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 pt-2">
                  <span className="font-mono text-sm font-bold text-foreground">+91 78995 35703</span>
                  <Button asChild size="sm" className="bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-lg px-4 font-semibold text-xs transition">
                    <a
                      href="https://wa.me/917899535703?text=Hi%20BizkitOps,%20I'd%20like%20to%20learn%20more."
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Chat Now
                    </a>
                  </Button>
                </div>
              </div>

              {/* Email Row */}
              <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 space-y-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 shrink-0 items-center justify-center flex rounded-xl bg-primary-soft text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Email Support</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Send us your business proposals or queries.</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 pt-2">
                  <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">workwithsvvaap@gmail.com</span>
                  <Button asChild size="sm" variant="outline" className="rounded-lg px-4 font-semibold text-xs transition">
                    <a href="mailto:workwithsvvaap@gmail.com">
                      Send Email
                    </a>
                  </Button>
                </div>
              </div>

              {/* Meta Info */}
              <div className="space-y-4 pt-4 border-t border-border/80 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span>Availability: Mon - Sat, 9:00 AM - 7:00 PM IST</span>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-primary shrink-0" />
                  <span>HQ: Bengaluru, Karnataka, India</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-card/50 border border-border/80 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-card relative overflow-hidden">
              {submitted ? (
                <div className="text-center py-16 space-y-4">
                  <div className="h-16 w-16 bg-primary-soft text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <h3 className="font-display text-2xl font-bold">Thank You!</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Your message has been successfully delivered. Our team will review it and get in touch with you shortly.
                  </p>
                  <Button onClick={() => setSubmitted(false)} variant="outline" className="mt-4 rounded-xl">
                    Submit Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold font-display">Send a message</h3>
                    <p className="text-xs text-muted-foreground">Fill in the details below and we will get back to you.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="rounded-xl border-border bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="rounded-xl border-border bg-background/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number (Optional)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="rounded-xl border-border bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyName">Business / Company Name (Optional)</Label>
                      <Input
                        id="companyName"
                        placeholder="My Kirana Shop"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="rounded-xl border-border bg-background/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companySize">Company Size</Label>
                      <Select value={companySize} onValueChange={setCompanySize}>
                        <SelectTrigger className="rounded-xl border-border bg-background/50 cursor-pointer">
                          <SelectValue placeholder="Select team size" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border border-border">
                          <SelectItem value="1-5">1 - 5 employees</SelectItem>
                          <SelectItem value="6-20">6 - 20 employees</SelectItem>
                          <SelectItem value="21-50">21 - 50 employees</SelectItem>
                          <SelectItem value="51+">50+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="planInterest">Plan Interest</Label>
                      <Select value={planInterest} onValueChange={setPlanInterest}>
                        <SelectTrigger className="rounded-xl border-border bg-background/50 cursor-pointer">
                          <SelectValue placeholder="Select a plan" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border border-border">
                          <SelectItem value="trial">7-Day Free Trial</SelectItem>
                          <SelectItem value="basic">Basic Plan (₹499/mo)</SelectItem>
                          <SelectItem value="pro">Pro Plan (₹999/mo)</SelectItem>
                          <SelectItem value="custom">Custom / Enterprise Plan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message / Requirements <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="message"
                      rows={4}
                      placeholder="Tell us about your business goals, any questions, or features you are looking for..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      className="rounded-xl border-border bg-background/50 min-h-[100px]"
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-6 shadow-soft gap-2">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting Request...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

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
                <li><Link to="/" className="hover:text-foreground transition-colors">Core Modules</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Interactive Demo</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Pricing Plans</Link></li>
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
                  <a href="mailto:workwithsvvaap@gmail.com" className="hover:text-foreground transition-colors flex items-center gap-1">
                    workwithsvvaap@gmail.com
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/917899535703?text=Hi%20BizkitOps" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1 text-green-600 font-semibold">
                    WhatsApp Support
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
