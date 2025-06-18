export interface Slide {
  id: number;
  title: string;
  subtitle?: string;
  content: SlideContent;
  notes?: string;
  interactive?: boolean;
  module: number;
  section: string;
}

export type SlideContent = 
  | TitleSlideContent
  | TextSlideContent
  | CodeSlideContent
  | InteractiveSlideContent
  | LabSlideContent
  | ConfigSlideContent;

export interface TitleSlideContent {
  type: 'title';
  mainTitle: string;
  subtitle?: string;
  instructor?: {
    name: string;
    company: string;
    role: string;
  };
  backgroundAnimation?: boolean;
}

export interface TextSlideContent {
  type: 'text';
  points: string[];
  image?: string;
  animation?: 'fade' | 'slide' | 'scale';
}

export interface CodeSlideContent {
  type: 'code';
  code: string;
  language: string;
  highlightLines?: number[];
  explanation?: string;
  runnable?: boolean;
  animation?: 'fade' | 'slide' | 'scale';
}

export interface InteractiveSlideContent {
  type: 'interactive';
  component: string;
  props?: any;
}

export interface LabSlideContent {
  type: 'lab';
  labNumber?: string;
  title: string;
  tasks?: string[];
  steps?: string[];
  expectedOutcome?: string[];
  hints?: string[];
  estimatedTime?: string;
}

export interface ConfigSlideContent {
  type: 'config';
  configs: ConfigItem[];
}

export interface ConfigItem {
  key: string;
  value: string;
  description: string;
  details?: string;
  importance?: 'low' | 'medium' | 'high';
}