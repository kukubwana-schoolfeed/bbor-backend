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
app.use(express.json({ limit: '10mb' })); // Increase payload limit for images
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
        amountUsd: price_currency === 'USD' ? parseFloat(price_amount) : parseFloat(price_amount) * 0.04, // Rough conversion
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
    // If setting as default, unset other defaults
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
    // TODO: Implement actual withdrawal logic when payment processor is ready
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

// Get all images (PUBLIC - for frontend)
app.get('/api/images', async (req, res) => {
  try {
    const where = {};
    if (req.query.page) where.page = req.query.page;
    if (req.query.location) where.location = req.query.location;
    
    const images = await prisma.siteImage.findMany({ where });
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

// ============================================
// GALLERY/ALBUMS ROUTES
// ============================================

// Get all albums (PUBLIC)
app.get('/api/albums', async (req, res) => {
  try {
    const albums = await prisma.album.findMany({
      where: req.query.status ? { status: req.query.status } : {},
      include: {
        photos: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });
    res.json(albums);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

// Get single album with photos (PUBLIC)
app.get('/api/albums/:id', async (req, res) => {
  try {
    const album = await prisma.album.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        photos: {
          orderBy: { order: 'asc' }
        }
      }
    });
    res.json(album);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch album' });
  }
});

// Create album (ADMIN)
app.post('/api/albums', authMiddleware, async (req, res) => {
  try {
    const album = await prisma.album.create({
      data: req.body
    });
    res.json(album);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create album' });
  }
});

// Update album (ADMIN)
app.put('/api/albums/:id', authMiddleware, async (req, res) => {
  try {
    const album = await prisma.album.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(album);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update album' });
  }
});

// Delete album (ADMIN)
app.delete('/api/albums/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.album.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete album' });
  }
});

// Add photo to album (ADMIN)
app.post('/api/albums/:id/photos', authMiddleware, async (req, res) => {
  try {
    const photo = await prisma.albumPhoto.create({
      data: {
        albumId: parseInt(req.params.id),
        ...req.body
      }
    });
    res.json(photo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add photo' });
  }
});

// Delete photo from album (ADMIN)
app.delete('/api/albums/:albumId/photos/:photoId', authMiddleware, async (req, res) => {
  try {
    await prisma.albumPhoto.delete({
      where: { id: parseInt(req.params.photoId) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Update photo caption (ADMIN)
app.put('/api/albums/:albumId/photos/:photoId', authMiddleware, async (req, res) => {
  try {
    const photo = await prisma.albumPhoto.update({
      where: { id: parseInt(req.params.photoId) },
      data: { caption: req.body.caption }
    });
    res.json(photo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update photo' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.get('/api/crypto-wallet', authMiddleware, async (req, res) => {
  try {
    const wallet = await prisma.cryptoWallet.findFirst({
      where: { isActive: true }
    })
    res.json(wallet || null)
  } catch (error) {
    console.error('Error fetching crypto wallet:', error)
    res.status(500).json({ error: 'Failed to fetch crypto wallet' })
  }
})

app.post('/api/crypto-wallet', authMiddleware, async (req, res) => {
  try {
    const { walletAddress, walletName } = req.body

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' })
    }

    await prisma.cryptoWallet.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })

    const wallet = await prisma.cryptoWallet.create({
      data: {
        walletAddress,
        walletName: walletName || 'Sling USDC Wallet',
        network: 'Solana',
        currency: 'USDC',
        isActive: true
      }
    })

    res.json(wallet)
  } catch (error) {
    console.error('Error creating crypto wallet:', error)
    res.status(500).json({ error: 'Failed to create crypto wallet' })
  }
})

app.put('/api/crypto-wallet/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { walletAddress, walletName } = req.body

    const wallet = await prisma.cryptoWallet.update({
      where: { id: parseInt(id) },
      data: {
        walletAddress,
        walletName: walletName || 'Sling USDC Wallet'
      }
    })

    res.json(wallet)
  } catch (error) {
    console.error('Error updating crypto wallet:', error)
    res.status(500).json({ error: 'Failed to update crypto wallet' })
  }
})

app.delete('/api/crypto-wallet/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    await prisma.cryptoWallet.delete({
      where: { id: parseInt(id) }
    })
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting crypto wallet:', error)
    res.status(500).json({ error: 'Failed to delete crypto wallet' })
  }
})

app.get('/api/payment-settings', authMiddleware, async (req, res) => {
  try {
    let settings = await prisma.paymentSettings.findFirst()
    
    if (!settings) {
      settings = await prisma.paymentSettings.create({
        data: {
          withdrawalMode: 'manual',
          minimumWithdrawal: 50
        }
      })
    }

    res.json(settings)
  } catch (error) {
    console.error('Error fetching payment settings:', error)
    res.status(500).json({ error: 'Failed to fetch payment settings' })
  }
})

app.put('/api/payment-settings', authMiddleware, async (req, res) => {
  try {
    const { nowpaymentsApiKey, withdrawalMode, minimumWithdrawal } = req.body

    let settings = await prisma.paymentSettings.findFirst()

    if (!settings) {
      settings = await prisma.paymentSettings.create({
        data: {
          nowpaymentsApiKey,
          withdrawalMode,
          minimumWithdrawal
        }
      })
    } else {
      settings = await prisma.paymentSettings.update({
        where: { id: settings.id },
        data: {
          nowpaymentsApiKey,
          withdrawalMode,
          minimumWithdrawal
        }
      })
    }

    res.json(settings)
  } catch (error) {
    console.error('Error updating payment settings:', error)
    res.status(500).json({ error: 'Failed to update payment settings' })
  }
})


app.post('/api/payments/create', async (req, res) => {

  try {

    const { amount, currency, donorName, donorEmail, causeName, successUrl, cancelUrl } = req.body

    if (!amount || !donorEmail) {

      return res.status(400).json({ error: 'Amount and email are required' })

    }

    // Get NowPayments API key from database

    const settings = await prisma.paymentSettings.findFirst()

    if (!settings || !settings.nowpaymentsApiKey) {

      return res.status(500).json({ error: 'Payment system not configured' })

    }

    // Create payment via NowPayments API

    const response = await fetch('https://api.nowpayments.io/v1/invoice', {

      method: 'POST',

      headers: {

        'x-api-key': settings.nowpaymentsApiKey,

        'Content-Type': 'application/json'

      },

      body: JSON.stringify({

        price_amount: amount,

        price_currency: 'usd',

        pay_currency: 'usdcsol',

        order_id: 'BBOR-' + Date.now(),

        order_description: causeName || 'Donation to BBOR Orphanage',

        success_url: successUrl,

        cancel_url: cancelUrl,


        is_fixed_rate: true,

        is_fee_paid_by_user: false

      })

    })

    const data = await response.json()

    if (!response.ok) {

      console.error('NowPayments error:', data)

      return res.status(500).json({ error: data.message || 'Payment creation failed' })

    }

    // Save transaction to database

    await prisma.donationTransaction.create({

      data: {

        orderId: data.id.toString(),

        amount: amount,

        currency: 'USD',

        paymentStatus: 'pending',

        donorEmail: donorEmail,

        donorName: donorName || 'Anonymous'

      }

    })

    res.json({

      paymentUrl: data.invoice_url,

      paymentId: data.id

    })

  } catch (error) {

    console.error('Payment creation error:', error)

    res.status(500).json({ error: 'Payment creation failed' })

  }

})

// WEBHOOK - NowPayments calls this when payment status changes

app.post('/api/payments/webhook', async (req, res) => {

  try {

    const { payment_id, payment_status, order_id, actually_paid, pay_currency } = req.body

    console.log('Payment webhook received:', req.body)

    // Update transaction in database

    await prisma.donationTransaction.updateMany({

      where: { orderId: order_id.toString() },

      data: {

        paymentStatus: payment_status,

        cryptoAmount: actually_paid,

        cryptoCurrency: pay_currency

      }

    })

    res.json({ success: true })

  } catch (error) {

    console.error('Webhook error:', error)

    res.status(500).json({ error: 'Webhook processing failed' })

  }

})

// GET transactions (for admin)

app.get('/api/transactions', authMiddleware, async (req, res) => {

  try {

    const transactions = await prisma.donationTransaction.findMany({

      orderBy: { createdAt: 'desc' },

      take: 50

    })

    res.json(transactions)

  } catch (error) {

    res.status(500).json({ error: 'Failed to fetch transactions' })

  }

})

const { Connection, PublicKey, Keypair, Transaction, SystemProgram } = require('@solana/web3.js');
const bs58 = require('bs58');
const CryptoJS = require('crypto-js');

// Encryption key (store in environment variable)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'bbor-secret-key-change-this';

function encryptPrivateKey(privateKey) {
  return CryptoJS.AES.encrypt(privateKey, ENCRYPTION_KEY).toString();
}

function decryptPrivateKey(encryptedKey) {
  const bytes = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// CREATE PAYMENT
app.post('/api/moonpay/create-payment', async (req, res) => {
  try {
    const { amount, currency, donorName, donorEmail, cardNumber, expiryDate, cvv, causeName } = req.body;

    if (!amount || !donorEmail || !cardNumber || !expiryDate || !cvv) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Get MoonPay settings
    const settings = await prisma.moonPaySettings.findFirst();
    if (!settings || !settings.publicKey || !settings.secretKey) {
      return res.status(500).json({ error: 'Payment system not configured' });
    }

    const expiryParts = expiryDate.split('/');
    const expiryMonth = expiryParts[0];
    const expiryYear = '20' + expiryParts[1];

    // Create MoonPay transaction
    const moonpayResponse = await fetch('https://api.moonpay.com/v3/transactions', {
      method: 'POST',
      headers: {
        'Authorization': 'Api-Key ' + settings.secretKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        baseCurrencyAmount: amount,
        baseCurrencyCode: 'usd',
        quoteCurrencyCode: 'usdc_sol',
        walletAddress: settings.phantomWalletAddress,
        email: donorEmail,
        cardNumber: cardNumber,
        expiryMonth: expiryMonth,
        expiryYear: expiryYear,
        cvv: cvv,
        cardHolderName: donorName
      })
    });

    const moonpayData = await moonpayResponse.json();

    if (!moonpayResponse.ok) {
      console.error('MoonPay error:', moonpayData);
      return res.status(500).json({ error: moonpayData.message || 'Payment failed' });
    }

    // Save transaction
    await prisma.moonPayTransaction.create({
      data: {
        transactionId: moonpayData.id,
        amount: amount,
        currency: 'USD',
        status: moonpayData.status,
        donorName: donorName,
        donorEmail: donorEmail,
        cardLast4: cardNumber.slice(-4)
      }
    });

    res.json({ success: true, transactionId: moonpayData.id });

  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// WEBHOOK - MoonPay calls this
app.post('/api/moonpay/webhook', async (req, res) => {
  try {
    const { id, status, cryptoCurrencyAmount } = req.body;

    console.log('MoonPay webhook:', req.body);

    // Update transaction
    await prisma.moonPayTransaction.updateMany({
      where: { transactionId: id },
      data: {
        status: status,
        cryptoAmount: cryptoCurrencyAmount
      }
    });

    // If completed, trigger transfer to Sling
    if (status === 'completed') {
      const settings = await prisma.moonPaySettings.findFirst();
      if (settings && settings.autoTransferEnabled) {
        await transferToSling(id);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook failed' });
  }
});

// TRANSFER USDC FROM PHANTOM TO SLING
async function transferToSling(transactionId) {
  try {
    const settings = await prisma.moonPaySettings.findFirst();
    const transaction = await prisma.moonPayTransaction.findUnique({
      where: { transactionId: transactionId }
    });

    if (!settings || !transaction || !transaction.cryptoAmount) {
      console.error('Missing settings or transaction');
      return;
    }

    // Decrypt private key
    const privateKeyDecrypted = decryptPrivateKey(settings.phantomPrivateKey);
    
    // Convert seed phrase to keypair
    const seedWords = privateKeyDecrypted.split(' ');
    const seed = seedWords.map(word => word.charCodeAt(0)); // Simplified - use proper BIP39 in production
    const keypair = Keypair.fromSeed(Uint8Array.from(seed).slice(0, 32));

    // Connect to Solana
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

    // Get USDC token account addresses (this is simplified - use SPL Token in production)
    const fromPubkey = new PublicKey(settings.phantomWalletAddress);
    const toPubkey = new PublicKey(settings.slingWalletAddress);

    // Create transfer transaction (simplified - use @solana/spl-token for actual USDC transfer)
    const transferAmount = transaction.cryptoAmount * 1000000; // Convert to lamports

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromPubkey,
        toPubkey: toPubkey,
        lamports: transferAmount
      })
    );

    // Send transaction
    const signature = await connection.sendTransaction(tx, [keypair]);
    await connection.confirmTransaction(signature);

    // Update transaction as transferred
    await prisma.moonPayTransaction.update({
      where: { transactionId: transactionId },
      data: { transferredToSling: true }
    });

    console.log('Transfer successful:', signature);

  } catch (error) {
    console.error('Transfer failed:', error);
  }
}

// MANUAL TRANSFER ENDPOINT (for admin)
app.post('/api/moonpay/transfer-to-sling', authMiddleware, async (req, res) => {
  try {
    const { transactionId } = req.body;
    await transferToSling(transactionId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Transfer failed' });
  }
});

// GET MOONPAY SETTINGS
app.get('/api/moonpay/settings', authMiddleware, async (req, res) => {
  try {
    let settings = await prisma.moonPaySettings.findFirst();
    
    if (!settings) {
      settings = await prisma.moonPaySettings.create({
        data: { autoTransferEnabled: true }
      });
    }

    // Don't send private key to frontend
    const { phantomPrivateKey, ...safeSettings } = settings;
    res.json(safeSettings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// UPDATE MOONPAY SETTINGS
app.put('/api/moonpay/settings', authMiddleware, async (req, res) => {
  try {
    const { publicKey, secretKey, webhookSecret, phantomWalletAddress, phantomPrivateKey, slingWalletAddress, autoTransferEnabled } = req.body;

    let settings = await prisma.moonPaySettings.findFirst();

    const data = {
      publicKey,
      secretKey,
      webhookSecret,
      phantomWalletAddress,
      slingWalletAddress,
      autoTransferEnabled
    };

    // Encrypt private key if provided
    if (phantomPrivateKey) {
      data.phantomPrivateKey = encryptPrivateKey(phantomPrivateKey);
    }

    if (!settings) {
      settings = await prisma.moonPaySettings.create({ data });
    } else {
      settings = await prisma.moonPaySettings.update({
        where: { id: settings.id },
        data
      });
    }

    const { phantomPrivateKey: _, ...safeSettings } = settings;
    res.json(safeSettings);
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// GET TRANSACTIONS
app.get('/api/moonpay/transactions', authMiddleware, async (req, res) => {
  try {
    const transactions = await prisma.moonPayTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 BBOR Backend running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
