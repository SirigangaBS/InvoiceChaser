"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import CreateClientModal from "@/components/CreateClientModal";
import CreateInvoiceModal from "@/components/CreateInvoiceModal";
import {
  Users,
  Plus,
  Mail,
  Phone,
  Building,
  Edit2,
  Trash2,
  FileText,
  Clock,
  RefreshCw,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import Link from "next/link";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [invoiceModalClientId, setInvoiceModalClientId] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Failed to load clients");
      const data = await res.json();
      setClients(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDeleteClient = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete client ${name}?`)) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Cannot delete client");
        return;
      }
      fetchClients();
    } catch (e: any) {
      alert("Error deleting client: " + e.message);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-lime-400" />
              Clients Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage client companies, contact persons, and track outstanding receivables per client
            </p>
          </div>

          <button
            onClick={() => {
              setEditingClient(null);
              setIsClientModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-lime-500/20 transition active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client</span>
          </button>
        </div>

        {/* Clients Cards Grid */}
        {loading && clients.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-lime-400" />
            <p className="text-xs">Loading clients...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3 bg-[#0F1629] rounded-2xl border border-slate-800">
            <Users className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm">No clients registered yet.</p>
            <button
              onClick={() => setIsClientModalOpen(true)}
              className="text-xs text-lime-400 hover:underline"
            >
              Add your first client
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((c) => (
              <div
                key={c.id}
                className="p-6 rounded-2xl bg-[#0F1629] border border-slate-800 shadow-xl flex flex-col justify-between hover:border-slate-700 transition space-y-4 group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-lime-400 transition">
                        {c.name}
                      </h3>
                      {c.businessName && (
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Building className="w-3.5 h-3.5 text-slate-500" />
                          {c.businessName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingClient(c);
                          setIsClientModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                        title="Edit Client"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(c.id, c.name)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                        title="Delete Client"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                    {c.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Billing Summary Box */}
                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">Total Billed</span>
                      <div className="font-bold text-white mt-0.5">{formatINR(c.totalBilledPaise)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">Outstanding</span>
                      <div
                        className={`font-bold mt-0.5 ${
                          c.outstandingPaise > 0 ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        {formatINR(c.outstandingPaise)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <Link
                      href={`/invoices?search=${encodeURIComponent(c.name)}`}
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>{c.invoicesCount} Invoices</span>
                    </Link>

                    <button
                      onClick={() => setInvoiceModalClientId(c.id)}
                      className="text-xs font-semibold text-lime-400 hover:text-lime-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> New Invoice
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateClientModal
        isOpen={isClientModalOpen}
        onClose={() => {
          setIsClientModalOpen(false);
          setEditingClient(null);
        }}
        onSuccess={fetchClients}
        initialClient={editingClient}
      />

      {invoiceModalClientId && (
        <CreateInvoiceModal
          isOpen={Boolean(invoiceModalClientId)}
          onClose={() => setInvoiceModalClientId(null)}
          onSuccess={fetchClients}
          preselectedClientId={invoiceModalClientId}
        />
      )}
    </AppLayout>
  );
}
