import mongoose, { Schema } from 'mongoose';

// Configuración aislada: nunca añadimos un campo de IA al documento público completo de la tienda.
export interface ClippyFAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface ClippySettings {
  _id: string;
  enabled: boolean;
  aiEnabled: boolean;
  welcomeMessage: string;
  personality: string;
  whatsappNumber: string;
  maxPerMinute: number;
  maxPerDay: number;
  maxGlobalAiPerDay: number;
  faqs: ClippyFAQ[];
}

const FAQSchema = new Schema<ClippyFAQ>({
  id: { type: String, required: true },
  category: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
}, { _id: false });

const SettingsSchema = new Schema<ClippySettings>({
  _id: { type: String, default: 'singleton' },
  enabled: { type: Boolean, default: true },
  aiEnabled: { type: Boolean, default: false },
  welcomeMessage: { type: String, default: '¡Hola! Soy Clippy 📎. Te ayudo con la tienda y tus looks.' },
  personality: { type: String, default: 'Cercano, útil y breve. Español de Chile, sin presión comercial.' },
  whatsappNumber: { type: String, default: '' },
  maxPerMinute: { type: Number, default: 5 },
  maxPerDay: { type: Number, default: 25 },
  maxGlobalAiPerDay: { type: Number, default: 200 },
  faqs: { type: [FAQSchema], default: [] },
}, { collection: 'clippy_settings', versionKey: false, timestamps: true });

// Cada clave representa una ventana de tiempo sin guardar conversaciones ni IP sin cifrar.
const UsageSchema = new Schema({
  _id: { type: String, required: true },
  count: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true },
}, { collection: 'clippy_usage', versionKey: false });
UsageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ClippySettingsModel =
  mongoose.models.ClippySettings || mongoose.model<ClippySettings>('ClippySettings', SettingsSchema);
export const ClippyUsageModel =
  mongoose.models.ClippyUsage || mongoose.model('ClippyUsage', UsageSchema);
