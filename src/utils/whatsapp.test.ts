import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TELEGRAM_DETAILS,
  TINTOL_PAYMENT_DETAILS,
  buildBankTransferWhatsAppMessage,
  buildCallUrl,
  buildProductShareUrl,
  buildTelegramUrl,
  buildWhatsAppUrl,
  isValidWhatsAppInviteUrl,
} from './whatsapp.ts';

test('buildCallUrl and buildWhatsAppUrl link to 2348034710699 cleanly', () => {
  assert.equal(buildCallUrl(), 'tel:+2348034710699');
  assert.equal(buildWhatsAppUrl(), 'https://wa.me/2348034710699');

  const withMsg = buildWhatsAppUrl('Hello Tintol');
  assert.equal(withMsg, 'https://wa.me/2348034710699?text=Hello%20Tintol');
});

test('buildBankTransferWhatsAppMessage includes GTB account details and order metadata', () => {
  const msg = buildBankTransferWhatsAppMessage({
    orderId: 'ORD-5501',
    customerName: 'Alex Rivera',
    customerEmail: 'student@coursemart.io',
    items: ['Distributed Systems Course'],
    total: 64990,
    paymentReference: 'GTB-REF-991',
  });

  assert.match(msg, /ORD-5501/);
  assert.match(msg, /0029103844/);
  assert.match(msg, /Tintol Business Services/);
  assert.match(msg, /GTB/);
  assert.match(msg, /₦64,990/);
  assert.match(msg, /GTB-REF-991/);
  assert.equal(TINTOL_PAYMENT_DETAILS.accountNumber, '0029103844');
});

test('buildProductShareUrl formats WhatsApp, Telegram, X, and LinkedIn share URLs', () => {
  const url = 'https://coursemart.example/product/test';
  const wa = buildProductShareUrl('whatsapp', 'TypeScript Course', url);
  const tg = buildProductShareUrl('telegram', 'TypeScript Course', url);
  const x = buildProductShareUrl('x', 'TypeScript Course', url);
  const li = buildProductShareUrl('linkedin', 'TypeScript Course', url);

  assert.match(wa, /^https:\/\/wa\.me\/\?text=/);
  assert.match(tg, /^https:\/\/t\.me\/share\/url\?url=/);
  assert.match(x, /^https:\/\/twitter\.com\/intent\/tweet\?/);
  assert.match(li, /^https:\/\/www\.linkedin\.com\/sharing\/share-offsite\/\?/);
  assert.equal(TELEGRAM_DETAILS.handle, '@digitalwealthcreators');
  assert.equal(buildTelegramUrl('@digitalwealthcreators'), 'https://t.me/digitalwealthcreators');
});

test('isValidWhatsAppInviteUrl validates chat.whatsapp.com invite links', () => {
  assert.equal(isValidWhatsAppInviteUrl('https://chat.whatsapp.com/AbCdEf123456'), true);
  assert.equal(isValidWhatsAppInviteUrl('https://wa.me/2348034710699'), true);
  assert.equal(isValidWhatsAppInviteUrl('https://example.com/group'), false);
  assert.equal(isValidWhatsAppInviteUrl(''), false);
});
