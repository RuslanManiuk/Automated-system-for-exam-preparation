import mongoose, { Schema, Document } from "mongoose";

interface IFlashcard {
  id: string;
  question: string;
  answer: string;
  status: "new" | "learning" | "mastered";
  nextReview?: number;
}

interface IMindMapNode {
  id: string;
  label: string;
  children?: IMindMapNode[];
}

export interface IStudyMaterial extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  originalContent: string;
  summary: string;
  glossary: Array<{
    term: string;
    definition: string;
  }>;
  keyFacts: string[];
  mindMap: IMindMapNode;
  flashcards: IFlashcard[];
  createdAt: Date;
  updatedAt: Date;
  file?: {
    originalName: string;
    mime: string;
    size: number;
    path: string;
  };
}

const flashcardSchema = new Schema(
  {
    id: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    status: {
      type: String,
      enum: ["new", "learning", "mastered"],
      default: "new",
    },
    nextReview: { type: Number },
  },
  { _id: false },
);

const mindMapNodeSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    children: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

const studyMaterialSchema = new Schema<IStudyMaterial>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    originalContent: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    glossary: [
      {
        term: { type: String, required: true },
        definition: { type: String, required: true },
      },
    ],
    keyFacts: [{ type: String }],
    mindMap: {
      type: mindMapNodeSchema,
      required: true,
    },
    flashcards: [flashcardSchema],
    file: {
      originalName: { type: String },
      mime: { type: String },
      size: { type: Number },
      path: { type: String },
    },
  },
  {
    timestamps: true,
  },
);

// Index for user's materials
studyMaterialSchema.index({ userId: 1, createdAt: -1 });

export const StudyMaterial = mongoose.model<IStudyMaterial>(
  "StudyMaterial",
  studyMaterialSchema,
);
