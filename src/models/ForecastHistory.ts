import mongoose, { Schema, Document, Model } from 'mongoose';
import { IForecastCategories } from './Forecast';

export type ChangeType = 'create' | 'update' | 'adjust' | 'approve' | 'submit';

export interface IForecastHistory extends Document {
  _id: mongoose.Types.ObjectId;
  forecastId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  previousCategories: IForecastCategories | null;
  newCategories: IForecastCategories;
  changeType: ChangeType;
  reason: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const ForecastCategoriesSchema = new Schema(
  {
    commit: { type: Number, default: 0 },
    consumption: { type: Number, default: 0 },
    bestCase: { type: Number, default: 0 },
    services: { type: Number, default: 0 },
  },
  { _id: false }
);

const ForecastHistorySchema = new Schema<IForecastHistory>(
  {
    forecastId: { type: Schema.Types.ObjectId, ref: 'Forecast', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    previousCategories: { type: ForecastCategoriesSchema, default: null },
    newCategories: { type: ForecastCategoriesSchema, required: true },
    changeType: { type: String, enum: ['create', 'update', 'adjust', 'approve', 'submit'], required: true },
    reason: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ForecastHistorySchema.index({ forecastId: 1, createdAt: -1 });
ForecastHistorySchema.index({ userId: 1, createdAt: -1 });

export const ForecastHistory: Model<IForecastHistory> =
  mongoose.models.ForecastHistory || mongoose.model<IForecastHistory>('ForecastHistory', ForecastHistorySchema);
