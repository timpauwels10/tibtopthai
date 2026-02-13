import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createMollieClient } from '@mollie/api-client';
import { db } from '../db/index.js';
import { orders } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// Initialize Mollie client (only if key is configured)
let mollieClient = null;
if (process.env.MOLLIE_API_KEY) {
  mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });
}

// POST /api/orders — Create order + Mollie payment
router.post('/', async (req, res) => {
  try {
    const { type, customerName, customerPhone, customerEmail, customerAddress, items, notes } = req.body;

    if (!type || !customerName || !customerPhone || !items || !items.length) {
      return res.status(400).json({ error: 'Vul alle verplichte velden in.' });
    }

    if (type === 'delivery' && !customerAddress) {
      return res.status(400).json({ error: 'Vul uw leveringsadres in.' });
    }

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal;
    const orderId = uuidv4();

    // Insert order in DB (if DB is configured)
    if (process.env.DATABASE_URL) {
      await db.insert(orders).values({
        id: orderId,
        type,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        customerAddress: customerAddress || null,
        items,
        subtotal: subtotal.toFixed(2),
        total: total.toFixed(2),
        status: 'pending',
        notes: notes || null,
      });
    }

    // Create Mollie payment
    if (mollieClient) {
      const baseUrl = process.env.MOLLIE_WEBHOOK_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      const payment = await mollieClient.payments.create({
        amount: {
          currency: 'EUR',
          value: total.toFixed(2),
        },
        description: `Tib Top Thai - Bestelling`,
        redirectUrl: `${baseUrl}/bestel/bevestiging?order=${orderId}`,
        webhookUrl: `${baseUrl}/api/orders/webhook`,
        metadata: { orderId },
        method: ['bancontact', 'creditcard'],
      });

      // Update order with Mollie payment ID
      if (process.env.DATABASE_URL) {
        await db.update(orders)
          .set({ molliePaymentId: payment.id })
          .where(eq(orders.id, orderId));
      }

      return res.json({ checkoutUrl: payment.getCheckoutUrl(), orderId });
    }

    // No Mollie configured — return success for development
    return res.json({ orderId, message: 'Bestelling ontvangen (test modus — geen betaling)' });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Er ging iets mis bij het plaatsen van uw bestelling.' });
  }
});

// POST /api/orders/webhook — Mollie webhook
router.post('/webhook', async (req, res) => {
  try {
    const { id: paymentId } = req.body;

    if (!mollieClient || !paymentId) {
      return res.status(200).send('OK');
    }

    const payment = await mollieClient.payments.get(paymentId);
    const orderId = payment.metadata.orderId;

    if (payment.isPaid()) {
      await db.update(orders)
        .set({ status: 'paid', updatedAt: new Date() })
        .where(eq(orders.id, orderId));
    } else if (payment.isFailed() || payment.isExpired() || payment.isCanceled()) {
      await db.update(orders)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(orders.id, orderId));
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).send('OK');
  }
});

// GET /api/orders/:id — Get order status
router.get('/:id', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({ id: req.params.id, status: 'paid', items: [] });
    }

    const order = await db.select().from(orders).where(eq(orders.id, req.params.id)).limit(1);

    if (!order.length) {
      return res.status(404).json({ error: 'Bestelling niet gevonden.' });
    }

    res.json(order[0]);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Er ging iets mis.' });
  }
});

export default router;
