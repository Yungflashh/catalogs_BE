import mongoose, { Document, Schema, Types } from 'mongoose';

export type FundingStatus = 'pending' | 'approved' | 'rejected';

export interface IWalletFunding extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  cryptoWallet: Types.ObjectId;
  status: FundingStatus;
  proofImage?: string;
  expiresAt: Date;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const walletFundingSchema = new Schema<IWalletFunding>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    cryptoWallet: { type: Schema.Types.ObjectId, ref: 'CryptoWallet', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    proofImage: { type: String },
    expiresAt: { type: Date, required: true },
    adminNote: { type: String },
  },
  { timestamps: true }
);

export const WalletFunding = mongoose.model<IWalletFunding>('WalletFunding', walletFundingSchema);
