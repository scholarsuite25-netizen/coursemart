export type TutorialStatus = 'draft' | 'published' | 'scheduled' | 'archived';

export interface TutorialStep {
  id?: string;
  stepNumber: number;
  title: string;
  description: string;
  content?: string;
  codeSnippet?: string;
  codeLanguage?: string;
  calloutType?: 'info' | 'tip' | 'warning' | 'danger';
  calloutNote?: string;
  checklist?: string[];
  durationMinutes?: number;
  imageUrl?: string;
  imageCaption?: string;
  videoTimestampSeconds?: number;
}

export interface DocumentTutorial {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  category?: string;
  authorId?: string;
  authorName: string;
  authorRole?: string;
  authorAvatar?: string;
  coverImage?: string;
  difficulty?:
    | 'beginner'
    | 'intermediate'
    | 'advanced'
    | 'Beginner'
    | 'Intermediate'
    | 'Advanced'
    | 'All Levels';
  readTimeMinutes?: number;
  estimatedMinutes?: number;
  steps: TutorialStep[];
  tags: string[];
  status: TutorialStatus;
  featured?: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface VideoScene {
  sceneIndex: number;
  sceneNumber?: number;
  title: string;
  layout: 'title-card' | 'split-code' | 'step-focus' | 'code-walkthrough' | 'summary';
  visualHeadline: string;
  narrationScript: string;
  durationSeconds: number;
  startSeconds: number;
  codeSnippet?: string;
  calloutNote?: string;
}

export interface VideoNarratorConfig {
  width: number;
  height: number;
  fps: number;
  audioChannels: number;
  mimeType: string;
}

export interface YouTubeRepurposingInput {
  youtubeUrl: string;
  customTitle?: string;
  targetPrice?: number;
  category?: string;
  level?: 'All Levels' | 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface RepurposedCoursePackage {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  price: number;
  level: string;
  videoId: string;
  embedUrl: string;
  modules: any[];
  lessonNotes: string;
  marketingAssets: {
    facebookPost: string;
    linkedInPost: string;
    xPost: string;
    youtubeMetadata: {
      seoTitle: string;
      description: string;
      tags: string[];
      timestamps: string[];
    };
  };
}
