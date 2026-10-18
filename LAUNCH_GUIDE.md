# 🚀 InvoiceChaser - Production Launch & Monetization Guide

Turn **InvoiceChaser** into a revenue-generating SaaS business in under 30 minutes.

---

## 💰 How InvoiceChaser Generates Money

1. **Monthly / Annual SaaS Subscriptions**:
   - Freelancers and agencies pay **₹199 - ₹799/month** (or **$9 - $29/month**) for automated chasing, custom tone escalation, WhatsApp reminders, and unlimited invoices.
2. **Instant Client Settlements (`/pay/[id]`)**:
   - Every invoice reminder includes an instant payment link (`/pay/[invoiceId]`). End clients pay directly with UPI, Google Pay, PhonePe, Cards, or NetBanking.
3. **AI Chaser & Multi-Channel Credits**:
   - Sell add-on packs for automated WhatsApp messaging or AI phone call follow-ups.

---

## 🛠️ 4 Steps to Go Live & Collect Payments

### Step 1: Connect Your Real Payment Gateway (Where Money Lands in Your Bank)

1. Sign up for a free account at [Razorpay](https://razorpay.com) (recommended for India + Global) or [Stripe](https://stripe.com).
2. Complete your KYC (takes 1-2 days) and switch your mode to **Live Mode**.
3. Go to **Settings > API Keys** and generate:
   - `Key ID`
   - `Key Secret`
4. Set up a Webhook in Razorpay:
   - Webhook URL: `https://your-domain.com/api/webhooks/razorpay`
   - Active Events: `payment.captured`, `order.paid`, `subscription.charged`, `subscription.activated`, `subscription.cancelled`
   - Webhook Secret: Pick a secure secret and save it.

---

### Step 2: Set Up a Free Cloud Database (PostgreSQL)

SQLite (`dev.db`) is great for local testing, but production servers on Vercel require a cloud PostgreSQL database:

1. Create a free account at **[Neon.tech](https://neon.tech)** or **[Supabase.com](https://supabase.com)**.
2. Create a new project called `invoicechaser-prod`.
3. Copy the database connection string:
   ```
   DATABASE_URL="postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require"
   ```
4. Push your schema to the cloud:
   ```bash
   npx prisma db push
   ```

---

### Step 3: Deploy Free on Vercel

1. Push this repository to your GitHub account (`https://github.com/SirigangaBS/InvoiceChaser`).
2. Go to **[Vercel](https://vercel.com)** and log in with GitHub.
3. Click **Add New Project** and select `InvoiceChaser`.
4. Under **Environment Variables**, add:
   ```env
   DATABASE_URL=postgresql://...
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

   # Live Razorpay Keys
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx

   # Real Email Delivery (Free Resend API Key)
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=InvoiceChaser <onboarding@resend.dev>

   # Real AI Escalation (Optional OpenAI API Key)
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx
   ```
5. Click **Deploy**. Your app is live with SSL, global CDN, and automatic builds!

---

### Step 4: Acquisition Playbook — Getting Your First 10 Paying Customers

| Channel | Action | Expected Conversion |
| :--- | :--- | :--- |
| **Freelance Subreddits** (`r/freelance`, `r/webdev`, `r/graphic_design`) | Post: *"I got tired of chasing clients for unpaid invoices, so I built an automated AI chaser that collects via UPI/Cards in 1 click. Looking for 10 beta testers to try it free."* | 5-15 Signups |
| **LinkedIn Posts** | Share relatable memes/stories about late client payments and link to your landing page with a 3-day full free trial. | 10-20 Signups |
| **Cold Outreach to Freelance Agencies** | Search for boutique design and marketing agencies. Pitch: *"We help agencies recover overdue receivables 3x faster without awkward emails."* | 20-30% Trial Signup Rate |
| **Twitter / X #BuildInPublic** | Share screenshots of recovered invoices and payment links. | High viral potential |

---

## 🔒 Security & Multi-Tenancy

- All routes are protected and dynamically scoped to the logged-in user session.
- Client payment links (`/pay/[id]`) are secured and tamper-proof with SHA-256 cryptographic signature validation.
- Safe fallback mode enables testing without real credit cards or gateway keys until you are ready to switch to live.
