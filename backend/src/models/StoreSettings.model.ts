import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBackgroundConfig {
  imageUrl: string;
  fileName?: string;
  fitMode: 'cover' | 'contain' | 'repeat' | 'center';
  updatedAt?: string;
}

export interface IHomeMediaConfig {
  mediaType?: 'video' | 'gif';
  src?: string;
  videoUrl?: string;
  fileName?: string;
  title: string;
  isActive?: boolean;
}

export interface ISliderItem {
  id: string;
  imageUrl: string;
  title: string;
  tag?: string;
  redirectUrl?: string;
  altText?: string;
  isActive?: boolean;
}

export interface IStoreSettings extends Document<string> {
  _id: string;
  backgroundConfig: IBackgroundConfig;
  homeMediaConfig: IHomeMediaConfig;
  sliders: ISliderItem[];
  sliderSpeed: number;
  infoTexts: Record<string, any>;
  categoriesVisibility: Record<string, any>;
  shippingRatesMatrix: Record<string, any>;
  shippingHistory: any[];
  coupons: any[];
  updatedAt: Date;
  updatedBy?: Types.ObjectId | null;
}

const BackgroundConfigSchema = new Schema<IBackgroundConfig>(
  {
    imageUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    fitMode: {
      type: String,
      enum: ['cover', 'contain', 'repeat', 'center'],
      default: 'cover',
    },
    updatedAt: { type: String, default: '' },
  },
  { _id: false }
);

const HomeMediaConfigSchema = new Schema<IHomeMediaConfig>(
  {
    mediaType: { type: String, enum: ['video', 'gif'], default: 'gif' },
    src: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    title: { type: String, default: 'Clip_Promocional.wmv' },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const SliderItemSchema = new Schema<ISliderItem>(
  {
    id: { type: String, required: true },
    imageUrl: { type: String, required: true },
    title: { type: String, required: true },
    tag: { type: String, default: '' },
    redirectUrl: { type: String, default: '' },
    altText: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    _id: { type: String, default: 'global_settings' },
    backgroundConfig: { type: BackgroundConfigSchema, default: () => ({}) },
    homeMediaConfig: { type: HomeMediaConfigSchema, default: () => ({}) },
    sliders: { type: [SliderItemSchema], default: [] },
    sliderSpeed: { type: Number, default: 4500 },
    infoTexts: { type: Schema.Types.Mixed, default: () => ({}) },
    categoriesVisibility: {
      type: Schema.Types.Mixed,
      default: () => ({
        disabledSections: [],
        disabledCategories: [],
        disabledSubcategories: [],
      }),
    },
    shippingRatesMatrix: { type: Schema.Types.Mixed, default: () => ({}) },
    shippingHistory: { type: Schema.Types.Mixed, default: () => [] },
    coupons: { type: Schema.Types.Mixed, default: () => [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    collection: 'store_settings',
    timestamps: { createdAt: false, updatedAt: true },
  }
);

export const StoreSettingsModel =
  mongoose.models.StoreSettings ||
  mongoose.model<IStoreSettings>('StoreSettings', StoreSettingsSchema);