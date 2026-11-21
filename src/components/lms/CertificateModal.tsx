import React, { useEffect, useId, useMemo } from 'react';
import { Award, CheckCircle2, Download, ExternalLink, Printer, ShieldCheck, Sparkles, X } from 'lucide-react';
import {
  ISSUER_NAME,
  ISSUING_AUTHORITY,
  generateQrCodeDataUri,
  generateVerificationUrl,
} from '../../utils/certificateUtils';
import { useStore } from '../../context/StoreContext';

export interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificateCode: string;
  studentName?: string;
  courseTitle?: string;
  completionDate?: string;
  instructorName?: string;
  track?: string;
  onVerifyOnline?: (code: string) => void;
}

export function CertificateModal({
  isOpen,
  onClose,
  certificateCode,
  studentName = 'Distinguished Scholar',
  courseTitle = 'Professional Course Curriculum',
  completionDate,
  instructorName = 'S. B. OMOTOSO & Senior Faculty',
  track = 'Executive Technology Mastery',
  onVerifyOnline,
}: CertificateModalProps) {
  const { navigate, showToast } = useStore();
  const titleId = useId();

  const formattedDate = useMemo(() => {
    if (completionDate) return completionDate;
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [completionDate]);

  const verifyUrl = useMemo(() => {
    return generateVerificationUrl(certificateCode);
  }, [certificateCode]);

  const qrDataUri = useMemo(() => {
    return generateQrCodeDataUri(verifyUrl, {
      size: 160,
      fgColor: '#0a192f',
      bgColor: '#ffffff',
      margin: 2,
    });
  }, [verifyUrl]);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleVerifyOnline = () => {
    if (onVerifyOnline) {
      onVerifyOnline(certificateCode);
    } else {
      navigate(`/verify-certificate?id=${encodeURIComponent(certificateCode)}`);
    }
    onClose();
  };

  const handlePrintCertificate = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Certificate of Completion - ${studentName} - ${courseTitle}</title>
  <style>
    @page { size: landscape; margin: 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #ffffff;
      color: #0a192f;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 16px;
    }
    .cert-frame {
      width: 100%;
      max-width: 960px;
      padding: 36px 44px;
      border: 8px solid #0a192f;
      outline: 4px solid #d4af37;
      outline-offset: -14px;
      background: #fafaf9;
      position: relative;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    .header-seal {
      display: inline-block;
      margin-bottom: 8px;
    }
    .issuer-title {
      font-size: 13px;
      letter-spacing: 3px;
      text-transform: uppercase;
      font-weight: 800;
      color: #d4af37;
    }
    .main-heading {
      font-size: 26px;
      font-weight: 900;
      color: #0a192f;
      letter-spacing: 1px;
      margin-top: 6px;
      text-transform: uppercase;
    }
    .certifies-text {
      font-size: 13px;
      color: #555;
      margin-top: 18px;
      font-style: italic;
    }
    .student-name {
      font-size: 32px;
      font-weight: 800;
      color: #0a192f;
      border-bottom: 2px solid #d4af37;
      display: inline-block;
      padding: 4px 32px;
      margin: 10px 0 14px;
    }
    .fulfillment-text {
      font-size: 13px;
      color: #444;
      max-width: 650px;
      margin: 0 auto 12px;
      line-height: 1.5;
    }
    .course-title {
      font-size: 20px;
      font-weight: 800;
      color: #0a192f;
      margin-bottom: 22px;
    }
    .footer-grid {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px dashed #d4af37;
    }
    .authority-box {
      text-align: left;
    }
    .sign-line {
      font-weight: 800;
      font-size: 14px;
      color: #0a192f;
    }
    .sign-role {
      font-size: 11px;
      color: #666;
    }
    .qr-box {
      text-align: center;
    }
    .qr-box img {
      width: 90px;
      height: 90px;
      border: 1px solid #d4af37;
      padding: 4px;
      background: #fff;
    }
    .cert-id-tag {
      font-family: monospace;
      font-size: 11px;
      font-weight: 700;
      color: #0a192f;
      margin-top: 4px;
    }
    .meta-box {
      text-align: right;
      font-size: 11px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="cert-frame">
    <div class="issuer-title">${ISSUER_NAME}</div>
    <h1 class="main-heading">Executive Certificate of Completion</h1>
    <p class="certifies-text">This is proudly and formally conferred to certify that</p>
    <div class="student-name">${studentName}</div>
    <p class="fulfillment-text">
      has rigorously demonstrated practical competence, fulfilled all curriculum milestones,
      and mastered comprehensive modules of
    </p>
    <div class="course-title">${courseTitle}</div>
    
    <div class="footer-grid">
      <div class="authority-box">
        <div class="sign-line">${ISSUING_AUTHORITY}</div>
        <div class="sign-role">Lead Executive Chancellor & Founder</div>
        <div class="sign-role">CourseMart Global Learning Academy</div>
      </div>
      <div class="qr-box">
        <img src="${qrDataUri}" alt="Verification QR Code" />
        <div class="cert-id-tag">${certificateCode}</div>
      </div>
      <div class="meta-box">
        <div><strong>Date of Conformance:</strong> ${formattedDate}</div>
        <div><strong>Specialization Track:</strong> ${track}</div>
        <div><strong>Credential Status:</strong> Authenticated</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;

    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      window.print();
    }
    showToast('Certificate print dialog opened');
  };

  const handleDownloadHtml = () => {
    const certHtml = `<!doctype html><html><head><meta charset="utf-8"/><title>Certificate - ${studentName}</title><style>body{font-family:sans-serif;background:#fafaf9;padding:40px;color:#0a192f;text-align:center;}.box{max-width:800px;margin:auto;padding:40px;border:8px solid #0a192f;outline:3px solid #d4af37;outline-offset:-12px;background:#fff;}</style></head><body><div class="box"><h4 style="color:#d4af37;letter-spacing:2px;margin:0;">${ISSUER_NAME}</h4><h1 style="margin:12px 0;">VERIFIED CERTIFICATE OF COMPLETION</h1><p>Conferred upon</p><h2 style="font-size:32px;color:#0a192f;border-bottom:2px solid #d4af37;display:inline-block;padding:0 24px;">${studentName}</h2><p>For mastering</p><h3>${courseTitle}</h3><p><strong>Certificate ID:</strong> ${certificateCode}</p><p><strong>Issued:</strong> ${formattedDate}</p><p><strong>Authority:</strong> ${ISSUING_AUTHORITY}</p></div></body></html>`;
    const blob = new Blob([certHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CourseMart-Certificate-${certificateCode}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Certificate file downloaded');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="relative w-full max-w-2xl bg-[#0a192f] text-white rounded-2xl shadow-2xl border-4 border-[#d4af37] ring-4 ring-[#0a192f] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close certificate modal"
          className="absolute right-4 top-4 p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Inner Frame with Double Border */}
        <div className="p-6 sm:p-10 border-2 border-[#d4af37]/40 m-2 sm:m-3 rounded-xl bg-gradient-to-b from-[#0a192f] via-[#0d203d] to-[#071324] relative">
          {/* Subtle Background Watermark Shield */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <Award className="w-96 h-96 text-[#d4af37]" />
          </div>

          {/* Certificate Header */}
          <div className="text-center space-y-2 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#f5c451] text-xs font-bold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{ISSUER_NAME}</span>
            </div>
            <h2
              id={titleId}
              className="font-display text-xl sm:text-2xl font-black text-white tracking-wide uppercase pt-1"
            >
              Executive Certificate of Completion
            </h2>
            <p className="text-xs text-slate-300 italic">
              This credential certifies that
            </p>
          </div>

          {/* Student Recipient Name */}
          <div className="text-center my-4 relative">
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#f5c451] tracking-wide border-b-2 border-[#d4af37]/60 inline-block px-4 pb-1">
              {studentName}
            </h3>
          </div>

          {/* Course Details */}
          <div className="text-center space-y-1.5 text-xs sm:text-sm text-slate-200 relative max-w-lg mx-auto">
            <p className="text-slate-300">
              has successfully completed all lectures, curriculum modules, and interactive assessments for:
            </p>
            <p className="font-display text-base sm:text-lg font-bold text-white">
              {courseTitle}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
              <span>Track: <strong className="text-slate-200">{track}</strong></span>
              <span>•</span>
              <span>Instructor: <strong className="text-slate-200">{instructorName}</strong></span>
            </div>
          </div>

          {/* Security & Verification Card */}
          <div className="mt-6 p-4 rounded-xl bg-[#081528]/90 border border-[#d4af37]/40 flex flex-col sm:flex-row items-center justify-between gap-4 relative">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Digitally Authenticated Credential</span>
              </div>
              <div className="font-mono text-xs sm:text-sm font-bold text-[#f5c451] tracking-wider">
                ID: {certificateCode}
              </div>
              <p className="text-[11px] text-slate-400">
                Issued by {ISSUING_AUTHORITY}
              </p>
              <p className="text-[11px] text-slate-400">
                Date: {formattedDate}
              </p>
            </div>

            {/* Embedded QR Code */}
            <div className="flex flex-col items-center shrink-0">
              <div className="p-1.5 bg-white rounded-lg shadow-md border-2 border-[#d4af37]">
                <img
                  src={qrDataUri}
                  alt={`Verification QR Code for ${certificateCode}`}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                />
              </div>
              <span className="text-[10px] text-slate-300 font-medium mt-1">
                Scan to Verify Authenticity
              </span>
            </div>
          </div>

          {/* Endorsement & Signatures */}
          <div className="mt-5 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
            <div>
              <p className="font-bold text-white">{ISSUING_AUTHORITY}</p>
              <p className="text-[10px] text-slate-400">Founder & Chancellor, Digital Wealth Creators</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1 text-[#d4af37] font-semibold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Online</span>
              </div>
              <p className="text-[10px] text-slate-400">coursemart.ng</p>
            </div>
          </div>
        </div>

        {/* 1-Click Action Footer */}
        <div className="bg-[#071324] px-6 py-4 border-t border-[#d4af37]/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintCertificate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#d4af37] text-[#0a192f] rounded-lg text-xs font-bold hover:bg-[#e5bf45] transition cursor-pointer shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={handleVerifyOnline}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#132b4f] text-[#f5c451] border border-[#d4af37]/40 rounded-lg text-xs font-bold hover:bg-[#1a3a6b] transition cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Verify Authenticity Online</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
              title="Download standalone HTML certificate"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download HTML</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
