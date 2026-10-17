# InvoiceChaser — AI-Powered Invoice & Payment Follow-Up SaaS

InvoiceChaser helps Indian freelancers, tutors, designers, consultants, and small agencies create GST invoices, track payments, and automatically follow up with clients who pay late.

**Core Promise:** Create an invoice once, and InvoiceChaser manages the follow-up process until settled.

---

## 🌟 Key Features

1. **Fintech Financial Dashboard**
   - Real-time calculated receivables: **₹1,84,500 Outstanding**, **₹42,000 Overdue**, **₹3,26,000 Collected this month**, **86% Collection Rate**.
   - Monthly invoicing vs collection dynamics SVG chart.
   - Quick action to create invoices, record payments, and launch AI follow-ups.

2. **Smart Reminder AI Agent (Main Feature)**
   - Drafts polite, personalized follow-up emails strictly using verified invoice facts.
   - **Tone Selector**: *Friendly* (gentle nudge), *Professional* (courteous business standard), *Firm* (urgent overdue escalation).
   - Server-side prompt protection: Treats client input as untrusted data to guard against prompt injection.
   - Full live integration with **OpenAI (`gpt-4o-mini`)** when `OPENAI_API_KEY` is provided.
   - Clearly labelled **Honest Simulated AI Fallback** when running in offline/demo mode without API credentials.
   - Editable drafts, copy to clipboard, and explicit confirmation before sending.

3. **Multi-Stage Reminder Cadence Schedule**
   - **Stage 1 (-1d):** Friendly reminder 1 day before due date.
   - **Stage 2 (0d):** Prompt on due date with payment details.
   - **Stage 3 (+3d):** Professional escalation at 3 days overdue.
   - **Stage 4 (+7d):** Firm follow-up for settlement at 7+ days overdue.
   - Manual *"Check Due Reminders"* scanner button. Reminders immediately cease once an invoice is marked paid.

4. **Client & Invoice Management (INR Paise Precision)**
   - Create, edit, search, and filter invoices by status (*Draft*, *Sent*, *Reminder Sent*, *Overdue*, *Paid*, *Cancelled*).
   - Monetary values stored in integer **paise** to eliminate floating-point rounding errors.
   - Manage client companies, contacts, and track outstanding balances per client.

5. **Instant PDF Invoice Generator**
   - Clean, professional Indian GST/Freelancer invoice format built with `jsPDF`.
   - Embeds freelancer business name, client details, line items table, subtotal, tax %, UPI ID, and bank transfer credentials.

6. **Payment Tracking & Audit Trail**
   - Record manual/UPI payments with transaction notes.
   - Automatically decrements balance and marks invoice as `PAID` when fully settled.
   - Persistent activity log for all invoices, payments, and reminder events.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 16 (App Router with TypeScript)
- **Styling:** Tailwind CSS (Dark Navy Fintech Theme: `#090D16`, `#0F1629`, Lime Green accents)
- **Database & ORM:** SQLite with Prisma ORM 6.4.1
- **AI Integration:** OpenAI SDK (`gpt-4o-mini`) with tailored simulated demo fallback
- **Email Delivery:** Resend SDK with verified safe demo-send simulation
- **Document Generation:** `jspdf` for client-side Indian Rupee PDF generation
- **Icons:** `lucide-react`

---

## 🚀 Quick Start Guide (Windows PowerShell)

### 1. Install Dependencies
```powershell
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```
*(The application works out-of-the-box in Demo Mode with SQLite without any external API keys).*

### 3. Initialize & Seed Database
```powershell
npx prisma db push
node prisma/seed.js
```

### 4. Start Local Development Server
```powershell
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables (`.env`)

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | SQLite database connection URL | `"file:./dev.db"` |
| `OPENAI_API_KEY` | *(Optional)* OpenAI API key for live AI generation | Empty (activates demo AI fallback) |
| `RESEND_API_KEY` | *(Optional)* Resend API key for live email sending | Empty (activates demo-send fallback) |
| `EMAIL_FROM` | Verified sender address for Resend | `InvoiceChaser <onboarding@resend.dev>` |

---

## 🛡️ Honest Demo Disclosures

- **Demo User Mode:** Runs with a sample freelancer account (*Aarav Sharma - Aarav Creative Studio*).
- **AI Integration:** If `OPENAI_API_KEY` is not provided in `.env`, InvoiceChaser clearly identifies messages as *Demo Simulated AI* rather than pretending a live model was called.
- **Email Delivery:** If `RESEND_API_KEY` is not provided in `.env`, the *Approve & Send* flow records the reminder event to the SQLite database without transmitting real emails to the sample client addresses.
- **One-Click Demo Reset:** Click the *"Reset Demo Data"* button in the sidebar or Settings page at any time to restore the initial hackathon sample figures.
