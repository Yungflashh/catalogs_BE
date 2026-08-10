import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICryptoWallet extends Document {
  _id: Types.ObjectId;
  name: string;
  symbol: string;
  address: string;
  network?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const cryptoWalletSchema = new Schema<ICryptoWallet>(
  {
    name: { type: String, required: true, trim: true },
    symbol: { type: String, required: true, trim: true, uppercase: true },
    address: { type: String, required: true, trim: true },
    network: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const CryptoWallet = mongoose.model<ICryptoWallet>('CryptoWallet', cryptoWalletSchema);
