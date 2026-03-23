import mongoose, { Schema, Document, Model } from 'mongoose';
import { PeriodType } from './Period';

export interface IQuotaPeriod {
  type: PeriodType;
  year: number;
  value: number;
}

export interface IQuota extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  period: IQuotaPeriod;
  amount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuotaPeriodSchema = new Schema<IQuotaPeriod>(
  {
    type: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly'], required: true },
    year: { type: Number, required: true },
    value: { type: Number, required: true },
  },
  { _id: false }
);

const QuotaSchema = new Schema<IQuota>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    period: { type: QuotaPeriodSchema, required: true },
    amount: { type: Number, required: true, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

QuotaSchema.index({ userId: 1, 'period.type': 1, 'period.year': 1, 'period.value': 1 }, { unique: true });
QuotaSchema.index({ 'period.type': 1, 'period.year': 1, 'period.value': 1 });

export const Quota: Model<IQuota> =
  mongoose.models.Quota || mongoose.model<IQuota>('Quota', QuotaSchema);
