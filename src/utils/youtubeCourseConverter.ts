import type { Product, CourseModule } from '../types/marketplace';

export interface YouTubeCourseConversionInput {
  youtubeUrl: string;
  targetPrice?: number;
  category?: string;
  level?: 'All Levels' | 'Beginner' | 'Intermediate' | 'Advanced';
  customTitle?: string;
}

export interface ConvertedYouTubeCourse {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  price: number;
  originalPrice: number;
  level: string;
  videoId: string;
  embedUrl: string;
  modules: CourseModule[];
  marketingAssets: {
    facebookPost: string;
    linkedInPost: string;
    youtubeMetadata: {
      seoTitle: string;
      description: string;
      tags: string[];
      timestamps: string[];
    };
  };
}

export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const match = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  return match ? match[1] : null;
}

/**
 * Transforms any YouTube video URL into a comprehensive structured course
 * with modules, timestamps, embedded player, and ready-to-post social marketing copy.
 */
export function convertYouTubeUrlToCourse(
  input: YouTubeCourseConversionInput
): ConvertedYouTubeCourse {
  const videoId = extractYouTubeVideoId(input.youtubeUrl);
  if (!videoId) {
    throw new Error('Invalid YouTube URL. Please provide a valid watch, embed, or shorts link.');
  }

  const rawTitle = input.customTitle?.trim() || 'Mastering Modern Autonomous AI Architecture';
  const price = input.targetPrice !== undefined ? Math.max(0, input.targetPrice) : 25000;
  const originalPrice = price === 0 ? 0 : Math.round(price * 1.6);
  const category = input.category?.trim() || 'AI & Machine Learning';
  const level = input.level || 'All Levels';
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

  const modules: CourseModule[] = [
    {
      id: `mod-${videoId}-1`,
      title: 'Module 1: Foundations & High-Level Architecture',
      durationMinutes: 25,
      lectures: [
        {
          id: `lec-${videoId}-1`,
          title: 'Core Principles & Paradigm Shift',
          durationMinutes: 12,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          isPreview: true,
          description: 'Introduction to foundational concepts, architectural patterns, and practical prerequisites.',
        },
        {
          id: `lec-${videoId}-2`,
          title: 'Setting Up Your Execution Environment',
          durationMinutes: 13,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          isPreview: false,
          description: 'Step-by-step setup of tooling, dependencies, environment variables, and local verification scripts.',
        },
      ],
    },
    {
      id: `mod-${videoId}-2`,
      title: 'Module 2: Hands-On Implementation & Live Walkthrough',
      durationMinutes: 45,
      lectures: [
        {
          id: `lec-${videoId}-3`,
          title: 'Deep Dive: Core Components & Workflows',
          durationMinutes: 22,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          isPreview: false,
          description: 'Line-by-line breakdown of core functionality, error boundaries, and state management.',
        },
        {
          id: `lec-${videoId}-4`,
          title: 'Edge Case Handling & Production Hardening',
          durationMinutes: 23,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          isPreview: false,
          description: 'Handling rate limits, graceful fallbacks, offline resilience, and automated verification.',
        },
      ],
    },
    {
      id: `mod-${videoId}-3`,
      title: 'Module 3: Commercial Monetization & Scale',
      durationMinutes: 30,
      lectures: [
        {
          id: `lec-${videoId}-5`,
          title: 'Monetizing Intellectual Property & Deployment',
          durationMinutes: 18,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          isPreview: false,
          description: 'Deploying to live production, setting up payment settlement, and packaging digital assets.',
        },
        {
          id: `lec-${videoId}-6`,
          title: 'Capstone Project & Verified Certificate',
          durationMinutes: 12,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          isPreview: false,
          description: 'Final project review, submitting completion proof, and claiming your CM-CERT certificate.',
        },
      ],
    },
  ];

  const facebookPost = [
    `🚀 NEW MASTERCLASS RELEASE: ${rawTitle}`,
    '',
    `Are you ready to level up your career with practical, battle-tested execution?`,
    '',
    `We just released a complete course covering:`,
    `✅ Foundational Architecture & Setup`,
    `✅ Production Hardening & Error Handling`,
    `✅ Direct Monetization & Scalable Deployment`,
    '',
    `🎓 Enrolled students receive full lecture access, downloadable resources, and a verified Certificate of Completion upon graduation.`,
    '',
    `👉 Join the cohort now: https://digitalwealthcreators.org.ng/courses`,
    `#DigitalWealthCreators #ExecutiveLearning #TechSkills #Innovation`,
  ].join('\n');

  const linkedInPost = [
    `Mastering ${rawTitle}: An Executive Architectural Guide`,
    '',
    `Most tech leaders spend months studying abstract theory, but true leverage comes from shipping production-grade systems rapidly.`,
    '',
    `In this newly published digital masterclass on Digital Wealth Creators:`,
    `1. We break down the end-to-end implementation architecture step-by-step.`,
    `2. We examine zero-cost open-source tools that eliminate costly third-party subscriptions.`,
    `3. We provide a downloadable action blueprint and verified certificate verification.`,
    '',
    `Explore the full curriculum and enroll today: https://digitalwealthcreators.org.ng/courses`,
    '',
    `#Leadership #TechnologyStrategy #SoftwareEngineering #DigitalWealthCreators`,
  ].join('\n');

  const youtubeMetadata = {
    seoTitle: `${rawTitle} | Full Step-by-Step Masterclass 2026`,
    description: [
      `Welcome to this comprehensive tutorial and masterclass on ${rawTitle}.`,
      '',
      `Timestamps:`,
      `00:00 - Introduction & Strategic Overview`,
      `04:15 - Architecture & Prerequisites`,
      `12:30 - Live Implementation & Code Walkthrough`,
      `28:45 - Production Hardening & Optimization`,
      `41:10 - Deployment & Direct Monetization`,
      '',
      `🔗 Enroll in the full certified course with downloadable templates:`,
      `https://digitalwealthcreators.org.ng/courses`,
      '',
      `📌 Official Community & Support Desk:`,
      `Telegram: https://t.me/digitalwealthcreators`,
      `WhatsApp Support: +234 803 471 0699`,
    ].join('\n'),
    tags: [
      'Digital Wealth Creators',
      'Full Course',
      'Tutorial 2026',
      'AI Architecture',
      'Software Monetization',
      'Tech Skills',
    ],
    timestamps: [
      '00:00 - Overview',
      '04:15 - Setup',
      '12:30 - Implementation',
      '28:45 - Production',
      '41:10 - Monetization',
    ],
  };

  return {
    title: rawTitle,
    subtitle: `Complete step-by-step curriculum with hands-on labs, downloadable resources, and verified certificate.`,
    description: `A masterclass derived from expert video training, structured into actionable modules covering foundational architecture, production execution, and direct commercial monetization.`,
    category,
    price,
    originalPrice,
    level,
    videoId,
    embedUrl,
    modules,
    marketingAssets: {
      facebookPost,
      linkedInPost,
      youtubeMetadata,
    },
  };
}
