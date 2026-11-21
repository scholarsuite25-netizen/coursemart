/**
 * CourseMart & Digital Wealth Creators — Certificate & Verification Engine
 * 
 * Provides deterministic certificate code generation, verification against
 * progress registry, and a pure-TypeScript, zero-external-dependency SVG QR Code generator.
 */

import type { CourseProgress, Product, UserAccount } from '../types/marketplace';

export interface CertificateVerificationResult {
  valid: boolean;
  studentName?: string;
  courseTitle?: string;
  completionDate?: string;
  issuer: string;
  authority: string;
  verificationCode: string;
  productId?: string;
  userId?: string;
  track?: string;
  error?: string;
}

export interface CertificateVerificationContext {
  progressList?: CourseProgress[];
  users?: UserAccount[];
  products?: Product[];
}

export interface QrSvgOptions {
  size?: number;
  fgColor?: string;
  bgColor?: string;
  margin?: number;
}

export const ISSUER_NAME = 'CourseMart & Digital Wealth Creators';
export const ISSUING_AUTHORITY = 'S. B. OMOTOSO (FCIA, MILR, MSc, MNIM)';

/**
 * Deterministic certificate code generator.
 * Format: CM-CERT-XXXX-XXXX (8 uppercase hexadecimal characters)
 */
export function generateCertificateCode(userId: string, courseId: string): string {
  const raw = `${userId}-${courseId}`.toUpperCase();
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  const hex = hash.toString(16).toUpperCase().padStart(8, '0');
  return `CM-CERT-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

/**
 * Validates if the string follows the CourseMart Certificate code convention.
 */
export function isValidCertificateFormat(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  const cleaned = code.trim().toUpperCase();
  return /^CM-CERT-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(cleaned) || /^CM-CERT-[A-Z0-9]{4,12}$/.test(cleaned);
}

/**
 * Formats a raw input into standardized CM-CERT-XXXX-XXXX representation.
 */
export function formatCertificateCode(raw: string): string {
  if (!raw) return '';
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.startsWith('CMCERT')) {
    const rest = cleaned.slice(6);
    if (rest.length >= 8) {
      return `CM-CERT-${rest.slice(0, 4)}-${rest.slice(4, 8)}`;
    }
  }
  return raw.trim().toUpperCase();
}

/**
 * Builds the canonical public verification URL for a given certificate.
 */
export function generateVerificationUrl(certificateCode: string, origin?: string): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://coursemart.ng');
  return `${base}/verify-certificate?id=${encodeURIComponent(certificateCode)}`;
}

/**
 * Canonical demo certificates for portfolio exploration and instant auditing.
 */
export const DEMO_CERTIFICATES: CertificateVerificationResult[] = [
  {
    valid: true,
    verificationCode: 'CM-CERT-7B3A-4F91',
    studentName: 'Ayodele Cephas',
    courseTitle: 'Fullstack Next.js, AI Agent & Vibe Coding Mastery',
    completionDate: 'January 15, 2026',
    issuer: ISSUER_NAME,
    authority: ISSUING_AUTHORITY,
    productId: 'course-1',
    userId: 'usr-student-1',
    track: 'AI Architecture & Fullstack Engineering',
  },
  {
    valid: true,
    verificationCode: 'CM-CERT-9C1D-8E24',
    studentName: 'Chidinma Okafor',
    courseTitle: 'Enterprise TypeScript, Microservices & Docker Deployments',
    completionDate: 'February 3, 2026',
    issuer: ISSUER_NAME,
    authority: ISSUING_AUTHORITY,
    productId: 'course-2',
    userId: 'usr-student-2',
    track: 'Cloud Infrastructure & DevOps',
  },
  {
    valid: true,
    verificationCode: 'CM-CERT-5E8F-2A73',
    studentName: 'Tunde Adeleke',
    courseTitle: 'Generative AI Prompt Engineering & Automation Workflows',
    completionDate: 'February 18, 2026',
    issuer: ISSUER_NAME,
    authority: ISSUING_AUTHORITY,
    productId: 'course-3',
    userId: 'usr-student-3',
    track: 'Executive AI Strategy',
  },
];

/**
 * Verifies certificate code authenticity against store progress records and fallback catalogs.
 */
export function verifyCertificate(
  certificateCode: string,
  context?: CertificateVerificationContext
): CertificateVerificationResult {
  const normalized = (certificateCode || '').trim().toUpperCase();

  if (!normalized) {
    return {
      valid: false,
      verificationCode: '',
      issuer: ISSUER_NAME,
      authority: ISSUING_AUTHORITY,
      error: 'Please enter a valid certificate identification number.',
    };
  }

  // Check demo credentials first
  const demoMatch = DEMO_CERTIFICATES.find(
    (d) => d.verificationCode.toUpperCase() === normalized
  );
  if (demoMatch) {
    return { ...demoMatch };
  }

  // Validate formatting
  if (!isValidCertificateFormat(normalized)) {
    return {
      valid: false,
      verificationCode: normalized,
      issuer: ISSUER_NAME,
      authority: ISSUING_AUTHORITY,
      error: 'Invalid certificate format. Expected format: CM-CERT-XXXX-XXXX',
    };
  }

  // Look up within store context progress list if provided
  if (context?.progressList && context.progressList.length > 0) {
    const progress = context.progressList.find(
      (p) =>
        p.certificateCode?.toUpperCase() === normalized ||
        generateCertificateCode(p.userId, p.productId) === normalized
    );

    if (progress) {
      const user = context.users?.find((u) => u.id === progress.userId);
      const product = context.products?.find((p) => p.id === progress.productId);

      const formattedDate = progress.updatedAt
        ? new Date(progress.updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

      return {
        valid: true,
        verificationCode: normalized,
        studentName: user?.name || 'Verified Graduate Student',
        courseTitle: product?.title || 'Professional Certification Curriculum',
        completionDate: formattedDate,
        issuer: ISSUER_NAME,
        authority: ISSUING_AUTHORITY,
        productId: progress.productId,
        userId: progress.userId,
        track: product?.category || 'Executive Technology Mastery',
      };
    }
  }

  // Check if valid format matches any user+product pair in context
  if (context?.users && context?.products) {
    for (const u of context.users) {
      for (const p of context.products) {
        if (generateCertificateCode(u.id, p.id) === normalized) {
          return {
            valid: true,
            verificationCode: normalized,
            studentName: u.name,
            courseTitle: p.title,
            completionDate: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            issuer: ISSUER_NAME,
            authority: ISSUING_AUTHORITY,
            productId: p.id,
            userId: u.id,
            track: p.category || 'Executive Technology Mastery',
          };
        }
      }
    }
  }

  // If matches valid format but not in current state, provide verification with notice
  return {
    valid: false,
    verificationCode: normalized,
    issuer: ISSUER_NAME,
    authority: ISSUING_AUTHORITY,
    error: 'Certificate ID not found in current course completion records. Please check the code and try again.',
  };
}

/* =========================================================================
   PURE TYPESCRIPT REED-SOLOMON & QR MATRIX GENERATOR (ZERO DEPENDENCY)
   ========================================================================= */

// Precomputed GF(256) tables for QR polynomial operations
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let v = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = v;
    GF_LOG[v] = i;
    v <<= 1;
    if (v & 0x100) v ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[GF_LOG[x] + GF_LOG[y]];
}

function rsGenPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = rsGenPoly(ecCount);
  const remainder = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    for (let j = 0; j < ecCount - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gfMul(factor, gen[j + 1]);
    }
    remainder[ecCount - 1] = gfMul(factor, gen[ecCount]);
  }
  return remainder;
}

interface QrVersionSpec {
  version: number;
  totalCodewords: number;
  dataCodewords: number;
  ecCodewords: number;
  alignmentPositions: number[];
}

const QR_SPECS: QrVersionSpec[] = [
  { version: 1, totalCodewords: 26, dataCodewords: 19, ecCodewords: 7, alignmentPositions: [] },
  { version: 2, totalCodewords: 44, dataCodewords: 34, ecCodewords: 10, alignmentPositions: [6, 18] },
  { version: 3, totalCodewords: 70, dataCodewords: 55, ecCodewords: 15, alignmentPositions: [6, 22] },
  { version: 4, totalCodewords: 100, dataCodewords: 80, ecCodewords: 20, alignmentPositions: [6, 26] },
  { version: 5, totalCodewords: 134, dataCodewords: 108, ecCodewords: 26, alignmentPositions: [6, 30] },
  { version: 6, totalCodewords: 172, dataCodewords: 136, ecCodewords: 36, alignmentPositions: [6, 34] },
  { version: 7, totalCodewords: 196, dataCodewords: 156, ecCodewords: 40, alignmentPositions: [6, 22, 38] },
  { version: 8, totalCodewords: 242, dataCodewords: 194, ecCodewords: 48, alignmentPositions: [6, 24, 42] },
];

/**
 * Generates a 2D boolean matrix representing an authentic, scannable QR Code.
 */
export function generateQrMatrix(text: string): boolean[][] {
  const utf8Bytes = new TextEncoder().encode(text);
  const dataLen = utf8Bytes.length;

  // Pick smallest fitting version
  const spec = QR_SPECS.find((s) => s.dataCodewords >= dataLen + 3) || QR_SPECS[QR_SPECS.length - 1];
  const size = spec.version * 4 + 17;

  // 1. Bit buffer encoding: Byte Mode (0100) + 8-bit length + data + terminator + padding
  const bits: number[] = [0, 1, 0, 0]; // Byte mode indicator
  const lenBits = spec.version <= 9 ? 8 : 16;
  for (let i = lenBits - 1; i >= 0; i--) {
    bits.push((dataLen >> i) & 1);
  }
  for (let i = 0; i < dataLen; i++) {
    const b = utf8Bytes[i];
    for (let j = 7; j >= 0; j--) {
      bits.push((b >> j) & 1);
    }
  }

  // Terminator (up to 4 zeroes)
  const maxDataBits = spec.dataCodewords * 8;
  const termLen = Math.min(4, maxDataBits - bits.length);
  for (let i = 0; i < termLen; i++) bits.push(0);

  // Pad to multiple of 8
  while (bits.length % 8 !== 0) bits.push(0);

  // Pad bytes: 0xEC (11101100), 0x11 (00010001)
  const padPatterns = [
    [1, 1, 1, 0, 1, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 1],
  ];
  let padIdx = 0;
  while (bits.length < maxDataBits) {
    bits.push(...padPatterns[padIdx % 2]);
    padIdx++;
  }

  // Convert bits to data codewords
  const dataCodewords = new Uint8Array(spec.dataCodewords);
  for (let i = 0; i < spec.dataCodewords; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    dataCodewords[i] = b;
  }

  // Compute Reed-Solomon error correction codewords
  const ecCodewords = rsEncode(dataCodewords, spec.ecCodewords);

  // Combine data + EC into allCodewords
  const allCodewords = new Uint8Array(spec.totalCodewords);
  allCodewords.set(dataCodewords, 0);
  allCodewords.set(ecCodewords, spec.dataCodewords);

  // Convert all codewords to bit stream
  const finalBits: number[] = [];
  for (let i = 0; i < allCodewords.length; i++) {
    const byte = allCodewords[i];
    for (let j = 7; j >= 0; j--) {
      finalBits.push((byte >> j) & 1);
    }
  }

  // 2. Setup matrix and reserved flags
  const matrix: (number | null)[][] = Array.from({ length: size }, () => new Array(size).fill(null));
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  // Helper to place finder pattern + separator
  const placeFinder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = r0 + r;
        const nc = c0 + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          reserved[nr][nc] = true;
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBlack =
              r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
            matrix[nr][nc] = isBlack ? 1 : 0;
          } else {
            matrix[nr][nc] = 0; // white separator
          }
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let c = 8; c < size - 8; c++) {
    reserved[6][c] = true;
    matrix[6][c] = c % 2 === 0 ? 1 : 0;
  }
  for (let r = 8; r < size - 8; r++) {
    reserved[r][6] = true;
    matrix[r][6] = r % 2 === 0 ? 1 : 0;
  }

  // Alignment patterns
  const alignCoords = spec.alignmentPositions;
  for (const ar of alignCoords) {
    for (const ac of alignCoords) {
      // Don't overlap with finders
      if ((ar === 6 && ac === 6) || (ar === 6 && ac === size - 7) || (ar === size - 7 && ac === 6)) {
        continue;
      }
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const nr = ar + r;
          const nc = ac + c;
          reserved[nr][nc] = true;
          const isBlack = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
          matrix[nr][nc] = isBlack ? 1 : 0;
        }
      }
    }
  }

  // Dark module
  reserved[size - 8][8] = true;
  matrix[size - 8][8] = 1;

  // Reserve format info areas
  for (let i = 0; i <= 8; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }

  // 3. Format bits (Level L = 01, Mask 0 = 000 -> 01000b = 8)
  const formatData = (1 << 3) | 0; // L level, mask 0
  let formatShift = formatData << 10;
  const poly = 0x537;
  for (let i = 14; i >= 10; i--) {
    if ((formatShift >> i) & 1) formatShift ^= poly << (i - 10);
  }
  const formatBitsVal = ((formatData << 10) | formatShift) ^ 0x5412;

  // Place format bits:
  // Top-left finder
  const formatCoordsTopLeft: [number, number][] = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  for (let i = 0; i < 15; i++) {
    const bit = (formatBitsVal >> i) & 1;
    const [r, c] = formatCoordsTopLeft[i];
    matrix[r][c] = bit;
  }

  // Split around top-right & bottom-left
  for (let i = 0; i < 7; i++) {
    const bit = (formatBitsVal >> i) & 1;
    matrix[size - 1 - i][8] = bit;
  }
  for (let i = 7; i < 15; i++) {
    const bit = (formatBitsVal >> i) & 1;
    matrix[8][size - 15 + i] = bit;
  }

  // 4. Place data bits in zigzag 2-column paths
  let bitIdx = 0;
  let upwards = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // Skip vertical timing column
    const rows = upwards
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const row of rows) {
      for (const c of [col, col - 1]) {
        if (!reserved[row][c]) {
          let bit = bitIdx < finalBits.length ? finalBits[bitIdx] : 0;
          bitIdx++;

          // Apply mask pattern 0: (row + col) % 2 === 0
          if ((row + c) % 2 === 0) {
            bit ^= 1;
          }
          matrix[row][c] = bit;
        }
      }
    }
    upwards = !upwards;
  }

  // Convert to clean boolean[][]
  return matrix.map((row) => row.map((cell) => cell === 1));
}

/**
 * Generates an executive SVG string of the QR Code without any external network dependencies.
 */
export function generateQrCodeSvg(text: string, options: QrSvgOptions = {}): string {
  const { size = 180, fgColor = '#0a192f', bgColor = '#ffffff', margin = 2 } = options;
  const matrix = generateQrMatrix(text);
  const matrixSize = matrix.length;
  const viewBoxSize = matrixSize + margin * 2;

  let pathData = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        pathData += `M${c + margin},${r + margin}h1v1h-1z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="${size}" height="${size}" shape-rendering="crispEdges" aria-label="QR Code"><rect width="${viewBoxSize}" height="${viewBoxSize}" fill="${bgColor}"/><path d="${pathData.trim()}" fill="${fgColor}"/></svg>`;
}

/**
 * Generates a data URI for use in <img> tags or printable documents.
 */
export function generateQrCodeDataUri(text: string, options: QrSvgOptions = {}): string {
  const svg = generateQrCodeSvg(text, options);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
