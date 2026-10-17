import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InvoiceChaser — AI-Powered Invoice Management & Smart Follow-ups",
  description:
    "Created for Indian freelancers and consultants to generate GST invoices, track payments, and automate polite smart reminders.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#090D16] text-slate-100 selection:bg-lime-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
