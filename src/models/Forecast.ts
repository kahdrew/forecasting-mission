import mongoose, { Schema, Document, Model } from 'mongoose';

export type ForecastStatus = 'draft' | 'submitted' | 'approved';
export type MatchType = 'auto' | 'manual' | 'unmatched';
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface IForecastCategories {
  commit: number;
  consumption: number;
  bestCase: number;
  services: number;
}

export interface IAdjustment {
  managerId: mongoose.Types.ObjectId;
  managerName: string;
  categories: IForecastCategories;
  reason: string;
  createdAt: Date;
}

export interface ISalesforceData {
  amount: number;
  stage: string;
  closeDate: Date;
  probability: number;
  forecastCategory: string;
}

export interface IPeriod {
  type: PeriodType;
  year: number;
  value: number; // week 1-53, month 1-12, quarter 1-4, day 1-366
}

export interface IForecast extends Document {
  _id: mongoose.Types.ObjectId;
  opportunityId: string | null;
  opportunityName: string | null;
  accountName: string;
  repId: mongoose.Types.ObjectId;
  repName: string;
  period: IPeriod;
  categories: IForecastCategories;
  adjustments: IAdjustment[];
  sfData: ISalesforceData | null;
  matchType: MatchType;
  status: ForecastStatus;
  submittedAt: Date | null;
  approvedAt: Date | null;
  approvedBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const PeriodSchema = new Schema<IPeriod>(
  {
    type: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly'], required: true },
    year: { type: Number, required: true },
    value: { type: Number, required: true },
  },
  { _id: false }
);

const ForecastCategoriesSchema = new Schema<IForecastCategories>(
  {
    commit: { type: Number, default: 0 },
    consumption: { type: Number, default: 0 },
    bestCase: { type: Number, default: 0 },
    services: { type: Number, default: 0 },
  },
  { _id: false }
);

const AdjustmentSchema = new Schema<IAdjustment>(
  {
    managerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    managerName: { type: String, required: true },
    categories: { type: ForecastCategoriesSchema, required: true },
    reason: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SalesforceDataSchema = new Schema<ISalesforceData>(
  {
    amount: { type: Number, required: true },
    stage: { type: String, required: true },
    closeDate: { type: Date, required: true },
    probability: { type: Number, required: true },
    forecastCategory: { type: String, required: true },
  },
  { _id: false }
);

const ForecastSchema = new Schema<IForecast>(
  {
    opportunityId: { type: String, default: null },
    opportunityName: { type: String, default: null },
    accountName: { type: String, required: true },
    repId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    repName: { type: String, required: true },
    period: { type: PeriodSchema, required: true },
    categories: { type: ForecastCategoriesSchema, required: true },
    adjustments: { type: [AdjustmentSchema], default: [] },
    sfData: { type: SalesforceDataSchema, default: null },
    matchType: { type: String, enum: ['auto', 'manual', 'unmatched'], default: 'unmatched' },
    status: { type: String, enum: ['draft', 'submitted', 'approved'], default: 'draft' },
    submittedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

ForecastSchema.index({ repId: 1, 'period.type': 1, 'period.year': 1, 'period.value': 1 });
ForecastSchema.index({ opportunityId: 1 });
ForecastSchema.index({ status: 1 });
ForecastSchema.index({ 'period.type': 1, 'period.year': 1, 'period.value': 1 });

export const Forecast: Model<IForecast> =
  mongoose.models.Forecast || mongoose.model<IForecast>('Forecast', ForecastSchema);
