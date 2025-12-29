import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  username: string;
  avatar?: string;
  stats: {
    xp: number;
    level: string;
    streak: number;
    lastActiveDate?: Date;
    achievements: string[];
    cardsLearned: number;
    testsPassed: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      required: false,
    },
    stats: {
      xp: { type: Number, default: 0 },
      level: { type: String, default: "Студент" },
      streak: { type: Number, default: 0 },
      lastActiveDate: { type: Date },
      achievements: [{ type: String }],
      cardsLearned: { type: Number, default: 0 },
      testsPassed: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
userSchema.index({ email: 1 });

export const User = mongoose.model<IUser>("User", userSchema);
