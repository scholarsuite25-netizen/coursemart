import test from 'node:test';
import assert from 'node:assert/strict';
import { CURRENCY_CODE, CURRENCY_SYMBOL, formatNaira } from './currency.ts';
import { escapeHtml, sanitizeEmailHeader } from './sanitize.ts';

test('formatNaira formats whole, fractional, zero, and negative Naira amounts cleanly', () => {
  assert.equal(CURRENCY_CODE, 'NGN');
  assert.equal(CURRENCY_SYMBOL, '₦');
  assert.equal(formatNaira(65000), '₦65,000');
  assert.equal(formatNaira(0), '₦0');
  assert.equal(formatNaira(-19000), '-₦19,000');
  assert.equal(formatNaira(12500.5), '₦12,500.50');
  assert.equal(formatNaira(45000, { showKobo: true }), '₦45,000.00');
});

test('escapeHtml and sanitizeEmailHeader neutralize HTML XSS and header CRLF injection', () => {
  assert.equal(
    escapeHtml('<script>alert("xss")</script> & \'test\''),
    '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &#39;test&#39;'
  );
  assert.equal(
    sanitizeEmailHeader('Subject\r\nBcc: attacker@evil.com'),
    'Subject Bcc: attacker@evil.com'
  );
});
