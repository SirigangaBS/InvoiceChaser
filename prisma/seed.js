const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding InvoiceChaser demo database...');

  // Helper for 3-day trial calculation
  const now = new Date();
  const trialEnds = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Seed Plans
  await prisma.plan.upsert({
    where: { id: 'trial' },
    update: {
      priceInPaise: 0,
      invoiceLimit: 5,
      aiReminderLimit: 10,
    },
    create: {
      id: 'trial',
      name: 'Free Trial (3 Days)',
      priceInPaise: 0,
      billingInterval: 'trial',
      invoiceLimit: 5,
      aiReminderLimit: 10,
      featuresJson: JSON.stringify([
        '3-day full feature access',
        'Up to 5 invoices',
        '10 AI reminder drafts',
        'PDF invoice downloads with UPI details',
        'No credit card required upfront',
      ]),
    },
  });

  await prisma.plan.upsert({
    where: { id: 'starter' },
    update: {
      priceInPaise: 19900,
      invoiceLimit: 50,
      aiReminderLimit: 100,
    },
    create: {
      id: 'starter',
      name: 'Starter Plan',
      priceInPaise: 19900, // ₹199 / month
      billingInterval: 'monthly',
      invoiceLimit: 50,
      aiReminderLimit: 100,
      featuresJson: JSON.stringify([
        'Up to 50 active invoices per month',
        '100 Smart AI reminder drafts',
        'Multi-stage cadence scheduler (-1d, 0d, +3d, +7d)',
        'Verified Resend email delivery',
        'Unlimited PDF invoice downloads',
        'Payment logging & balance updates',
      ]),
    },
  });

  await prisma.plan.upsert({
    where: { id: 'pro' },
    update: {
      priceInPaise: 39900,
      invoiceLimit: -1,
      aiReminderLimit: -1,
    },
    create: {
      id: 'pro',
      name: 'Pro Plan',
      priceInPaise: 39900, // ₹399 / month
      billingInterval: 'monthly',
      invoiceLimit: -1, // Unlimited
      aiReminderLimit: -1, // Unlimited
      featuresJson: JSON.stringify([
        'Unlimited invoices & clients',
        'Unlimited Smart AI reminders',
        'Custom tone calibration & brand styling',
        'Priority email delivery & webhooks',
        'Full analytics & cash-flow tracking',
        'Export all business data anytime',
      ]),
    },
  });

  // Upsert default demo user
  const user = await prisma.user.upsert({
    where: { email: 'freelancer@invoicechaser.dev' },
    update: {
      password: 'demo123456',
      trialStartedAt: now,
      trialEndsAt: trialEnds,
      subscriptionStatus: 'TRIAL',
      planId: 'trial',
    },
    create: {
      id: 'demo-user-1',
      email: 'freelancer@invoicechaser.dev',
      password: 'demo123456',
      name: 'Aarav Sharma',
      businessName: 'Aarav Creative Studio',
      businessAddress: '402, Indiranagar 100ft Road, Bengaluru, Karnataka 560038',
      upiId: 'aaravsharma@okhdfcbank',
      bankDetails: 'HDFC Bank | A/C: 5010023491823 | IFSC: HDFC0000128',
      phone: '+91 98765 43210',
      role: 'ADMIN',
      trialStartedAt: now,
      trialEndsAt: trialEnds,
      subscriptionStatus: 'TRIAL',
      planId: 'trial',
    },
  });

  // Seed Admin Evaluator User
  await prisma.user.upsert({
    where: { email: 'admin@invoicechaser.dev' },
    update: {
      password: 'admin123456',
      role: 'ADMIN',
    },
    create: {
      id: 'admin-user-1',
      email: 'admin@invoicechaser.dev',
      password: 'admin123456',
      name: 'Admin Evaluator',
      businessName: 'InvoiceChaser Internal Ops',
      role: 'ADMIN',
      subscriptionStatus: 'ACTIVE',
      planId: 'pro',
    },
  });

  // Create initial demo active trial subscription record
  await prisma.subscription.deleteMany({ where: { userId: user.id } });
  await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: 'trial',
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: trialEnds,
    },
  });

  // Clean existing data for clean demo state if needed
  await prisma.webhookEvent.deleteMany({});
  await prisma.subscriptionPayment.deleteMany({ where: { userId: user.id } });
  await prisma.activityLog.deleteMany({ where: { userId: user.id } });
  await prisma.payment.deleteMany({});
  await prisma.reminder.deleteMany({});
  await prisma.invoice.deleteMany({ where: { userId: user.id } });
  await prisma.client.deleteMany({ where: { userId: user.id } });

  // Create Clients
  const client1 = await prisma.client.create({
    data: {
      userId: user.id,
      name: 'Kavita Rao',
      email: 'kavita.rao@pixelcrafters.in',
      phone: '+91 98201 54321',
      businessName: 'PixelCrafters Media Pvt Ltd',
      address: 'Plot 14, HSR Layout Sector 4, Bengaluru, KA',
      notes: 'Creative director for brand identity and design projects.',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      userId: user.id,
      name: 'Rahul Verma',
      email: 'rahul.verma@zentechdigital.com',
      phone: '+91 97112 89901',
      businessName: 'ZenTech Digital Solutions',
      address: 'DLF Cyber City, Tower B, Gurugram, HR',
      notes: 'SaaS development consultancy and contract client.',
    },
  });

  const client3 = await prisma.client.create({
    data: {
      userId: user.id,
      name: 'Pooja Hegde',
      email: 'pooja@bloomfitness.co',
      phone: '+91 94481 22334',
      businessName: 'Bloom Fitness Studios',
      address: 'Bandra West, Hill Road, Mumbai, MH',
      notes: 'Monthly digital marketing and web maintenance.',
    },
  });

  const client4 = await prisma.client.create({
    data: {
      userId: user.id,
      name: 'Vikram Malhotra',
      email: 'vikram@apexadvisory.in',
      phone: '+91 98860 11223',
      businessName: 'Apex Financial Advisory',
      address: 'MG Road, Connaught Place, New Delhi, DL',
      notes: 'Quarterly pitch deck & visual design retainer.',
    },
  });

  // Helpers for dates
  const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const daysAhead = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  // Invoices
  // 1. Overdue Invoice 1: Kavita Rao (14 days overdue) - ₹42,000 (4,200,000 paise)
  const inv1 = await prisma.invoice.create({
    data: {
      userId: user.id,
      clientId: client1.id,
      invoiceNumber: 'INV-2026-001',
      description: 'Brand Identity Design & Mobile App UI Kit',
      itemsJson: JSON.stringify([
        { description: 'Design System & Figma Tokens', quantity: 1, rate: 25000, amount: 25000 },
        { description: 'Mobile App Wireframes & Interactive Prototypes', quantity: 1, rate: 17000, amount: 17000 },
      ]),
      issueDate: daysAgo(29),
      dueDate: daysAgo(14),
      currency: 'INR',
      subtotalPaise: 4200000,
      taxRatePercent: 0,
      taxPaise: 0,
      totalPaise: 4200000,
      paidPaise: 0,
      paymentLink: 'https://pay.upigateway.demo/inv/2026-001',
      notes: 'Net 15 days payment terms. Please transfer to UPI or Bank details on invoice.',
      status: 'OVERDUE',
    },
  });

  // 2. Outstanding Invoice 2: Rahul Verma (Due in 5 days) - ₹1,42,500 (14,250,000 paise)
  // Total Outstanding = 42,000 + 1,42,500 = ₹1,84,500! Matches target demo specification exactly.
  const inv2 = await prisma.invoice.create({
    data: {
      userId: user.id,
      clientId: client2.id,
      invoiceNumber: 'INV-2026-002',
      description: 'Full-Stack Next.js Web Application Milestone 2',
      itemsJson: JSON.stringify([
        { description: 'Backend Architecture & API Endpoints', quantity: 1, rate: 75000, amount: 75000 },
        { description: 'Frontend Dashboard & Real-time Analytics', quantity: 1, rate: 67500, amount: 67500 },
      ]),
      issueDate: daysAgo(10),
      dueDate: daysAhead(5),
      currency: 'INR',
      subtotalPaise: 14250000,
      taxRatePercent: 0,
      taxPaise: 0,
      totalPaise: 14250000,
      paidPaise: 0,
      paymentLink: 'https://pay.upigateway.demo/inv/2026-002',
      notes: 'Milestone 2 deliverable sign-off complete. Net 15 days.',
      status: 'SENT',
    },
  });

  // 3. Paid Invoice 1: Vikram Malhotra - ₹2,00,000 (Collected this month)
  const inv3 = await prisma.invoice.create({
    data: {
      userId: user.id,
      clientId: client4.id,
      invoiceNumber: 'INV-2026-003',
      description: 'Annual Pitch Deck & Corporate Branding Suite',
      itemsJson: JSON.stringify([
        { description: 'Annual Corporate Pitch Deck (45 Slides)', quantity: 1, rate: 120000, amount: 120000 },
        { description: 'Interactive Investor Demo Site', quantity: 1, rate: 80000, amount: 80000 },
      ]),
      issueDate: daysAgo(25),
      dueDate: daysAgo(5),
      currency: 'INR',
      subtotalPaise: 20000000,
      taxRatePercent: 0,
      taxPaise: 0,
      totalPaise: 20000000,
      paidPaise: 20000000,
      paymentLink: '',
      notes: 'Paid via IMPS Bank Transfer on 10 Oct 2026.',
      status: 'PAID',
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv3.id,
      amountPaise: 20000000,
      paymentDate: daysAgo(6),
      paymentMethod: 'BANK_TRANSFER',
      referenceNote: 'IMPS/HDFC/20261011/REF88912',
    },
  });

  // 4. Paid Invoice 2: Pooja Hegde - ₹1,26,000 (Collected this month)
  // Total Collected this month = 2,00,000 + 1,26,000 = ₹3,26,000! Matches target demo specification exactly.
  const inv4 = await prisma.invoice.create({
    data: {
      userId: user.id,
      clientId: client3.id,
      invoiceNumber: 'INV-2026-004',
      description: 'E-commerce Website & Gym Booking Portal',
      itemsJson: JSON.stringify([
        { description: 'Custom Shopify theme customization', quantity: 1, rate: 70000, amount: 70000 },
        { description: 'Payment gateway integration & testing', quantity: 1, rate: 56000, amount: 56000 },
      ]),
      issueDate: daysAgo(20),
      dueDate: daysAgo(2),
      currency: 'INR',
      subtotalPaise: 12600000,
      taxRatePercent: 0,
      taxPaise: 0,
      totalPaise: 12600000,
      paidPaise: 12600000,
      paymentLink: '',
      notes: 'Paid via UPI QR Code.',
      status: 'PAID',
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv4.id,
      amountPaise: 12600000,
      paymentDate: daysAgo(3),
      paymentMethod: 'UPI',
      referenceNote: 'UPI/HDFC/9923812831/TXN',
    },
  });

  // 5. Draft Invoice: Vikram Malhotra - ₹65,000
  await prisma.invoice.create({
    data: {
      userId: user.id,
      clientId: client4.id,
      invoiceNumber: 'INV-2026-005',
      description: 'Q4 Financial Infographics & Quarterly Report Template',
      itemsJson: JSON.stringify([
        { description: 'Vector infographics pack (12 graphics)', quantity: 1, rate: 40000, amount: 40000 },
        { description: 'Print-ready PDF report design', quantity: 1, rate: 25000, amount: 25000 },
      ]),
      issueDate: now,
      dueDate: daysAhead(15),
      currency: 'INR',
      subtotalPaise: 6500000,
      taxRatePercent: 0,
      taxPaise: 0,
      totalPaise: 6500000,
      paidPaise: 0,
      status: 'DRAFT',
    },
  });

  // Sample Reminder for inv1
  await prisma.reminder.create({
    data: {
      invoiceId: inv1.id,
      tone: 'Friendly',
      recipientEmail: 'kavita.rao@pixelcrafters.in',
      subject: 'Gentle Reminder: Invoice INV-2026-001 for PixelCrafters',
      body: 'Hi Kavita,\n\nHope you are having a wonderful week! Just following up on invoice INV-2026-001 for ₹42,000 which was due on ' + daysAgo(14).toLocaleDateString('en-IN') + '.\n\nPlease let me know if you need any additional invoice copy or banking information.\n\nWarm regards,\nAarav Sharma\nAarav Creative Studio',
      status: 'SENT',
      provider: 'DEMO_SIMULATED',
      providerId: 'demo_sim_msg_001',
      sentAt: daysAgo(7),
    },
  });

  // Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: user.id,
        action: 'INVOICE_CREATED',
        details: 'Created invoice INV-2026-005 (Draft) for Vikram Malhotra',
        createdAt: daysAgo(0),
      },
      {
        userId: user.id,
        action: 'PAYMENT_RECEIVED',
        details: 'Received ₹1,26,000 via UPI for invoice INV-2026-004 from Pooja Hegde',
        createdAt: daysAgo(3),
      },
      {
        userId: user.id,
        action: 'REMINDER_SENT',
        details: 'AI Friendly payment reminder sent to Kavita Rao for INV-2026-001',
        createdAt: daysAgo(7),
      },
      {
        userId: user.id,
        action: 'PAYMENT_RECEIVED',
        details: 'Received ₹2,00,000 via Bank Transfer for invoice INV-2026-003 from Vikram Malhotra',
        createdAt: daysAgo(6),
      },
    ],
  });

  console.log('✅ Demo database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
