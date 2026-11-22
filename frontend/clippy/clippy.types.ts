// Tipos públicos del asistente. No incluye claves ni información administrativa.
export interface ClippyFaq {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface ClippyPublicConfig {
  enabled: boolean;
  aiEnabled: boolean;
  welcomeMessage: string;
  faqs: ClippyFaq[];
  whatsappNumber: string;
}

export interface ClippyAdminConfig extends ClippyPublicConfig {
  personality: string;
  maxPerMinute: number;
  maxPerDay: number;
  maxGlobalAiPerDay: number;
  geminiConfigured: boolean;
}

export interface ClippyProduct {
  id: string;
  title: string;
  category: string;
  section: string;
  imageUrl: string;
  price: number;
  sizes: string[];
  url: string;
}

export interface ClippyReply {
  answer: string;
  products: ClippyProduct[];
  suggestions?: string[];
  mode: 'guide' | 'gemini';
  contactUrl: string;
}
