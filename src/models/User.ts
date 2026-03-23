import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'rep' | 'manager' | 'director' | 'admin';

export interface ISalesforceConnection {
  userId: string;
  accessToken: string;
  refreshToken: string;
  instanceUrl: string;
  tokenExpiresAt: Date;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  sfUserId: string;
  role: UserRole;
  managerId: mongoose.Types.ObjectId | null;
  salesforce?: ISalesforceConnection;
  createdAt: Date;
  updatedAt: Date;
}

const SalesforceConnectionSchema = new Schema<ISalesforceConnection>({
  userId: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  instanceUrl: { type: String, required: true },
  tokenExpiresAt: { type: Date, required: true },
}, { _id: false });

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    sfUserId: { type: String, required: true, unique: true },
    role: { type: String, enum: ['rep', 'manager', 'director', 'admin'], default: 'rep' },
    managerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    salesforce: { type: SalesforceConnectionSchema, required: false },
  },
  { timestamps: true }
);

UserSchema.index({ managerId: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ sfUserId: 1 });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
