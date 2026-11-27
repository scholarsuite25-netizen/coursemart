import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Copy,
  ExternalLink,
  GraduationCap,
  HelpCircle,
  Printer,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  DEMO_CERTIFICATES,
  ISSUER_NAME,
  ISSUING_AUTHORITY,
  formatCertificateCode,
  generateQrCodeDataUri,
  generateVerificationUrl,
  verifyCertificate,
  type CertificateVerificationResult,
} from '../../utils/certificateUtils';

interface VerifyCertificatePageProps {
  certificateId?: string;
}

export function VerifyCertificatePage({ certificateId }: VerifyCertificatePageProps) {
  const { progressList, users, products, currentUser, navigate, showToast } = useStore();

  // Extract initial ID from prop or URL search param
  const initialCode = useMemo(() => {
    if (certificateId && certificateId.trim()) return certificateId.trim();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('id') || params.get('cert');
      if (q) return q.trim();
    }
    return '';
  }, [certificateId]);

  const [inputCode, setInputCode] = useState<string>(initialCode);
  const [activeCode, setActiveCode] = useState<string>(initialCode);
  const [verificationResult, setVerificationResult] = useState<CertificateVerificationResult | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Perform verification when activeCode changes
  useEffect(() => {
    if (!activeCode || !activeCode.trim()) {
      setVerificationResult(null);
      setHasSearched(false);
      return;
    }

    setIsVerifying(true);
    setHasSearched(true);

    // Simulate verification check
    const result = verifyCertificate(activeCode.trim(), {
      progressList,
      users,
      products,
    });

    setVerificationResult(result);
    setIsVerifying(false);
  }, [activeCode, progressList, users, products]);

  // Synchronize when certificateId prop changes
  useEffect(() => {
    if (certificateId && certificateId.trim() && certificateId.trim() !== activeCode) {
      setInputCode(certificateId.trim());
      setActiveCode(certificateId.trim());
    }
  }, [certificateId, activeCode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const formatted = formatCertificateCode(inputCode.trim());
    setInputCode(formatted);
    setActiveCode(formatted);
  };

  const handleSelectDemo = (code: string) => {
    setInputCode(code);
    setActiveCode(code);
  };

  const handleCopyCode = (code: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      showToast(`Copied certificate ID: ${code}`);
    } else {
      showToast(`Certificate ID: ${code}`);
    }
  };

  const qrDataUri = useMemo(() => {
    if (!verificationResult || !verificationResult.valid) return '';
    const url = generateVerificationUrl(verificationResult.verificationCode);
    return generateQrCodeDataUri(url, {
      size: 140,
      fgColor: '#0a192f',
      bgColor: '#ffffff',
      margin: 4,
    });
  }, [verificationResult]);

  const handlePrintVerification = () => {
    if (!verificationResult || !verificationResult.valid) return;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Verification Record - ${verificationResult.verificationCode}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #0a192f; }
    .card { border: 4px solid #0a192f; outline: 2px solid #d4af37; padding: 24px; max-width: 650px; margin: 0 auto; background: #fafaf9; }
    h1 { color: #0a192f; font-size: 20px; text-transform: uppercase; margin-bottom: 4px; }
    .badge { color: #059669; font-weight: bold; font-size: 13px; text-transform: uppercase; margin-bottom: 16px; }
    .item { margin-bottom: 12px; }
    .label { font-size: 11px; text-transform: uppercase; color: #666; font-weight: bold; }
    .value { font-size: 16px; font-weight: bold; color: #0a192f; }
    .footer { margin-top: 20px; padding-top: 16px; border-top: 1px solid #d4af37; font-size: 11px; color: #555; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size:11px; font-weight:bold; color:#d4af37; letter-spacing:1px;">${ISSUER_NAME}</div>
    <h1>Official Credential Verification Record</h1>
    <div class="badge">✔ Cryptographically & Registry Verified</div>
    <div class="item"><div class="label">Certificate ID</div><div class="value">${verificationResult.verificationCode}</div></div>
    <div class="item"><div class="label">Awarded Student</div><div class="value">${verificationResult.studentName}</div></div>
    <div class="item"><div class="label">Curriculum / Course</div><div class="value">${verificationResult.courseTitle}</div></div>
    <div class="item"><div class="label">Completion Date</div><div class="value">${verificationResult.completionDate}</div></div>
    <div class="item"><div class="label">Issuing Authority</div><div class="value">${verificationResult.authority}</div></div>
    <div class="footer">Verified by Digital Wealth Creators (DWC) Global Registry Engine. Authenticity guarantee valid online.</div>
  </div>
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 200); };</script>
</body>
</html>`;
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  // Find certificates belonging to current user if enrolled
  const currentUserCertificates = useMemo(() => {
    if (!currentUser) return [];
    return progressList
      .filter((p) => p.userId === currentUser.id && p.certificateCode)
      .map((p) => {
        const prod = products.find((pr) => pr.id === p.productId);
        return {
          code: p.certificateCode!,
          courseTitle: prod?.title || 'Enrolled Course',
        };
      });
  }, [currentUser, progressList, products]);

  return (
    <div className="min-h-[85vh] bg-slate-50 dark:bg-[#07101f] text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#b48a1c] dark:text-[#f5c451] text-xs font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Wealth Creators Trust & Safety</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0a192f] dark:text-white tracking-tight">
            Certificate & Credential Verification
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Verify the authentic accreditation of any Digital Wealth Creators (DWC) digital certificate, issued by{' '}
            <strong className="text-slate-900 dark:text-white">{ISSUER_NAME}</strong> under the endorsement of{' '}
            <strong className="text-slate-900 dark:text-white">{ISSUING_AUTHORITY}</strong>.
          </p>
        </div>

        {/* Verification Search Bar */}
        <div className="bg-white dark:bg-[#0a192f] rounded-2xl shadow-xl border border-slate-200 dark:border-[#d4af37]/40 p-5 sm:p-7">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <label
              htmlFor="certificate-id-input"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
            >
              Enter Certificate ID or Verification Serial Number
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="certificate-id-input"
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="e.g. CM-CERT-7B3A-4F91"
                  className="w-full h-11 pl-10 pr-4 text-sm font-mono border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-[#06101e] focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                />
              </div>
              <button
                type="submit"
                disabled={isVerifying || !inputCode.trim()}
                className="h-11 px-6 bg-[#0a192f] dark:bg-[#d4af37] text-white dark:text-[#0a192f] rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#132742] dark:hover:bg-[#e5bf45] transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Credential</span>
              </button>
            </div>
          </form>

          {/* Quick Demo Certificate Buttons */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Explore Instant Demo Credentials:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {DEMO_CERTIFICATES.map((demo) => (
                <button
                  key={demo.verificationCode}
                  type="button"
                  onClick={() => handleSelectDemo(demo.verificationCode)}
                  className={`px-3 py-1.5 rounded-md border text-xs font-mono transition cursor-pointer ${
                    activeCode === demo.verificationCode
                      ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#b48a1c] dark:text-[#f5c451] font-bold'
                      : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#d4af37]'
                  }`}
                >
                  {demo.verificationCode} ({demo.studentName?.split(' ')[0] || 'Demo'})
                </button>
              ))}

              {/* Show current user's enrolled certificates if available */}
              {currentUserCertificates.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelectDemo(c.code)}
                  className="px-3 py-1.5 rounded-md border border-emerald-400/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-bold transition cursor-pointer hover:bg-emerald-100"
                  title={c.courseTitle}
                >
                  My Cert: {c.code}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Verification Result Area */}
        {hasSearched && (
          <div>
            {verificationResult?.valid ? (
              /* Verified Credential Card */
              <div className="bg-white dark:bg-[#0a192f] rounded-2xl shadow-2xl border-4 border-[#d4af37] ring-4 ring-[#0a192f]/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Gold Verification Banner */}
                <div className="bg-gradient-to-r from-[#0a192f] via-[#10274c] to-[#0a192f] text-white p-6 sm:p-8 border-b-2 border-[#d4af37]/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 text-xs font-bold tracking-wider uppercase">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Authentic Digital Credential Verified</span>
                      </div>
                      <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
                        Verified Certificate of Completion
                      </h2>
                      <p className="text-xs text-[#d4af37] font-semibold">
                        Officially Conferred by {ISSUER_NAME}
                      </p>
                    </div>

                    {/* QR Code thumbnail */}
                    {qrDataUri && (
                      <div className="shrink-0 p-2 bg-white rounded-xl shadow-md border-2 border-[#d4af37] self-start sm:self-auto">
                        <img
                          src={qrDataUri}
                          alt="Verification QR code"
                          className="w-20 h-20 object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Credential Data Grid */}
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Student Name */}
                    <div className="space-y-1 p-4 rounded-xl bg-slate-50 dark:bg-[#071324] border border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Awarded Graduate
                      </span>
                      <div className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#f5c451]">
                        {verificationResult.studentName}
                      </div>
                      <p className="text-xs text-slate-500">
                        Identity verified & credential record active in global ledger.
                      </p>
                    </div>

                    {/* Certificate Code */}
                    <div className="space-y-1 p-4 rounded-xl bg-slate-50 dark:bg-[#071324] border border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Certificate Serial Identifier
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-lg sm:text-xl font-extrabold text-[#0a192f] dark:text-white">
                          {verificationResult.verificationCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(verificationResult.verificationCode)}
                          aria-label="Copy certificate ID"
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        Deterministic checksum validated.
                      </p>
                    </div>

                    {/* Course Title */}
                    <div className="space-y-1 p-4 rounded-xl bg-slate-50 dark:bg-[#071324] border border-slate-200 dark:border-slate-800 md:col-span-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Curriculum Completed
                      </span>
                      <div className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                        {verificationResult.courseTitle}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <span>Track: <strong>{verificationResult.track || 'Executive Engineering'}</strong></span>
                        <span>•</span>
                        <span>Completion Date: <strong>{verificationResult.completionDate}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Issuing Endorsement Box */}
                  <div className="p-4 rounded-xl bg-[#0a192f]/5 dark:bg-[#071324] border border-[#d4af37]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Award className="w-8 h-8 text-[#d4af37] shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          Endorsed by {verificationResult.authority}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Founder & Executive Chancellor, {verificationResult.issuer}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePrintVerification}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0a192f] dark:bg-[#d4af37] text-white dark:text-[#0a192f] rounded-lg text-xs font-bold hover:bg-[#132742] dark:hover:bg-[#e5bf45] transition cursor-pointer shadow"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Record</span>
                      </button>

                      {verificationResult.productId && (
                        <button
                          type="button"
                          onClick={() => navigate(`/product/${verificationResult.productId}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Course</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Invalid Certificate Notice */
              <div className="bg-white dark:bg-[#0a192f] rounded-2xl shadow-xl border-2 border-rose-400 p-6 sm:p-8 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  Credential Verification Failed
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  {verificationResult?.error ||
                    'The certificate identifier entered could not be validated against our course completion registry.'}
                </p>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 max-w-sm mx-auto">
                  Searched: {activeCode}
                </div>
                <p className="text-xs text-slate-500">
                  Please confirm the certificate serial is in format <code>CM-CERT-XXXX-XXXX</code> or try one of the demo credentials above.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Informational Trust Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 dark:text-white">Deterministic Registry</strong>
              Every Digital Wealth Creators certificate is cryptographically keyed to the graduate and curriculum ID.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <GraduationCap className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 dark:text-white">Accredited Pedagogy</strong>
              Awarded only after completing 100% of video curriculum, quizzes, and project assessments.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Award className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 dark:text-white">Instant Verification</strong>
              Shareable link and QR code allow employers and recruiters to verify credentials worldwide.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
