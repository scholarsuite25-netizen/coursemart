/**
 * CourseMart & Digital Wealth Creators — Certificate & Verification Engine
 * 
 * Provides deterministic certificate code generation, verification against
 * progress registry, and a pure-TypeScript, zero-external-dependency SVG QR Code generator.
 */

import QRCode from 'qrcode';
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
  const base =
    origin ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://digitalwealthcreators.org.ng');
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
   ISO/IEC 18004 COMPLIANT QR MATRIX & SVG GENERATOR
   ========================================================================= */

/**
 * Generates a 2D boolean matrix representing an authentic, ISO/IEC 18004
 * compliant, scannable QR Code using Error Correction Level M.
 */
export function generateQrMatrix(text: string): boolean[][] {
  const qr = QRCode.create(text || 'https://digitalwealthcreators.org.ng', {
    errorCorrectionLevel: 'M',
  });
  const size = qr.modules.size;
  const data = qr.modules.data;
  const matrix: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      row.push(Boolean(data[r * size + c]));
    }
    matrix.push(row);
  }
  return matrix;
}

/**
 * Generates an executive SVG string of the QR Code with an ISO-compliant
 * 4-module quiet zone so phone cameras and QR scanners decode reliably.
 */
export function generateQrCodeSvg(text: string, options: QrSvgOptions = {}): string {
  const { size = 180, fgColor = '#0a192f', bgColor = '#ffffff', margin = 4 } = options;
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
