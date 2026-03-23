import mongoose, { Schema, Document, Model } from 'mongoose';

export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface IPeriodConfig extends Document {
  _id: mongoose.Types.ObjectId;
  type: PeriodType;
  year: number;
  value: number;
  startDate: Date;
  endDate: Date;
  submissionDeadline: Date | null;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PeriodConfigSchema = new Schema<IPeriodConfig>(
  {
    type: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly'], required: true },
    year: { type: Number, required: true },
    value: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    submissionDeadline: { type: Date, default: null },
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PeriodConfigSchema.index({ type: 1, year: 1, value: 1 }, { unique: true });
PeriodConfigSchema.index({ startDate: 1, endDate: 1 });

export const PeriodConfig: Model<IPeriodConfig> =
  mongoose.models.PeriodConfig || mongoose.model<IPeriodConfig>('PeriodConfig', PeriodConfigSchema);
