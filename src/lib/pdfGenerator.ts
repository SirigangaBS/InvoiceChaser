import { jsPDF } from "jspdf";
import { formatDate } from "./utils";

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceDataForPdf {
  invoiceNumber: string;
  issueDate: string | Date;
  dueDate: string | Date;
  description: string;
  subtotalPaise: number;
  taxRatePercent: number;
  taxPaise: number;
  totalPaise: number;
  status: string;
  paymentLink?: string | null;
  notes?: string | null;
  items?: InvoiceItem[];
  client: {
    name: string;
    businessName?: string | null;
    email: string;
    phone?: string | null;
    address?: string | null;
  };
  user: {
    name: string;
    businessName?: string | null;
    businessAddress?: string | null;
    email: string;
    phone?: string | null;
    upiId?: string | null;
    bankDetails?: string | null;
  };
}

export function generateInvoicePdf(invoice: InvoiceDataForPdf): void {
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top header bar (Navy)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, "F");

  // Accent line (Lime)
  doc.setFillColor(132, 204, 22); // lime-500
  doc.rect(0, 40, pageWidth, 2.5, "F");

  // Brand title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.user.businessName || invoice.user.name, 15, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(invoice.user.name + (invoice.user.phone ? ` • ${invoice.user.phone}` : ""), 15, 25);
  doc.text(invoice.user.email, 15, 30);
  if (invoice.user.businessAddress) {
    doc.text(invoice.user.businessAddress.substring(0, 70), 15, 35);
  }

  // "INVOICE" label top right
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - 15, 20, { align: "right" });

  doc.setFontSize(10);
  doc.setTextColor(163, 230, 53); // lime-400
  doc.text(invoice.invoiceNumber, pageWidth - 15, 27, { align: "right" });

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Status: ${invoice.status.toUpperCase()}`, pageWidth - 15, 34, { align: "right" });

  // Invoice Details & Billed To section
  let y = 52;
  doc.setTextColor(51, 65, 85); // slate-700
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("BILLED TO:", 15, y);
  doc.text("INVOICE DETAILS:", 120, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(invoice.client.name, 15, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`Invoice Date: ${formatDate(invoice.issueDate)}`, 120, y);

  y += 5;
  if (invoice.client.businessName) {
    doc.text(invoice.client.businessName, 15, y);
  }
  doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 120, y);

  y += 5;
  doc.text(invoice.client.email, 15, y);
  if (invoice.client.phone) {
    y += 5;
    doc.text(invoice.client.phone, 15, y);
  }
  if (invoice.client.address) {
    y += 5;
    doc.text(invoice.client.address.substring(0, 60), 15, y);
  }

  // Items Table Header
  y = Math.max(y + 12, 85);
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(15, y, pageWidth - 30, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text("Description", 18, y + 5.5);
  doc.text("Qty", 125, y + 5.5, { align: "right" });
  doc.text("Rate (INR)", 155, y + 5.5, { align: "right" });
  doc.text("Amount (INR)", pageWidth - 18, y + 5.5, { align: "right" });

  // Items Rows
  y += 9;
  const items: InvoiceItem[] =
    invoice.items && invoice.items.length > 0
      ? invoice.items
      : [
          {
            description: invoice.description,
            quantity: 1,
            rate: Math.round(invoice.subtotalPaise / 100),
            amount: Math.round(invoice.subtotalPaise / 100),
          },
        ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  for (const item of items) {
    doc.setTextColor(30, 41, 59);
    doc.text(item.description.substring(0, 55), 18, y + 5);
    doc.text(item.quantity.toString(), 125, y + 5, { align: "right" });
    doc.text(`₹${item.rate.toLocaleString("en-IN")}`, 155, y + 5, { align: "right" });
    doc.text(`₹${item.amount.toLocaleString("en-IN")}`, pageWidth - 18, y + 5, { align: "right" });

    // separator line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(15, y + 8, pageWidth - 15, y + 8);
    y += 9;
  }

  // Subtotal & Totals
  y += 4;
  const subtotalRupees = Math.round(invoice.subtotalPaise / 100);
  const totalRupees = Math.round(invoice.totalPaise / 100);
  const taxRupees = Math.round(invoice.taxPaise / 100);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("Subtotal:", 145, y, { align: "right" });
  doc.setTextColor(15, 23, 42);
  doc.text(`₹${subtotalRupees.toLocaleString("en-IN")}`, pageWidth - 18, y, { align: "right" });

  if (invoice.taxRatePercent > 0 || taxRupees > 0) {
    y += 6;
    doc.setTextColor(100, 116, 139);
    doc.text(`Tax (${invoice.taxRatePercent}%):`, 145, y, { align: "right" });
    doc.setTextColor(15, 23, 42);
    doc.text(`₹${taxRupees.toLocaleString("en-IN")}`, pageWidth - 18, y, { align: "right" });
  }

  y += 7;
  doc.setFillColor(241, 245, 249);
  doc.rect(115, y - 4, pageWidth - 130, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("Total Due:", 145, y + 2.5, { align: "right" });
  doc.setTextColor(22, 101, 52); // emerald-800
  doc.text(`₹${totalRupees.toLocaleString("en-IN")}`, pageWidth - 18, y + 2.5, { align: "right" });

  // Payment Instructions Box
  y += 18;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(15, y, pageWidth - 30, 36, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("PAYMENT INSTRUCTIONS & BANK DETAILS", 20, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  let py = y + 12;
  if (invoice.user.upiId) {
    doc.setFont("helvetica", "bold");
    doc.text("UPI ID: ", 20, py);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.user.upiId, 36, py);
    py += 5;
  }

  if (invoice.user.bankDetails) {
    doc.setFont("helvetica", "bold");
    doc.text("Bank Transfer: ", 20, py);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.user.bankDetails, 45, py);
    py += 5;
  }

  if (invoice.paymentLink) {
    doc.setFont("helvetica", "bold");
    doc.text("Payment Link: ", 20, py);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(2, 132, 199);
    doc.text(invoice.paymentLink, 44, py);
    doc.setTextColor(51, 65, 85);
  }

  // Notes
  if (invoice.notes) {
    y += 42;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Notes / Terms:", 15, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(invoice.notes.substring(0, 100), 15, y + 4.5);
  }

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Generated by InvoiceChaser — AI-Powered Invoice & Payment Management", pageWidth / 2, pageHeight - 10, {
    align: "center",
  });

  // Save the PDF
  doc.save(`${invoice.invoiceNumber}.pdf`);
}
