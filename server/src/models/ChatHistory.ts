import mongoose, { Schema, Document } from 'mongoose';

interface IMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface IChatHistory extends Document {
  userId: mongoose.Types.ObjectId;
  materialId: mongoose.Types.ObjectId;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema({
  role: {
    type: String,
    enum: ['user', 'model'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const chatHistorySchema = new Schema<IChatHistory>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  materialId: {
    type: Schema.Types.ObjectId,
    ref: 'StudyMaterial',
    required: true,
    index: true
  },
  messages: [messageSchema]
}, {
  timestamps: true
});

// Composite index for efficient queries
chatHistorySchema.index({ userId: 1, materialId: 1 });

export const ChatHistory = mongoose.model<IChatHistory>('ChatHistory', chatHistorySchema);
