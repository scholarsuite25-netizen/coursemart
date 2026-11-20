import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProviderEmailRequest,
  resolveEmailProviderConfig,
  stripHtmlToPlainText,
} from './emailProvider.ts';

test('resolveEmailProviderConfig prioritizes EMAILBUMP_API_KEY and accepts EMAILBUMB_API_KEY alias', () => {
  const withStandard = resolveEmailProviderConfig({
    EMAILBUMP_API_KEY: 'ebk_live_test_12345',
    RESEND_API_KEY: 're_live_test_12345',
    EMAIL_FROM: 'Coursemart <hello@coursemart.io>',
  });
  assert.equal(withStandard.provider, 'emailbump');
  assert.deepEqual(withStandard.configuredProviders, ['emailbump', 'resend']);
  assert.equal(withStandard.apiKey, 'ebk_live_test_12345');
  assert.equal(withStandard.apiUrl, 'https://emailbump.com/api/v1/emails');

  const withAlias = resolveEmailProviderConfig({
    EMAILBUMB_API_KEY: 'ebk_alias_key_999',
  });
  assert.equal(withAlias.provider, 'emailbump');
  assert.equal(withAlias.apiKey, 'ebk_alias_key_999');

  const withOverride = resolveEmailProviderConfig(
    {
      EMAILBUMP_API_KEY: 'ebk_live_test_12345',
      RESEND_API_KEY: 're_live_test_12345',
    },
    'resend'
  );
  assert.equal(withOverride.provider, 'resend');
  assert.equal(withOverride.apiKey, 're_live_test_12345');
});

test('buildProviderEmailRequest builds valid EmailBump v1 payload with html and plain text fallback', () => {
  const resolution = resolveEmailProviderConfig({
    EMAILBUMP_API_KEY: 'ebk_test_token_123',
    EMAIL_FROM: 'Coursemart <team@coursemart.io>',
  });

  const req = buildProviderEmailRequest(
    resolution,
    { email: 'builder@example.com', name: 'Builder' },
    'Pre-Event Kit Ready',
    '<div><p>Hello &amp; welcome!</p><p>Join us live.</p></div>'
  );

  assert.equal(req.url, 'https://emailbump.com/api/v1/emails');
  assert.equal(req.headers.Authorization, 'Bearer ebk_test_token_123');
  assert.deepEqual(req.body.to, ['builder@example.com']);
  assert.equal(req.body.from, 'Coursemart <team@coursemart.io>');
  assert.equal(req.body.subject, 'Pre-Event Kit Ready');
  assert.equal(req.body.text, 'Hello & welcome!\nJoin us live.');
});

test('stripHtmlToPlainText converts HTML blocks cleanly to plain text', () => {
  const text = stripHtmlToPlainText(
    '<h2>Title</h2><p>First&nbsp;line<br/>Second line</p><p>Third &amp; final</p>'
  );
  assert.equal(text, 'Title\nFirst line\nSecond line\nThird & final');
});
