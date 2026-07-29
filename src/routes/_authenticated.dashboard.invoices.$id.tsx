import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getInvoice } from "@/lib/invoices.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Share2,
  Printer,
  Download,
  PenTool,
  Type,
  UploadCloud,
  Trash2,
  Copy,
  Mail,
  Check,
  FileText,
  X,
  FileSignature,
  FileImage,
  Loader2,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/format";
import { RoutePending, RouteError } from "@/components/dashboard/page-shell";
import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const invoiceOptions = (id: string) =>
  queryOptions({
    queryKey: ["invoice", id],
    queryFn: () => getInvoice({ data: { id } }),
  });

export const Route = createFileRoute("/_authenticated/dashboard/invoices/$id")({
  head: () => ({ meta: [{ title: "Invoice — BizkitOps" }] }),
  validateSearch: (search: Record<string, unknown>): { download?: boolean } => ({
    download: search.download === "true" || search.download === true || undefined,
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(invoiceOptions(params.id)),
  component: InvoiceDetail,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
});

interface SignatureState {
  type: "draw" | "type" | "upload";
  data: string;
  fontStyle?: string;
}

interface StampState {
  data: string;
}

function InvoiceDetail() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(invoiceOptions(id));
  const inv = data.invoice;
  const biz = data.business;
  const customer = (inv as any).customer;

  // Signatures and Stamps state
  const [signature, setSignature] = useState<SignatureState | null>(null);
  const [stamp, setStamp] = useState<StampState | null>(null);

  // Dialog controllers
  const [sigDialogOpen, setSigDialogOpen] = useState(false);
  const [stampDialogOpen, setStampDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Drawing signature canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Typed signature inputs
  const [typedName, setTypedName] = useState("");
  const [selectedFont, setSelectedFont] = useState("Great Vibes");

  const FONTS = [
    { name: "Great Vibes", family: "'Great Vibes', cursive" },
    { name: "Caveat", family: "'Caveat', cursive" },
    { name: "Sacramento", family: "'Sacramento', cursive" },
  ];

  // Sharing handlers
  const [copyingLink, setCopyingLink] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Load saved signatures/stamps for this business from localStorage
  useEffect(() => {
    if (biz?.id) {
      const savedSig = localStorage.getItem(`bizkitops_signature_${biz.id}`);
      if (savedSig) {
        try {
          setSignature(JSON.parse(savedSig));
        } catch (e) {
          console.error(e);
        }
      }
      const savedStamp = localStorage.getItem(`bizkitops_stamp_${biz.id}`);
      if (savedStamp) {
        try {
          setStamp(JSON.parse(savedStamp));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [biz?.id]);

  const saveSignature = (sigData: SignatureState | null) => {
    setSignature(sigData);
    if (biz?.id) {
      if (sigData) {
        localStorage.setItem(`bizkitops_signature_${biz.id}`, JSON.stringify(sigData));
      } else {
        localStorage.removeItem(`bizkitops_signature_${biz.id}`);
      }
    }
  };

  const saveStamp = (stampData: StampState | null) => {
    setStamp(stampData);
    if (biz?.id) {
      if (stampData) {
        localStorage.setItem(`bizkitops_stamp_${biz.id}`, JSON.stringify(stampData));
      } else {
        localStorage.removeItem(`bizkitops_stamp_${biz.id}`);
      }
    }
  };

  // Canvas drawing handlers
  const getContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0F172A"; // Slate 900
    return ctx;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ("touches" in e) {
      if (e.cancelable) e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ("touches" in e) {
      if (e.cancelable) e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const applyCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if canvas is blank
    const blank = document.createElement("canvas");
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      toast.error("Please draw a signature before applying!");
      return;
    }

    const dataUrl = canvas.toDataURL("image/png");
    saveSignature({
      type: "draw",
      data: dataUrl,
    });
    setSigDialogOpen(false);
    toast.success("Signature added successfully!");
  };

  const applyTypedSignature = () => {
    if (!typedName.trim()) {
      toast.error("Please enter a name first!");
      return;
    }
    const font = FONTS.find((f) => f.name === selectedFont);
    saveSignature({
      type: "type",
      data: typedName.trim(),
      fontStyle: font?.family,
    });
    setSigDialogOpen(false);
    toast.success("Typed signature added successfully!");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isStamp: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large! Please upload an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (isStamp) {
        saveStamp({ data: dataUrl });
        setStampDialogOpen(false);
        toast.success("Official stamp added successfully!");
      } else {
        saveSignature({ type: "upload", data: dataUrl });
        setSigDialogOpen(false);
        toast.success("Signature image uploaded successfully!");
      }
    };
    reader.readAsDataURL(file);
  };

  // PDF download generator
  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const element = document.getElementById("printable-invoice-card");
      if (!element) {
        toast.error("Invoice card element not found!");
        return;
      }

      // Load html2pdf from CDN dynamically to keep bundle size lightweight
      if (!(window as any).html2pdf) {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        script.integrity = "sha512-GsLlZN/3F2ErC5IfS5QRLps5GYYWcTji3h66psQsOD968SiLwx58Gxlt+hkcIaGQG1ILChNqcdBieykM+Usipg==";
        script.crossOrigin = "anonymous";
        script.referrerPolicy = "no-referrer";
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `Invoice_${inv.invoice_number || "Draft"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2.2, useCORS: true, letterRendering: true },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      };

      await (window as any).html2pdf().set(opt).from(element).save();
      toast.success("PDF Downloaded!");
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to generate PDF: " + e.message);
    } finally {
      setDownloading(false);
    }
  };

  const { download } = Route.useSearch();
  useEffect(() => {
    if (download && biz?.id) {
      const timer = setTimeout(() => {
        downloadPDF();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [download, biz?.id]);

  // Sharing copy logic
  const handleCopyLink = () => {
    setCopyingLink(true);
    navigator.clipboard.writeText(window.location.href);
    toast.success("Invoice view URL copied!");
    setTimeout(() => setCopyingLink(false), 2000);
  };

  const handleCopySummary = () => {
    const itemsText = data.items
      .map(
        (it) =>
          `- ${it.description}: ${it.quantity} x ${formatINR(it.rate)} = ${formatINR(it.amount)}`
      )
      .join("\n");
    const upiText = biz?.bank_upi ? `\nUPI Payment ID: ${biz.bank_upi}` : "";
    const bankText = biz?.bank_name
      ? `\nBank: ${biz.bank_name}\nA/C: ${biz.bank_account}\nIFSC: ${biz.bank_ifsc}`
      : "";

    const summary =
      `Invoice ${inv.invoice_number} from ${biz?.name ?? ""}\n\n` +
      `Bill To: ${inv.customer_name}\n` +
      `Date: ${formatDate(inv.issue_date)}\n` +
      `Total Amount: ${formatINR(inv.total_amount)}\n` +
      `Balance Due: ${formatINR(
        Math.max(0, Number(inv.total_amount) - Number(inv.amount_paid || 0))
      )}\n\n` +
      `Items:\n${itemsText}\n` +
      `${upiText}${bankText}\n\n` +
      `You can view details and print the invoice here: ${window.location.origin}/store/${biz?.slug}/invoice/${inv.id} or contact us for queries. Thank you!`;

    navigator.clipboard.writeText(summary);
    toast.success("Formatted invoice details copied to clipboard!");
  };

  const shareText = encodeURIComponent(
    `Hi ${inv.customer_name ?? ""}, here is your invoice ${inv.invoice_number} from ${
      biz?.name ?? ""
    } for ${formatINR(inv.total_amount)}. Balance due: ${formatINR(
      Math.max(0, Number(inv.total_amount) - Number(inv.amount_paid || 0))
    )}. Thank you!`
  );

  return (
    <div className="max-w-4xl mx-auto px-4 pb-12">
      {/* Stylesheet injector for handwriting script fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Great+Vibes&family=Sacramento&display=swap"
        rel="stylesheet"
      />

      {/* Print custom stylesheet override */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .print-hidden, .print\\:hidden {
            display: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `,
        }}
      />

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 print:hidden">
        <Button asChild variant="ghost" size="sm" className="w-fit gap-1 text-muted-foreground hover:text-foreground">
          <Link to="/dashboard/invoices">
            <ArrowLeft className="h-4 w-4" /> Back to Invoices
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadPDF} disabled={downloading}>
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShareDialogOpen(true)}>
            <Share2 className="h-4 w-4" /> Share Options
          </Button>
        </div>
      </div>

      {/* Invoice Paper Document Wrapper */}
      <Card id="printable-invoice-card" className="print-full-width shadow-card border border-border/80 overflow-hidden relative bg-card">
        {/* Top colored accent line */}
        <div className="h-2 w-full bg-gradient-to-r from-primary via-indigo-600 to-emerald-500" />

        {/* Paid / Unpaid Status Watermark */}
        {inv.status === "paid" && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none opacity-[0.04] text-emerald-600 font-display font-black text-8xl tracking-widest uppercase border-8 border-emerald-600 p-6 rounded-xl rotate-12 z-0">
            PAID
          </div>
        )}
        {inv.status === "overdue" && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none opacity-[0.04] text-destructive font-display font-black text-8xl tracking-widest uppercase border-8 border-destructive p-6 rounded-xl rotate-12 z-0">
            OVERDUE
          </div>
        )}

        <CardContent className="p-6 sm:p-10 space-y-8 relative z-10">
          {/* Header block: Sender logo/details and Invoice Metadata */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 pb-6 border-b border-border/60">
            <div>
              <h1 className="font-display text-2xl font-black tracking-tight text-foreground">{biz?.name}</h1>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {biz?.address && <p className="max-w-xs">{biz.address}</p>}
                {biz?.phone && <p>📞 {biz.phone}</p>}
                {biz?.email && <p>📧 {biz.email}</p>}
                {biz?.gst_number && (
                  <p className="font-semibold text-foreground mt-1">GSTIN: {biz.gst_number}</p>
                )}
              </div>
            </div>
            <div className="text-left md:text-right space-y-2">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Tax Invoice</span>
                <h2 className="font-display text-xl font-bold font-mono text-foreground mt-0.5">{inv.invoice_number}</h2>
              </div>
              <Badge
                variant={
                  inv.status === "paid"
                    ? "default"
                    : inv.status === "overdue"
                      ? "destructive"
                      : "secondary"
                }
                className="capitalize font-bold text-xs"
              >
                {inv.status}
              </Badge>
            </div>
          </div>

          {/* Billing columns: Seller info and Buyer info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
            <div>
              <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-2">Billed To (Customer):</p>
              <p className="text-sm font-bold text-foreground">{inv.customer_name}</p>
              <div className="mt-1.5 space-y-1 text-muted-foreground">
                {customer?.address && <p>{customer.address}{customer.city ? `, ${customer.city}` : ""}</p>}
                {customer?.phone && <p>Phone: {customer.phone}</p>}
                {customer?.email && <p>Email: {customer.email}</p>}
                {customer?.gst_number && (
                  <p className="font-semibold text-foreground mt-1">GSTIN: {customer.gst_number}</p>
                )}
              </div>
            </div>
            <div className="md:text-right space-y-1.5">
              <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-2">Invoice Dates:</p>
              <p>
                <span className="text-muted-foreground">Issue Date: </span>
                <span className="font-semibold">{formatDate(inv.issue_date)}</span>
              </p>
              {inv.due_date && (
                <p>
                  <span className="text-muted-foreground">Due Date: </span>
                  <span className="font-semibold text-destructive">{formatDate(inv.due_date)}</span>
                </p>
              )}
              {inv.payment_terms && (
                <p>
                  <span className="text-muted-foreground">Payment Terms: </span>
                  <span className="font-semibold capitalize">{inv.payment_terms.replace("net", "Net ")}</span>
                </p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/80 text-left uppercase tracking-wider text-muted-foreground font-bold bg-muted/40">
                  <th className="py-2.5 px-3">Item Details</th>
                  <th className="py-2.5 text-right">Qty</th>
                  <th className="py-2.5 text-right">Unit Rate</th>
                  <th className="py-2.5 text-right">Discount</th>
                  <th className="py-2.5 text-right">GST Rate</th>
                  <th className="py-2.5 text-right px-3">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {data.items.map((i) => (
                  <tr key={i.id} className="hover:bg-muted/10">
                    <td className="py-3 px-3">
                      <p className="font-bold text-foreground">{i.description}</p>
                    </td>
                    <td className="py-3 text-right font-medium">
                      {i.quantity} <span className="text-muted-foreground text-[10px]">{i.unit ?? "pcs"}</span>
                    </td>
                    <td className="py-3 text-right">{formatINR(i.rate)}</td>
                    <td className="py-3 text-right text-muted-foreground">
                      {Number(i.discount_percent) > 0 ? `${i.discount_percent}%` : "—"}
                    </td>
                    <td className="py-3 text-right text-muted-foreground">{i.gst_percent}%</td>
                    <td className="py-3 text-right font-bold text-foreground px-3">{formatINR(i.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 pt-4 border-t border-border/40">
            {/* Bank details and notes on the left */}
            <div className="flex-1 space-y-4 max-w-md w-full">
              {(biz?.bank_name || biz?.bank_upi) && (
                <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Payment Instructions</p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                    {biz?.bank_name && (
                      <>
                        <span className="text-muted-foreground">Bank:</span>
                        <span className="font-semibold text-foreground">{biz.bank_name}</span>
                        <span className="text-muted-foreground">Account:</span>
                        <span className="font-semibold font-mono text-foreground">{biz.bank_account}</span>
                        <span className="text-muted-foreground">IFSC Code:</span>
                        <span className="font-semibold font-mono text-foreground">{biz.bank_ifsc}</span>
                      </>
                    )}
                    {biz?.bank_upi && (
                      <>
                        <span className="text-muted-foreground">UPI VPA:</span>
                        <span className="font-bold text-primary font-mono">{biz.bank_upi}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Price breakdown details on the right */}
            <div className="w-full md:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Gross Subtotal</span>
                <span>{formatINR(inv.subtotal)}</span>
              </div>
              {Number(inv.discount_amount) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>General Discount</span>
                  <span>− {formatINR(inv.discount_amount)}</span>
                </div>
              )}
              {Number(inv.igst_amount) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Integrated GST (IGST)</span>
                  <span>{formatINR(inv.igst_amount)}</span>
                </div>
              )}
              {Number(inv.cgst_amount) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Central GST (CGST)</span>
                  <span>{formatINR(inv.cgst_amount)}</span>
                </div>
              )}
              {Number(inv.sgst_amount) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>State GST (SGST)</span>
                  <span>{formatINR(inv.sgst_amount)}</span>
                </div>
              )}

              {/* Final net amount */}
              <div className="flex justify-between pt-2 border-t border-border/80 font-display font-black text-sm text-foreground">
                <span>Net Total Payable</span>
                <span>{formatINR(inv.total_amount)}</span>
              </div>

              {/* Payments details */}
              {Number(inv.amount_paid) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Amount Paid / Advances</span>
                  <span>{formatINR(inv.amount_paid)}</span>
                </div>
              )}

              {/* Net Balance Due Box */}
              <div className="flex justify-between p-2 rounded bg-muted/60 border border-border/50 font-display font-black text-xs text-foreground mt-2">
                <span>Balance Due</span>
                <span className={Math.max(0, Number(inv.total_amount) - Number(inv.amount_paid || 0)) > 0 ? "text-destructive" : "text-emerald-600"}>
                  {formatINR(Math.max(0, Number(inv.total_amount) - Number(inv.amount_paid || 0)))}
                </span>
              </div>
            </div>
          </div>

          {/* Stamp and Digital Signature Slot Area */}
          <div className="flex justify-between items-end gap-6 pt-6 border-t border-border/60">
            {/* Notes / Terms section */}
            <div className="flex-1 max-w-md text-[10px] text-muted-foreground space-y-1 leading-relaxed">
              {inv.notes && <p className="italic">Notes: {inv.notes}</p>}
              {biz?.invoice_footer && <p>{biz.invoice_footer}</p>}
              <p className="text-[9px] mt-2 font-medium">This is a system-generated electronic receipt issued via BizkitOps.</p>
            </div>

            {/* Seals and Signatures Box */}
            <div className="flex gap-4 items-end justify-end shrink-0">
              {/* Stamp Column */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="relative group w-24 h-24 border border-dashed border-border/60 hover:border-primary/50 rounded-xl flex items-center justify-center cursor-pointer transition-colors bg-muted/5 overflow-hidden"
                  onClick={() => setStampDialogOpen(true)}
                >
                  {stamp ? (
                    <>
                      <img
                        src={stamp.data}
                        alt="Official Stamp"
                        className="w-20 h-20 object-contain mix-blend-multiply transition-opacity group-hover:opacity-60"
                      />
                      <button
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-destructive/90 text-white opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                        onClick={(e) => {
                          e.stopPropagation();
                          saveStamp(null);
                          toast.success("Stamp removed!");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-1.5 space-y-1 print:hidden">
                      <FileImage className="h-5 w-5 mx-auto text-muted-foreground/60" />
                      <span className="text-[9px] text-muted-foreground font-medium">Seal / Stamp</span>
                    </div>
                  )}
                  {/* Print placeholder label if empty */}
                  {!stamp && (
                    <span className="hidden print:inline text-[9px] text-muted-foreground/30 italic">
                      [Place Seal Here]
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Stamp & Seal</span>
              </div>

              {/* Signature Column */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="relative group w-44 h-24 border border-dashed border-border/60 hover:border-primary/50 rounded-xl flex items-center justify-center cursor-pointer transition-colors bg-muted/5 overflow-hidden"
                  onClick={() => setSigDialogOpen(true)}
                >
                  {signature ? (
                    <>
                      {signature.type === "draw" || signature.type === "upload" ? (
                        <img
                          src={signature.data}
                          alt="Signature"
                          className="max-h-16 max-w-[90%] object-contain mix-blend-multiply transition-opacity group-hover:opacity-60"
                        />
                      ) : (
                        <div
                          className="text-2xl text-slate-800 font-medium px-2 py-1 select-none text-center truncate max-w-full"
                          style={{ fontFamily: signature.fontStyle || "Great Vibes, cursive" }}
                        >
                          {signature.data}
                        </div>
                      )}
                      <button
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-destructive/90 text-white opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                        onClick={(e) => {
                          e.stopPropagation();
                          saveSignature(null);
                          toast.success("Signature removed!");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-2 space-y-1 print:hidden">
                      <FileSignature className="h-5 w-5 mx-auto text-muted-foreground/60" />
                      <span className="text-[9px] text-muted-foreground font-medium">Click to Sign</span>
                    </div>
                  )}
                  {/* Print placeholder label if empty */}
                  {!signature && (
                    <span className="hidden print:inline text-[9px] text-muted-foreground/30 italic">
                      [Authorized Signature]
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Authorized Signatory</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature Configuration Dialog */}
      <Dialog open={sigDialogOpen} onOpenChange={setSigDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Digital Signature</DialogTitle>
            <DialogDescription>
              Configure or draw a signature to stamp onto this invoice and save for future transactions.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="draw" className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="draw" className="gap-1">
                <PenTool className="h-3.5 w-3.5" /> Draw
              </TabsTrigger>
              <TabsTrigger value="type" className="gap-1">
                <Type className="h-3.5 w-3.5" /> Type
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-1">
                <UploadCloud className="h-3.5 w-3.5" /> Upload
              </TabsTrigger>
            </TabsList>

            {/* Tab: Draw Signature Canvas */}
            <TabsContent value="draw" className="space-y-4 pt-4">
              <div className="relative border border-muted bg-muted/10 rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  className="w-full h-[150px] cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <button
                  onClick={clearCanvas}
                  className="absolute bottom-2 right-2 text-xs font-semibold px-2 py-1 rounded bg-secondary/80 hover:bg-secondary text-secondary-foreground"
                >
                  Clear Pad
                </button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSigDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={applyCanvasSignature}>Apply Drawing</Button>
              </DialogFooter>
            </TabsContent>

            {/* Tab: Type Cursive Signature */}
            <TabsContent value="type" className="space-y-4 pt-4">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sig-name">Signatory Name</Label>
                  <Input
                    id="sig-name"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="Enter full name..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Handwriting Styles</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {FONTS.map((font) => (
                      <button
                        key={font.name}
                        onClick={() => setSelectedFont(font.name)}
                        className={`p-2.5 rounded-lg border text-center transition-all ${
                          selectedFont === font.name
                            ? "border-primary bg-primary-soft text-primary font-bold"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <span className="text-[10px] text-muted-foreground block">{font.name}</span>
                        <span
                          className="text-lg select-none truncate block mt-0.5"
                          style={{ fontFamily: font.family }}
                        >
                          {typedName || "Signature"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSigDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={applyTypedSignature}>Apply Script</Button>
              </DialogFooter>
            </TabsContent>

            {/* Tab: Upload Signature image */}
            <TabsContent value="upload" className="space-y-4 pt-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 bg-muted/5 hover:bg-muted/10 transition-colors relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, false)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="h-10 w-10 text-muted-foreground/60 mb-2" />
                <p className="text-sm font-bold text-foreground">Click to upload signature</p>
                <p className="text-[10px] text-muted-foreground mt-1">Supports PNG, JPG, or SVG (under 2MB)</p>
                <p className="text-[9px] text-primary mt-2 font-medium">Tip: Use a transparent PNG signature for best visual blend.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" className="w-full" onClick={() => setSigDialogOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Stamp Configuration Dialog */}
      <Dialog open={stampDialogOpen} onOpenChange={setStampDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Stamp / Seal</DialogTitle>
            <DialogDescription>
              Upload your official round/square company rubber stamp to imprint on the invoice.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 bg-muted/5 hover:bg-muted/10 transition-colors relative mt-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, true)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <UploadCloud className="h-10 w-10 text-muted-foreground/60 mb-2" />
            <p className="text-sm font-bold text-foreground">Upload company seal image</p>
            <p className="text-[10px] text-muted-foreground mt-1">Supports PNG, JPG, or SVG (under 2MB)</p>
            <p className="text-[9px] text-primary mt-2 font-medium">Tip: Transparent PNG images will blend seamlessly.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full" onClick={() => setStampDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Actions Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Invoice Details</DialogTitle>
            <DialogDescription>
              Select an option below to deliver the invoice to {inv.customer_name}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3.5 py-4">
            <Button
              variant="outline"
              className="flex flex-col gap-2 h-auto py-5 justify-center rounded-xl hover:bg-primary-soft hover:border-primary/40"
              asChild
            >
              <a href={`https://wa.me/${customer?.phone || ""}?text=${shareText}`} target="_blank" rel="noreferrer">
                <Share2 className="h-6 w-6 text-emerald-600" />
                <span className="font-bold text-sm">Send on WhatsApp</span>
                <span className="text-[10px] text-muted-foreground">Open WhatsApp dialogue</span>
              </a>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col gap-2 h-auto py-5 justify-center rounded-xl hover:bg-primary-soft hover:border-primary/40"
              asChild
            >
              <a
                href={`mailto:${customer?.email || ""}?subject=Tax%20Invoice%20${inv.invoice_number}%20from%20${biz?.name || "Us"}&body=Dear%20Customer,%0A%0APlease%20find%20attached%20invoice%20${inv.invoice_number}%20amounting%20to%20${formatINR(inv.total_amount)}.%0A%0AThank%20you!`}
              >
                <Mail className="h-6 w-6 text-indigo-600" />
                <span className="font-bold text-sm">Send via Email</span>
                <span className="text-[10px] text-muted-foreground">Draft email message</span>
              </a>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col gap-2 h-auto py-5 justify-center rounded-xl hover:bg-primary-soft hover:border-primary/40"
              onClick={handleCopyLink}
            >
              {copyingLink ? (
                <Check className="h-6 w-6 text-emerald-600 animate-bounce" />
              ) : (
                <Copy className="h-6 w-6 text-amber-600" />
              )}
              <span className="font-bold text-sm">Copy Page Link</span>
              <span className="text-[10px] text-muted-foreground">Copy URL to clipboard</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col gap-2 h-auto py-5 justify-center rounded-xl hover:bg-primary-soft hover:border-primary/40"
              onClick={handleCopySummary}
            >
              <FileText className="h-6 w-6 text-rose-600" />
              <span className="font-bold text-sm">Copy Text Invoice</span>
              <span className="text-[10px] text-muted-foreground">Copy itemized text details</span>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full font-semibold" onClick={() => setShareDialogOpen(false)}>
              Close Share Menu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
