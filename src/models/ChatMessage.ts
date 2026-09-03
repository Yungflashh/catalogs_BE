import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  chat: Types.ObjectId;
  from: 'user' | 'admin';
  text: string;
  telegramMessageId?: number;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
    from: { type: String, enum: ['user', 'admin'], required: true },
    text: { type: String, required: true },
    telegramMessageId: { type: Number, index: true },
  },
  { timestamps: true }
);

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
