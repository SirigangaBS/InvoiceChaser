export function formatINR(paise: number): string {
  const rupees = Math.round(paise / 100);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

export function formatINRAmount(rupees: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateForInput(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export function getDaysOverdue(dueDateInput: string | Date): number {
  const due = new Date(dueDateInput);
  const now = new Date();
  // Normalize to midnight
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = now.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "REMINDER_SENT"
  | "OVERDUE"
  | "PAID"
  | "CANCELLED";

export function getEffectiveStatus(invoice: {
  status: string;
  dueDate: string | Date;
  paidPaise: number;
  totalPaise: number;
}): InvoiceStatus {
  if (invoice.status === "CANCELLED") return "CANCELLED";
  if (invoice.paidPaise >= invoice.totalPaise && invoice.totalPaise > 0) return "PAID";
  if (invoice.status === "PAID") return "PAID";
  if (invoice.status === "DRAFT") return "DRAFT";

  const daysOverdue = getDaysOverdue(invoice.dueDate);
  if (daysOverdue > 0) {
    return "OVERDUE";
  }

  if (invoice.status === "REMINDER_SENT") return "REMINDER_SENT";
  return "SENT";
}

export function getStatusBadgeInfo(status: string) {
  switch (status.toUpperCase()) {
    case "PAID":
      return {
        label: "Paid",
        bg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        dot: "bg-emerald-400",
      };
    case "OVERDUE":
      return {
        label: "Overdue",
        bg: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
        dot: "bg-rose-400",
      };
    case "REMINDER_SENT":
      return {
        label: "Reminder Sent",
        bg: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        dot: "bg-amber-400",
      };
    case "SENT":
      return {
        label: "Sent",
        bg: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        dot: "bg-blue-400",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        bg: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
        dot: "bg-zinc-400",
      };
    case "DRAFT":
    default:
      return {
        label: "Draft",
        bg: "bg-slate-500/10 text-slate-300 border border-slate-500/20",
        dot: "bg-slate-400",
      };
  }
}
