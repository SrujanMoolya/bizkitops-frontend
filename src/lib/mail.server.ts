import * as fs from "fs";
import * as path from "path";

interface InvoiceEmailData {
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  invoiceNumber: string;
  planName: string;
  billingCycle: string;
  amount: number;
  paidAt: string;
  paymentId: string;
}

export async function sendSubscriptionInvoiceEmail(data: InvoiceEmailData) {
  const baseAmount = Number((data.amount / 1.18).toFixed(2));
  const cgst = Number((baseAmount * 0.09).toFixed(2));
  const sgst = Number((baseAmount * 0.09).toFixed(2));
  const totalTax = Number((cgst + sgst).toFixed(2));

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${data.invoiceNumber} — Bizkit Spark</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1f2937;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      padding: 32px;
      color: #ffffff;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.025em;
    }
    .header p {
      margin: 8px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 32px;
    }
    .welcome {
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .invoice-card {
      background-color: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .invoice-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .invoice-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      font-weight: 600;
    }
    .invoice-value {
      font-size: 14px;
      color: #111827;
      font-weight: 500;
      margin-top: 2px;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 24px 0;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
    }
    .table th {
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      color: #6b7280;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .table td {
      padding: 12px 0;
      font-size: 14px;
    }
    .totals {
      float: right;
      width: 240px;
      margin-top: 16px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
    }
    .totals-row.grand-total {
      font-size: 16px;
      font-weight: 700;
      color: #4f46e5;
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
      margin-top: 4px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #4f46e5;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BIZKIT SPARK</h1>
      <p>Subscription Payment Receipt & Invoice</p>
    </div>
    <div class="content">
      <div class="welcome">
        <p>Hello <strong>${data.ownerName}</strong>,</p>
        <p>Thank you for your purchase! Your payment for the <strong>Bizkit Spark ${data.planName.toUpperCase()}</strong> plan was processed successfully. Below is your payment invoice.</p>
      </div>

      <div class="invoice-card">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; padding-bottom: 12px; vertical-align: top;">
              <div class="invoice-label">Invoice Number</div>
              <div class="invoice-value">${data.invoiceNumber}</div>
            </td>
            <td style="width: 50%; padding-bottom: 12px; vertical-align: top;">
              <div class="invoice-label">Paid Date</div>
              <div class="invoice-value">${new Date(data.paidAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </td>
          </tr>
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <div class="invoice-label">Billed To</div>
              <div class="invoice-value">
                <strong>${data.businessName}</strong><br/>
                ${data.ownerEmail}
              </div>
            </td>
            <td style="width: 50%; vertical-align: top;">
              <div class="invoice-label">Payment Method</div>
              <div class="invoice-value">
                Razorpay Online<br/>
                <span style="font-size: 11px; color:#6b7280; font-family: monospace;">Ref: ${data.paymentId}</span>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Billing Cycle</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Bizkit Spark ${data.planName.toUpperCase()} Subscription</strong><br/>
              <span style="font-size: 12px; color: #6b7280;">Full access to premium modules</span>
            </td>
            <td style="text-align: right; text-transform: capitalize;">${data.billingCycle}</td>
            <td style="text-align: right;">₹${baseAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div style="width: 100%; overflow: hidden; margin-bottom: 24px;">
        <div class="totals">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>₹${baseAmount.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>CGST (9%)</span>
            <span>₹${cgst.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>SGST (9%)</span>
            <span>₹${sgst.toFixed(2)}</span>
          </div>
          <div class="totals-row grand-total">
            <span>Total Paid</span>
            <span>₹${data.amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="divider" style="clear: both;"></div>

      <p style="font-size: 12px; color: #6b7280; text-align: center;">
        If you have any questions about this invoice or your subscription, please contact support at <a href="mailto:support@bizkit.in">support@bizkit.in</a>
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Bizkit Spark. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  // Write file to workspace sent_emails for demo / verification purposes
  const dir = path.join(process.cwd(), "sent_emails");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filename = `invoice_${data.invoiceNumber}.html`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, html, "utf8");

  // Send real email via Resend if API key is provided
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Bizkit Spark <billing@bizkit.in>",
          to: data.ownerEmail,
          subject: `Your Bizkit Spark Subscription Invoice [${data.invoiceNumber}]`,
          html: html,
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error(`Resend API Error: ${errText}`);
      } else {
        console.log(`[Invoice Email] Real email successfully sent via Resend API to ${data.ownerEmail}`);
      }
    } catch (err) {
      console.error("[Invoice Email] Error sending via Resend:", err);
    }
  }

  return { filepath, filename };
}
