// models/activity.model.ts

import mongoose, { Schema, Document } from "mongoose";

export interface IActivity extends Document {
  type: "resource" | "article" | "roadmap"|"lectures";
  title: string;
  refId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  message?: string; // optional description
  createdAt: Date;
}

const ActivitySchema: Schema = new Schema<IActivity>(
  {
    type: {
      type: String,
      enum: ["resource", "article", "roadmap","lectures"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
    },
  },
  {
    timestamps: true, // adds createdAt
  }
);

export const Activity = mongoose.model<IActivity>("Activity", ActivitySchema);
