import { pgTable, uuid, serial, text, decimal, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const orderTypeEnum = pgEnum('order_type', ['pickup', 'delivery']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'paid', 'confirmed', 'ready', 'completed', 'cancelled']);

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey(),
  orderNumber: serial('order_number'),
  type: orderTypeEnum('type').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerEmail: text('customer_email'),
  customerAddress: text('customer_address'),
  items: jsonb('items').notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum('status').notNull().default('pending'),
  molliePaymentId: text('mollie_payment_id'),
  estimatedPickupTime: text('estimated_pickup_time'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
