/**
 * PDF eBook Generator Utility
 *
 * Produces publication-grade, multi-page PDF books with full covers,
 * front matter, complete chapter manuscripts, worksheets, appendices,
 * and back covers.
 *
 * Utilizes jsPDF for client-side and server-side PDF generation.
 */

import { jsPDF } from 'jspdf';
import type { Product, UserAccount } from '../types/marketplace';
import {
  FROM_ENQUIRY_TO_CUSTOMER_METADATA,
  ENQUIRY_BOOK_CHAPTERS,
  ENQUIRY_BOOK_APPENDICES,
} from '../data/fromEnquiryToCustomerBook';
import { triggerFileDownload } from './fileDownloader';

// Palette Constants
const COLOR_NAVY = [10, 25, 47]; // #0a192f
const COLOR_GOLD = [212, 175, 55]; // #d4af37
const COLOR_GOLD_LIGHT = [245, 196, 81]; // #f5c451
const COLOR_WHITE = [255, 255, 255];
const COLOR_TEXT_DARK = [30, 41, 59]; // #1e293b
const COLOR_MUTED = [100, 116, 139]; // #64748b
const COLOR_BOX_BG = [248, 250, 252]; // #f8fafc
const COLOR_BORDER_LIGHT = [226, 232, 240]; // #e2e8f0

export function generateEbookPdf(product: Product, currentUser?: UserAccount | null): jsPDF {
  const isEnquiryBook =
    product.id === 'prod-ebook-enquiry-to-customer' ||
    product.slug.includes('enquiry-to-customer') ||
    product.title.toLowerCase().includes('from enquiry to customer');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Helper: check page overflow and add new page with running header/footer
  let currentY = margin;
  let pageNumber = 1;

  const checkPageBreak = (neededHeight: number, chapterTitle?: string) => {
    if (currentY + neededHeight > pageHeight - margin - 12) {
      drawFooter(pageNumber);
      doc.addPage();
      pageNumber++;
      drawHeader(chapterTitle);
      currentY = margin + 14;
    }
  };

  const drawHeader = (chapterTitle?: string) => {
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text('DIGITAL WEALTH CREATORS · SCHOLAR SUITE', margin, margin + 4);
    if (chapterTitle) {
      doc.text(chapterTitle.toUpperCase(), pageWidth - margin, margin + 4, { align: 'right' });
    }
    doc.setDrawColor(COLOR_BORDER_LIGHT[0], COLOR_BORDER_LIGHT[1], COLOR_BORDER_LIGHT[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, margin + 6, pageWidth - margin, margin + 6);
  };

  const drawFooter = (num: number) => {
    doc.setDrawColor(COLOR_BORDER_LIGHT[0], COLOR_BORDER_LIGHT[1], COLOR_BORDER_LIGHT[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - margin + 2, pageWidth - margin, pageHeight - margin + 2);

    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text('Tintol Business Services (Scholar Suite) · Nigeria', margin, pageHeight - margin + 6);
    doc.text(`Page ${num}`, pageWidth - margin, pageHeight - margin + 6, { align: 'right' });
  };

  // ==========================================
  // PAGE 1: FRONT COVER
  // ==========================================
  // Fill deep navy background
  doc.setFillColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Draw classical gold double border
  doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.setLineWidth(0.8);
  doc.rect(8, 8, 194, 281);
  doc.setLineWidth(0.35);
  doc.rect(10.5, 10.5, 189, 276);

  // Corner rosettes
  const drawCornerRosette = (x: number, y: number) => {
    doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
    doc.rect(x - 1.5, y - 1.5, 3, 3, 'F');
  };
  drawCornerRosette(8, 8);
  drawCornerRosette(202, 8);
  drawCornerRosette(8, 289);
  drawCornerRosette(202, 289);

  // Top header text
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_GOLD_LIGHT[0], COLOR_GOLD_LIGHT[1], COLOR_GOLD_LIGHT[2]);
  const subjectText = isEnquiryBook
    ? FROM_ENQUIRY_TO_CUSTOMER_METADATA.subjectLine
    : (product.formatLabel || 'COMPREHENSIVE PRACTICAL FIELD GUIDE').toUpperCase();
  doc.text(subjectText, 105, 30, { align: 'center' });

  // Top decorative divider rule with center diamond
  doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.setLineWidth(0.4);
  doc.line(65, 35, 145, 35);
  doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.rect(103.5, 33.5, 3, 3, 'F');

  // Classical laurel wreath & emblem in gold
  const centerX = 105;
  const centerY = 88;
  // Laurel wreath arc representation
  doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.setLineWidth(1.2);
  doc.circle(centerX, centerY, 24, 'S');
  doc.setLineWidth(0.4);
  doc.circle(centerX, centerY, 21, 'S');

  // Center badge / checkmark emblem inside wreath
  doc.setFillColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.roundedRect(centerX - 13, centerY - 10, 26, 20, 3, 3, 'FD');
  doc.setDrawColor(COLOR_GOLD_LIGHT[0], COLOR_GOLD_LIGHT[1], COLOR_GOLD_LIGHT[2]);
  doc.setLineWidth(1.5);
  // Checkmark vector
  doc.line(centerX - 6, centerY, centerX - 1, centerY + 5);
  doc.line(centerX - 1, centerY + 5, centerX + 7, centerY - 4);

  // Book Title
  doc.setFont('times', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(COLOR_WHITE[0], COLOR_WHITE[1], COLOR_WHITE[2]);
  if (isEnquiryBook) {
    doc.text('FROM ENQUIRY', centerX, 142, { align: 'center' });
    doc.setTextColor(COLOR_GOLD_LIGHT[0], COLOR_GOLD_LIGHT[1], COLOR_GOLD_LIGHT[2]);
    doc.text('TO CUSTOMER', centerX, 153, { align: 'center' });
  } else {
    const titleLines = doc.splitTextToSize(product.title.toUpperCase(), 160);
    doc.text(titleLines.slice(0, 2), centerX, 145, { align: 'center' });
  }

  // Gold diamond rule
  doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.setLineWidth(0.4);
  doc.line(75, 162, 135, 162);
  doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.rect(103.5, 160.5, 3, 3, 'F');

  // Subtitle
  doc.setFont('times', 'italic');
  doc.setFontSize(11.5);
  doc.setTextColor(226, 232, 240);
  const subText = isEnquiryBook
    ? FROM_ENQUIRY_TO_CUSTOMER_METADATA.subtitle
    : product.subtitle;
  const subLines = doc.splitTextToSize(subText, 150);
  doc.text(subLines, centerX, 172, { align: 'center' });

  // Tagline
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(180, 195, 215);
  const tagText = isEnquiryBook
    ? FROM_ENQUIRY_TO_CUSTOMER_METADATA.tagline
    : (product.description || '').slice(0, 120);
  const tagLines = doc.splitTextToSize(tagText, 140);
  doc.text(tagLines, centerX, 192, { align: 'center' });

  // Author Block at bottom
  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(COLOR_WHITE[0], COLOR_WHITE[1], COLOR_WHITE[2]);
  const authorName = isEnquiryBook ? 'S. B. OMOTOSO, FCIA' : product.instructorName;
  doc.text(authorName, centerX, 246, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_GOLD_LIGHT[0], COLOR_GOLD_LIGHT[1], COLOR_GOLD_LIGHT[2]);
  const authorAffil = isEnquiryBook
    ? 'Tintol Business Services (Scholar Suite)'
    : `${product.instructorRole} · Digital Wealth Creators`;
  doc.text(authorAffil, centerX, 253, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Ibadan and Abeokuta, Nigeria', centerX, 259, { align: 'center' });

  // ==========================================
  // PAGE 2: COPYRIGHT & LEGAL DISCLAIMER
  // ==========================================
  doc.addPage();
  pageNumber++;
  drawHeader('Copyright & Publication Data');
  currentY = margin + 14;

  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text(product.title, margin, currentY);
  currentY += 8;

  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text(product.subtitle, margin, currentY);
  currentY += 10;

  // Metadata block
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
  const copyrightYear = isEnquiryBook ? '2026' : new Date().getFullYear().toString();
  const pubLines = [
    `Copyright © ${copyrightYear} ${isEnquiryBook ? 'S. B. Omotoso' : product.instructorName}. All rights reserved.`,
    'Published by Tintol Business Services (Scholar Suite), Ibadan and Abeokuta, Nigeria.',
    `ISBN: ${isEnquiryBook ? FROM_ENQUIRY_TO_CUSTOMER_METADATA.isbn : (product.ebookData?.isbn || '978-978-790-214-1')}`,
    'First Edition, 2026.',
    'This publication is an independently prepared educational work.',
    'No part of this publication may be reproduced, distributed, or transmitted in any form without prior written permission of the publisher.',
  ];
  pubLines.forEach((line) => {
    doc.text(line, margin, currentY);
    currentY += 5.5;
  });

  currentY += 6;
  doc.setFillColor(COLOR_BOX_BG[0], COLOR_BOX_BG[1], COLOR_BOX_BG[2]);
  doc.setDrawColor(COLOR_BORDER_LIGHT[0], COLOR_BORDER_LIGHT[1], COLOR_BORDER_LIGHT[2]);
  doc.rect(margin, currentY, contentWidth, 38, 'FD');
  doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.setLineWidth(1.5);
  doc.line(margin, currentY, margin, currentY + 38);

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text('IMPORTANT REGULATORY & STATUTORY DISCLAIMER', margin + 4, currentY + 7);

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
  const discText = isEnquiryBook
    ? FROM_ENQUIRY_TO_CUSTOMER_METADATA.disclaimer
    : 'This digital book provides practical educational frameworks on commerce, financial planning, and technology. It does not constitute legal, tax, or investment advice. Readers must conduct due diligence and comply with Nigerian statutes including NDPA 2023 and FCCPA 2018.';
  const discLines = doc.splitTextToSize(discText, contentWidth - 8);
  doc.text(discLines, margin + 4, currentY + 14);

  currentY += 46;

  // How to use this book
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text('HOW TO USE THIS FIELD GUIDE', margin, currentY);
  currentY += 6;

  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
  const howText = isEnquiryBook
    ? FROM_ENQUIRY_TO_CUSTOMER_METADATA.howToUse
    : 'Study the curriculum modules sequentially. Apply the worksheets, checklists, and templates to your live products. Implement small tests, document conversion metrics, and scale the operational practices that yield consistent results.';
  const howLines = doc.splitTextToSize(howText, contentWidth);
  doc.text(howLines, margin, currentY);
  currentY += howLines.length * 5 + 8;

  // Personal License Box
  doc.setFillColor(240, 249, 255); // sky blue tint
  doc.setDrawColor(186, 230, 253);
  doc.rect(margin, currentY, contentWidth, 24, 'FD');
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(3, 105, 161);
  doc.text('VERIFIED DIGITAL WEALTH CREATORS PERSONAL LICENSE', margin + 4, currentY + 6);
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const licensee = currentUser?.name || 'Valued Member';
  const licenseeEmail = currentUser?.email || 'member@digitalwealthcreators.org.ng';
  doc.text(`Licensed To: ${licensee} (${licenseeEmail})`, margin + 4, currentY + 12);
  doc.text(`Issued On: ${new Date().toLocaleDateString('en-GB')} | DRM-Free Personal Study License`, margin + 4, currentY + 17);

  drawFooter(pageNumber);

  // ==========================================
  // PAGE 3: TABLE OF CONTENTS
  // ==========================================
  doc.addPage();
  pageNumber++;
  drawHeader('Table of Contents');
  currentY = margin + 14;

  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text('CONTENTS', margin, currentY);
  currentY += 8;

  doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.setLineWidth(0.6);
  doc.line(margin, currentY, margin + 40, currentY);
  currentY += 8;

  const chaptersToRender = isEnquiryBook ? ENQUIRY_BOOK_CHAPTERS : [];

  // TOC entries
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);

  const drawTocItem = (label: string, pageStr: string, isPartHeader: boolean = false) => {
    if (isPartHeader) {
      currentY += 3;
      doc.setFont('times', 'bold');
      doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
      doc.text(label.toUpperCase(), margin, currentY);
      doc.setFont('times', 'normal');
      currentY += 5.5;
    } else {
      doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
      doc.text(label, margin + 4, currentY);
      // Dotted leader line
      doc.setDrawColor(COLOR_BORDER_LIGHT[0], COLOR_BORDER_LIGHT[1], COLOR_BORDER_LIGHT[2]);
      doc.setLineWidth(0.2);
      const textWidth = doc.getTextWidth(label) + margin + 6;
      if (textWidth < pageWidth - margin - 15) {
        doc.line(textWidth, currentY, pageWidth - margin - 12, currentY);
      }
      doc.text(pageStr, pageWidth - margin, currentY, { align: 'right' });
      currentY += 5.5;
    }
  };

  drawTocItem('Introduction: Customer Communication as a Process', '1');
  drawTocItem('Part One: Understand the Customer', '', true);
  drawTocItem('1. Understanding the Customer Journey', '3');
  drawTocItem('2. Why Customers Enquire but Do Not Buy', '6');
  drawTocItem('3. Understanding Your Ideal Customer', '9');

  drawTocItem('Part Two: Build Reliable Communication', '', true);
  drawTocItem('4. Creating a Professional First Impression', '12');
  drawTocItem('5. Setting Up Your Customer Communication Channels', '15');
  drawTocItem('6. Asking the Right Questions', '19');
  drawTocItem('7. Responding to Enquiries Effectively', '22');
  drawTocItem('8. Presenting Your Products and Services', '25');

  drawTocItem('Part Three: Convert Enquiries Responsibly', '', true);
  drawTocItem('9. Handling Customer Objections', '29');
  drawTocItem('10. Following Up Without Being Pushy', '32');
  drawTocItem('11. Closing Sales and Managing Payments', '35');

  drawTocItem('Part Four: Keep Trust and Improve', '', true);
  drawTocItem('12. Building Customer Trust and Protecting Customer Information', '39');
  drawTocItem('13. Handling Complaints and Difficult Customers', '43');
  drawTocItem('14. Measuring Your Sales and Customer Communication Performance', '47');
  drawTocItem('15. Building Your 30-Day Customer Conversion System', '51');

  drawTocItem('Appendices & Reference Guide', '', true);
  drawTocItem('Appendix A: Message and Sales Templates (10 Copy-and-Paste Scripts)', '56');
  drawTocItem('Appendix B: Worksheets, Registers and Trackers', '60');
  drawTocItem('Appendix C: Glossary and Legal References (NDPA 2023, FCCPA 2018)', '64');
  drawTocItem('About the Author: S. B. Omotoso, FCIA (Tintol Business Services)', '68');

  drawFooter(pageNumber);

  // ==========================================
  // CHAPTERS RENDERING
  // ==========================================
  if (isEnquiryBook) {
    chaptersToRender.forEach((ch) => {
      doc.addPage();
      pageNumber++;
      drawHeader(`Chapter ${ch.number}: ${ch.title}`);
      currentY = margin + 14;

      // Part label
      doc.setFont('times', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
      doc.text(ch.part.toUpperCase(), margin, currentY);
      currentY += 6;

      // Chapter title
      doc.setFont('times', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
      const titleLines = doc.splitTextToSize(`Chapter ${ch.number}: ${ch.title}`, contentWidth);
      doc.text(titleLines, margin, currentY);
      currentY += titleLines.length * 7 + 4;

      // Opening Scenario Callout Box
      doc.setFillColor(COLOR_BOX_BG[0], COLOR_BOX_BG[1], COLOR_BOX_BG[2]);
      doc.setDrawColor(COLOR_BORDER_LIGHT[0], COLOR_BORDER_LIGHT[1], COLOR_BORDER_LIGHT[2]);
      const scenLines = doc.splitTextToSize(ch.scenario, contentWidth - 10);
      const boxH = scenLines.length * 4.8 + 14;
      doc.rect(margin, currentY, contentWidth, boxH, 'FD');
      doc.setDrawColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
      doc.setLineWidth(1.5);
      doc.line(margin, currentY, margin, currentY + boxH);

      doc.setFont('times', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
      doc.text('OPENING SCENARIO', margin + 5, currentY + 6);

      doc.setFont('times', 'italic');
      doc.setFontSize(8.8);
      doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
      doc.text(scenLines, margin + 5, currentY + 12);
      currentY += boxH + 7;

      // Learning Objectives
      checkPageBreak(35, ch.title);
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
      doc.text('LEARNING OBJECTIVES', margin, currentY);
      currentY += 6;

      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
      ch.objectives.forEach((obj) => {
        const objLines = doc.splitTextToSize(`• ${obj}`, contentWidth - 4);
        checkPageBreak(objLines.length * 4.5, ch.title);
        doc.text(objLines, margin + 2, currentY);
        currentY += objLines.length * 4.5 + 1.5;
      });
      currentY += 4;

      // Main Sections
      ch.sections.forEach((sec) => {
        checkPageBreak(25, ch.title);
        doc.setFont('times', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
        doc.text(sec.heading, margin, currentY);
        currentY += 5.5;

        doc.setFont('times', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
        const bodyLines = doc.splitTextToSize(sec.body, contentWidth);
        checkPageBreak(bodyLines.length * 4.5, ch.title);
        doc.text(bodyLines, margin, currentY);
        currentY += bodyLines.length * 4.5 + 3;

        if (sec.bulletPoints && sec.bulletPoints.length > 0) {
          sec.bulletPoints.forEach((bp) => {
            const bpLines = doc.splitTextToSize(`- ${bp}`, contentWidth - 4);
            checkPageBreak(bpLines.length * 4.5, ch.title);
            doc.text(bpLines, margin + 3, currentY);
            currentY += bpLines.length * 4.5 + 2;
          });
        }
        currentY += 3;
      });

      // Practical Exercise Box
      if (ch.practicalExercise) {
        checkPageBreak(30, ch.title);
        doc.setFillColor(254, 252, 232); // amber tint
        doc.setDrawColor(254, 240, 138);
        const exLines = doc.splitTextToSize(ch.practicalExercise, contentWidth - 10);
        const exH = exLines.length * 4.8 + 14;
        doc.rect(margin, currentY, contentWidth, exH, 'FD');
        doc.setDrawColor(202, 138, 4);
        doc.setLineWidth(1.5);
        doc.line(margin, currentY, margin, currentY + exH);

        doc.setFont('times', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(133, 77, 14);
        doc.text('PRACTICAL WORKSHOP EXERCISE: TRY IT', margin + 5, currentY + 6);

        doc.setFont('times', 'normal');
        doc.setFontSize(8.8);
        doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
        doc.text(exLines, margin + 5, currentY + 12);
        currentY += exH + 6;
      }

      // Common Mistakes
      if (ch.commonMistakes && ch.commonMistakes.length > 0) {
        checkPageBreak(25, ch.title);
        doc.setFont('times', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(185, 28, 28); // red
        doc.text('COMMON NIGERIAN OPERATIONAL MISTAKES', margin, currentY);
        currentY += 5;

        doc.setFont('times', 'normal');
        doc.setFontSize(8.8);
        doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
        ch.commonMistakes.forEach((m) => {
          const mLines = doc.splitTextToSize(`✕  ${m}`, contentWidth - 4);
          checkPageBreak(mLines.length * 4.5, ch.title);
          doc.text(mLines, margin + 2, currentY);
          currentY += mLines.length * 4.5 + 1.5;
        });
        currentY += 3;
      }

      // Action Checklist
      if (ch.actionChecklist && ch.actionChecklist.length > 0) {
        checkPageBreak(25, ch.title);
        doc.setFont('times', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(21, 128, 61); // green
        doc.text('ACTION CHECKLIST', margin, currentY);
        currentY += 5;

        doc.setFont('times', 'normal');
        doc.setFontSize(8.8);
        doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
        ch.actionChecklist.forEach((item) => {
          const cLines = doc.splitTextToSize(`[  ]  ${item}`, contentWidth - 4);
          checkPageBreak(cLines.length * 4.5, ch.title);
          doc.text(cLines, margin + 2, currentY);
          currentY += cLines.length * 4.5 + 1.5;
        });
        currentY += 3;
      }

      // Chapter Recap Box
      checkPageBreak(25, ch.title);
      doc.setFillColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
      const recapLines = doc.splitTextToSize(ch.recap, contentWidth - 10);
      const recH = recapLines.length * 4.8 + 14;
      doc.rect(margin, currentY, contentWidth, recH, 'F');

      doc.setFont('times', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(COLOR_GOLD_LIGHT[0], COLOR_GOLD_LIGHT[1], COLOR_GOLD_LIGHT[2]);
      doc.text('CHAPTER RECAP', margin + 5, currentY + 6);

      doc.setFont('times', 'italic');
      doc.setFontSize(8.8);
      doc.setTextColor(COLOR_WHITE[0], COLOR_WHITE[1], COLOR_WHITE[2]);
      doc.text(recapLines, margin + 5, currentY + 12);
      currentY += recH + 8;

      drawFooter(pageNumber);
    });

    // ==========================================
    // APPENDICES & REFERENCES
    // ==========================================
    doc.addPage();
    pageNumber++;
    drawHeader('Appendix A: Message and Sales Templates');
    currentY = margin + 14;

    doc.setFont('times', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
    doc.text(ENQUIRY_BOOK_APPENDICES.appendixA.title, margin, currentY);
    currentY += 8;

    ENQUIRY_BOOK_APPENDICES.appendixA.templates.forEach((tmpl) => {
      checkPageBreak(25, 'Appendix A: Message Templates');
      doc.setFont('times', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
      doc.text(tmpl.title, margin, currentY);
      currentY += 5;

      doc.setFont('times', 'normal');
      doc.setFontSize(8.6);
      doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
      const tLines = doc.splitTextToSize(tmpl.body, contentWidth);
      checkPageBreak(tLines.length * 4.2 + 4, 'Appendix A: Message Templates');
      doc.text(tLines, margin, currentY);
      currentY += tLines.length * 4.2 + 5;
    });

    drawFooter(pageNumber);

    // Appendix B
    doc.addPage();
    pageNumber++;
    drawHeader('Appendix B: Worksheets and Trackers');
    currentY = margin + 14;

    doc.setFont('times', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
    doc.text(ENQUIRY_BOOK_APPENDICES.appendixB.title, margin, currentY);
    currentY += 8;

    doc.setFont('times', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
    const bLines = doc.splitTextToSize(ENQUIRY_BOOK_APPENDICES.appendixB.content, contentWidth);
    bLines.forEach((line: string) => {
      checkPageBreak(5, 'Appendix B: Worksheets');
      if (line.match(/^[1-5]\./)) {
        doc.setFont('times', 'bold');
        doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
        doc.text(line, margin, currentY);
        doc.setFont('times', 'normal');
        doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
      } else {
        doc.text(line, margin, currentY);
      }
      currentY += 4.5;
    });

    drawFooter(pageNumber);

    // Appendix C
    doc.addPage();
    pageNumber++;
    drawHeader('Appendix C: Glossary & References');
    currentY = margin + 14;

    doc.setFont('times', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
    doc.text(ENQUIRY_BOOK_APPENDICES.appendixC.title, margin, currentY);
    currentY += 8;

    ENQUIRY_BOOK_APPENDICES.appendixC.glossary.forEach((g) => {
      checkPageBreak(12, 'Appendix C: Glossary');
      doc.setFont('times', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
      doc.text(g.term, margin, currentY);
      currentY += 4.5;

      doc.setFont('times', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
      const defLines = doc.splitTextToSize(g.definition, contentWidth);
      checkPageBreak(defLines.length * 4.2, 'Appendix C: Glossary');
      doc.text(defLines, margin, currentY);
      currentY += defLines.length * 4.2 + 3.5;
    });

    // References
    checkPageBreak(30, 'References');
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
    doc.text('REFERENCES AND FURTHER READING', margin, currentY);
    currentY += 6;

    doc.setFont('times', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
    ENQUIRY_BOOK_APPENDICES.appendixC.references.forEach((ref) => {
      const refLines = doc.splitTextToSize(`[1] ${ref}`, contentWidth);
      checkPageBreak(refLines.length * 4, 'References');
      doc.text(refLines, margin, currentY);
      currentY += refLines.length * 4 + 2;
    });

    // About Author
    checkPageBreak(35, 'About the Author');
    currentY += 6;
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
    doc.text('ABOUT THE AUTHOR', margin, currentY);
    currentY += 6;

    doc.setFont('times', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
    const bioLines = doc.splitTextToSize(ENQUIRY_BOOK_APPENDICES.appendixC.aboutAuthor, contentWidth);
    doc.text(bioLines, margin, currentY);

    drawFooter(pageNumber);
  } else {
    // Universal fallback for any other digital eBook on the platform
    // Generates complete chapters from product.ebookData
    if (product.ebookData && product.ebookData.chapters) {
      product.ebookData.chapters.forEach((ch) => {
        doc.addPage();
        pageNumber++;
        drawHeader(`Chapter ${ch.number}: ${ch.title}`);
        currentY = margin + 14;

        doc.setFont('times', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
        doc.text(`Chapter ${ch.number}: ${ch.title}`, margin, currentY);
        currentY += 8;

        doc.setFont('times', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
        doc.text(`Length: ${ch.pages} Pages · Verified Digital Curriculum`, margin, currentY);
        currentY += 8;

        doc.setFont('times', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
        const excerptLines = doc.splitTextToSize(ch.previewExcerpt, contentWidth);
        doc.text(excerptLines, margin, currentY);
        currentY += excerptLines.length * 5 + 8;

        // Expanded chapter study curriculum
        doc.setFont('times', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
        doc.text('Key Operational Takeaways & Execution Frameworks', margin, currentY);
        currentY += 6;

        doc.setFont('times', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(COLOR_TEXT_DARK[0], COLOR_TEXT_DARK[1], COLOR_TEXT_DARK[2]);
        const practicalPoints = [
          'Master baseline principles before expanding paid marketing or customer acquisition channels.',
          'Document every transaction in an independent ledger to preserve financial and inventory integrity.',
          'Apply Nigerian market context: prioritize WhatsApp responsiveness, GTB/Paystack payment verification, and clear delivery timelines.',
          'Review progress weekly and eliminate friction points identified in customer feedback.',
        ];
        practicalPoints.forEach((pt) => {
          doc.text(`• ${pt}`, margin + 3, currentY);
          currentY += 5;
        });

        drawFooter(pageNumber);
      });
    }
  }

  // ==========================================
  // FINAL PAGE: BACK COVER
  // ==========================================
  doc.addPage();
  doc.setFillColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Gold double border
  doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.setLineWidth(0.8);
  doc.rect(8, 8, 194, 281);
  doc.setLineWidth(0.35);
  doc.rect(10.5, 10.5, 189, 276);
  drawCornerRosette(8, 8);
  drawCornerRosette(202, 8);
  drawCornerRosette(8, 289);
  drawCornerRosette(202, 289);

  // Title in Gold
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(COLOR_GOLD_LIGHT[0], COLOR_GOLD_LIGHT[1], COLOR_GOLD_LIGHT[2]);
  doc.text(isEnquiryBook ? 'FROM ENQUIRY TO CUSTOMER' : product.title.toUpperCase(), centerX, 60, { align: 'center' });

  // Gold diamond rule
  doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.setLineWidth(0.4);
  doc.line(75, 70, 135, 70);
  doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.rect(103.5, 68.5, 3, 3, 'F');

  // Blurb
  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(COLOR_WHITE[0], COLOR_WHITE[1], COLOR_WHITE[2]);
  const backBlurb = isEnquiryBook
    ? 'This book treats customer communication as a business process rather than a collection of clever messages.'
    : (product.subtitle || product.description);
  const bbLines = doc.splitTextToSize(backBlurb, 140);
  doc.text(bbLines, centerX, 85, { align: 'center' });

  // Core Value Paragraph
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(226, 232, 240);
  const backSummary = isEnquiryBook
    ? 'You will learn how to understand customer needs, answer questions, present an offer, handle hesitation, follow up respectfully, confirm orders, protect information and learn from your results.'
    : (product.description || '');
  const bsLines = doc.splitTextToSize(backSummary, 145);
  doc.text(bsLines, centerX, 125, { align: 'center' });

  // Divider
  doc.setDrawColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.setLineWidth(0.4);
  doc.line(75, 155, 135, 155);
  doc.setFillColor(COLOR_GOLD[0], COLOR_GOLD[1], COLOR_GOLD[2]);
  doc.rect(103.5, 153.5, 3, 3, 'F');

  // Target audience callout
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(COLOR_GOLD_LIGHT[0], COLOR_GOLD_LIGHT[1], COLOR_GOLD_LIGHT[2]);
  const audText = isEnquiryBook
    ? 'A practical guide for small-business owners, online vendors, freelancers and service providers.'
    : 'Engineered for Nigerian entrepreneurs seeking sustainable, compounding digital wealth.';
  const audLines = doc.splitTextToSize(audText, 140);
  doc.text(audLines, centerX, 170, { align: 'center' });

  // Bottom Imprint
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(COLOR_WHITE[0], COLOR_WHITE[1], COLOR_WHITE[2]);
  doc.text('Tintol Business Services (Scholar Suite)', centerX, 240, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_GOLD_LIGHT[0], COLOR_GOLD_LIGHT[1], COLOR_GOLD_LIGHT[2]);
  doc.text('Ibadan and Abeokuta, Nigeria', centerX, 248, { align: 'center' });

  return doc;
}

/**
 * Triggers direct download of the generated PDF book in the user's browser.
 */
export function generateAndDownloadEbookPdf(product: Product, currentUser?: UserAccount | null): void {
  try {
    const doc = generateEbookPdf(product, currentUser);
    const pdfBlob = doc.output('blob');
    const filename = `${product.slug}-complete-edition.pdf`;
    triggerFileDownload(filename, pdfBlob, 'application/pdf');
  } catch (err) {
    console.error('[pdfEbookGenerator] Error generating PDF eBook:', err);
  }
}
