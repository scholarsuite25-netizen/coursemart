import test from 'node:test';
import assert from 'node:assert/strict';
import jsQR from 'jsqr';
import {
  generateQrMatrix,
  generateQrCodeSvg,
  generateQrCodeDataUri,
  generateVerificationUrl,
} from './certificateUtils.ts';

function renderMatrixToRgba(matrix: boolean[][], margin = 4, scale = 4) {
  const modules = matrix.length;
  const totalModules = modules + margin * 2;
  const width = totalModules * scale;
  const height = totalModules * scale;
  const data = new Uint8ClampedArray(width * height * 4);

  // Fill white background
  data.fill(255);

  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (!matrix[r][c]) continue;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const px = (c + margin) * scale + dx;
          const py = (r + margin) * scale + dy;
          const idx = (py * width + px) * 4;
          data[idx] = 10;     // #0a192f R
          data[idx + 1] = 25; // #0a192f G
          data[idx + 2] = 47; // #0a192f B
          data[idx + 3] = 255;
        }
      }
    }
  }

  return { data, width, height };
}

test('generateVerificationUrl defaults to digitalwealthcreators.org.ng', () => {
  const url = generateVerificationUrl('CM-CERT-7B3A-4F91');
  assert.equal(
    url,
    'https://digitalwealthcreators.org.ng/verify-certificate?id=CM-CERT-7B3A-4F91'
  );
});

test('generateQrMatrix produces a real scannable QR code decoded by jsQR', () => {
  const urls = [
    'https://digitalwealthcreators.org.ng/verify-certificate?id=CM-CERT-7B3A-4F91',
    'https://digitalwealthcreators.org.ng/verify-certificate?id=CM-CERT-9C1D-8E24',
    'https://digitalwealthcreators-2je8ge3nj-digitalwealthcreators-projects.vercel.app/verify-certificate?id=CM-CERT-ABCD-1234',
  ];

  for (const expectedUrl of urls) {
    const matrix = generateQrMatrix(expectedUrl);
    assert.ok(matrix.length >= 21, 'QR matrix must be at least Version 1 (21x21)');
    const { data, width, height } = renderMatrixToRgba(matrix, 4, 4);
    const decoded = jsQR(data, width, height);
    assert.ok(decoded, `jsQR failed to scan QR code for ${expectedUrl}`);
    assert.equal(decoded.data, expectedUrl);
  }
});

test('generateQrCodeSvg and generateQrCodeDataUri include 4-module quiet zone', () => {
  const url = generateVerificationUrl('CM-CERT-7B3A-4F91');
  const matrix = generateQrMatrix(url);
  const svg = generateQrCodeSvg(url);
  const expectedViewBox = matrix.length + 8; // margin=4 on each side
  assert.ok(
    svg.includes(`viewBox="0 0 ${expectedViewBox} ${expectedViewBox}"`),
    'SVG should use 4-module quiet zone by default'
  );
  const dataUri = generateQrCodeDataUri(url);
  assert.ok(dataUri.startsWith('data:image/svg+xml;utf8,'));
});
