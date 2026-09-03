import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChat extends Document {
  _id: Types.ObjectId;
  sessionId: string;
  user?: Types.ObjectId;
  name?: string;
  email?: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Chat = mongoose.model<IChat>('Chat', chatSchema);
