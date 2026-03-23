import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOpportunity extends Document {
  _id: mongoose.Types.ObjectId;
  sfId: string;
  userId: mongoose.Types.ObjectId;
  name: string;
  accountName: string;
  amount: number;
  stageName: string;
  closeDate: Date;
  probability: number;
  forecastCategory: string;
  ownerId: string;
  ownerName: string;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OpportunitySchema = new Schema<IOpportunity>(
  {
    sfId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    accountName: { type: String, required: true },
    amount: { type: Number, default: 0 },
    stageName: { type: String, required: true },
    closeDate: { type: Date, required: true },
    probability: { type: Number, default: 0 },
    forecastCategory: { type: String, default: '' },
    ownerId: { type: String, required: true },
    ownerName: { type: String, default: '' },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

OpportunitySchema.index({ sfId: 1, userId: 1 }, { unique: true });
OpportunitySchema.index({ userId: 1 });
OpportunitySchema.index({ accountName: 'text', name: 'text' });

export const Opportunity: Model<IOpportunity> =
  mongoose.models.Opportunity || mongoose.model<IOpportunity>('Opportunity', OpportunitySchema);
