require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ============================================
// TEMPORARY: CREATE ADMIN USER
// ============================================
app.post('/api/setup-admin', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('bbor2026admin', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@bbor.org',
        password: hashedPassword,
        name: 'BBOR Admin',
        role: 'admin'
      }
    });
    
    res.json({ success: true, admin: { email: admin.email } });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// ============================================
// AUTH ROUTES
// ============================================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token
app.get('/api/auth/verify', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true }
    });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ============================================
// DONATION ROUTES
// ============================================

// Get all donations
app.get('/api/donations', authMiddleware, async (req, res) => {
  try {
    const donations = await prisma.donation.findMany({
      include: { cause: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

// Get donation stats
app.get('/api/donations/stats', authMiddleware, async (req, res) => {
  try {
    const totalDonations = await prisma.donation.count();
    const completedDonations = await prisma.donation.count({
      where: { status: 'completed' }
    });
    
    const totalAmount = await prisma.donation.aggregate({
      where: { status: 'completed' },
      _sum: { amountUsd: true }
    });

    res.json({
      total: totalDonations,
      completed: completedDonations,
      totalAmount: totalAmount._sum.amountUsd || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// NowPayments webhook
app.post('/api/webhooks/nowpayments', async (req, res) => {
  try {
    // TODO: Verify webhook signature
    const { payment_id, payment_status, price_amount, price_currency, pay_amount, pay_currency } = req.body;

    await prisma.donation.create({
      data: {
        amount: parseFloat(price_amount),
        currency: price_currency,
        amountUsd: price_currency === 'USD' ? parseFloat(price_amount) : parseFloat(price_amount) * 0.04,
        paymentMethod: 'card',
        status: payment_status === 'finished' ? 'completed' : 'pending',
        nowpaymentsId: payment_id,
        cryptoAmount: parseFloat(pay_amount),
        cryptoCurrency: pay_currency
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ============================================
// CAUSES ROUTES
// ============================================

app.get('/api/causes', async (req, res) => {
  try {
    const causes = await prisma.cause.findMany({
      orderBy: { order: 'asc' }
    });
    res.json(causes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch causes' });
  }
});

app.post('/api/causes', authMiddleware, async (req, res) => {
  try {
    const cause = await prisma.cause.create({ data: req.body });
    res.json(cause);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create cause' });
  }
});

app.put('/api/causes/:id', authMiddleware, async (req, res) => {
  try {
    const cause = await prisma.cause.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(cause);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cause' });
  }
});

app.delete('/api/causes/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.cause.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete cause' });
  }
});

// ============================================
// NEWS ROUTES
// ============================================

app.get('/api/news', async (req, res) => {
  try {
    const news = await prisma.news.findMany({
      where: req.query.status ? { status: req.query.status } : {},
      orderBy: { date: 'desc' }
    });
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

app.post('/api/news', authMiddleware, async (req, res) => {
  try {
    const newsItem = await prisma.news.create({ data: req.body });
    res.json(newsItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create news' });
  }
});

app.put('/api/news/:id', authMiddleware, async (req, res) => {
  try {
    const newsItem = await prisma.news.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(newsItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update news' });
  }
});

app.delete('/api/news/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.news.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete news' });
  }
});

// ============================================
// STORIES ROUTES
// ============================================

app.get('/api/stories', async (req, res) => {
  try {
    const stories = await prisma.story.findMany({
      where: req.query.status ? { status: req.query.status } : {},
      orderBy: { order: 'asc' }
    });
    res.json(stories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

app.post('/api/stories', authMiddleware, async (req, res) => {
  try {
    const story = await prisma.story.create({ data: req.body });
    res.json(story);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create story' });
  }
});

app.put('/api/stories/:id', authMiddleware, async (req, res) => {
  try {
    const story = await prisma.story.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(story);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update story' });
  }
});

app.delete('/api/stories/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.story.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete story' });
  }
});

// ============================================
// FAQ ROUTES
// ============================================

app.get('/api/faqs', async (req, res) => {
  try {
    const faqs = await prisma.fAQ.findMany({
      where: req.query.status ? { status: req.query.status } : {},
      orderBy: { order: 'asc' }
    });
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

app.post('/api/faqs', authMiddleware, async (req, res) => {
  try {
    const faq = await prisma.fAQ.create({ data: req.body });
    res.json(faq);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

app.put('/api/faqs/:id', authMiddleware, async (req, res) => {
  try {
    const faq = await prisma.fAQ.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(faq);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

app.delete('/api/faqs/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.fAQ.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

// ============================================
// BANK ACCOUNT ROUTES
// ============================================

app.get('/api/bank-accounts', authMiddleware, async (req, res) => {
  try {
    const accounts = await prisma.bankAccount.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bank accounts' });
  }
});

app.post('/api/bank-accounts', authMiddleware, async (req, res) => {
  try {
    if (req.body.isDefault) {
      await prisma.bankAccount.updateMany({
        data: { isDefault: false }
      });
    }

    const account = await prisma.bankAccount.create({ data: req.body });
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create bank account' });
  }
});

app.put('/api/bank-accounts/:id', authMiddleware, async (req, res) => {
  try {
    if (req.body.isDefault) {
      await prisma.bankAccount.updateMany({
        data: { isDefault: false }
      });
    }

    const account = await prisma.bankAccount.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update bank account' });
  }
});

app.delete('/api/bank-accounts/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.bankAccount.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete bank account' });
  }
});

// ============================================
// WITHDRAWAL ROUTES
// ============================================

app.get('/api/withdrawals', authMiddleware, async (req, res) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

app.post('/api/withdrawals', authMiddleware, async (req, res) => {
  try {
    const withdrawal = await prisma.withdrawal.create({
      data: {
        ...req.body,
        status: 'pending'
      }
    });
    res.json(withdrawal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create withdrawal' });
  }
});

// ============================================
// SITE IMAGES ROUTES
// ============================================

app.get('/api/images', authMiddleware, async (req, res) => {
  try {
    const images = await prisma.siteImage.findMany({
      where: req.query.page ? { page: req.query.page } : {}
    });
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

app.put('/api/images/:id', authMiddleware, async (req, res) => {
  try {
    const image = await prisma.siteImage.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(image);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update image' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BBOR Backend running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});