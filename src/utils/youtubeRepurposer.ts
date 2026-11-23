import type { SocialPlatform } from '../types/marketplace';
import type { RepurposedCoursePackage, YouTubeRepurposingInput } from '../types/tutorial';

/**
 * Extracts the 11-character YouTube video ID from various standard YouTube URL formats.
 * Returns null if the URL is invalid, empty, or from an unsupported host.
 */
export function parseYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Regex matching standard watch, embed, shorts, and youtu.be shortlinks
  const match = trimmed.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );

  return match ? match[1] : null;
}

// Backward-compatible alias
export const extractYouTubeVideoId = parseYouTubeVideoId;

/**
 * Repurposes a YouTube video into a structured multi-module course curriculum,
 * detailed markdown lesson notes, and promotional marketing copy.
 */
export function repurposeYouTubeToCourse(input: YouTubeRepurposingInput): RepurposedCoursePackage {
  const videoId = parseYouTubeVideoId(input.youtubeUrl);
  if (!videoId) {
    throw new Error('Invalid YouTube URL. Please provide a valid watch, embed, or shorts link.');
  }

  const title = input.customTitle?.trim() || 'Mastering Autonomous AI Workflows';
  const price = input.targetPrice !== undefined ? Number(input.targetPrice) : 25000;
  const category = input.category?.trim() || 'AI & Machine Learning';
  const level = input.level || 'All Levels';
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;

  const modules = [
    {
      id: `mod-${videoId}-1`,
      title: 'Module 1: Core Architecture & Foundations',
      durationMinutes: 30,
      lectures: [
        {
          id: `lec-${videoId}-1`,
          title: 'Overview & High-Level Design',
          durationMinutes: 15,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          isPreview: true,
        },
        {
          id: `lec-${videoId}-2`,
          title: 'Environment & Tool Configuration',
          durationMinutes: 15,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          isPreview: false,
        },
      ],
    },
    {
      id: `mod-${videoId}-2`,
      title: 'Module 2: Practical Deployment & Hardening',
      durationMinutes: 45,
      lectures: [
        {
          id: `lec-${videoId}-3`,
          title: 'End-to-End Execution Walkthrough',
          durationMinutes: 25,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          isPreview: false,
        },
        {
          id: `lec-${videoId}-4`,
          title: 'Production Hardening & Verification',
          durationMinutes: 20,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          isPreview: false,
        },
      ],
    },
  ];

  const lessonNotes = `# Lesson Notes: ${title}

## Summary
Transforming raw video instructions into an actionable engineering blueprint.

## Key Concepts
- Autonomous Systems & Deterministic Feedback Loops
- Agent Tool Calling Contracts & Schema Conformance
- Offline Mock Testing & Rate-Limit Shielding
- Key-Value State Persistence & Dual-Layer Cache

## Recommended Practice
- Implement unit and integration tests for all external network endpoints.
- Configure rate limit shielding and prompt hashing to eliminate token waste.
- Review and verify all course deliverables prior to production deployment.
`;

  const marketingAssets = {
    facebookPost: `🚀 Turn video knowledge into real expertise! Announcing "${title}". Enroll now on Digital Wealth Creators.`,
    linkedInPost: `Excited to launch "${title}". In-depth curriculum designed for modern engineering teams. Link in comments.`,
    xPost: `Just dropped "${title}" on @DigitalWealthCreators! Check it out: ${input.youtubeUrl}`,
    youtubeMetadata: {
      seoTitle: `${title} | Full Course Tutorial`,
      description: `Comprehensive video tutorial and course notes for ${title}.`,
      tags: ['course', 'ai', 'education', 'tutorial'],
      timestamps: [
        '00:00 - Introduction',
        '15:00 - Architecture & Foundations',
        '30:00 - Hands-On Implementation',
      ],
    },
  };

  return {
    title,
    subtitle: 'Complete video-to-course transformation',
    description: `Structured curriculum derived from YouTube content (${videoId}).`,
    category,
    price,
    level,
    videoId,
    embedUrl,
    modules,
    lessonNotes,
    marketingAssets,
  };
}

/**
 * Generates tailored social media promotional copy for all supported platforms.
 */
export function generateYouTubeCourseSocialSnippets(
  course: RepurposedCoursePackage
): Record<SocialPlatform, string> {
  return {
    facebook: course.marketingAssets.facebookPost,
    linkedin: course.marketingAssets.linkedInPost,
    x: course.marketingAssets.xPost,
    instagram: `Learn ${course.title}! Full course and structured notes available now. #DigitalWealthCreators`,
    whatsapp_group: `*New Course Launch*: ${course.title}\nEnroll here: https://digitalwealthcreators.org.ng/product/${course.videoId}`,
    youtube: course.marketingAssets.youtubeMetadata.description,
  };
}
