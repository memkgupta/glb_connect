// models/attachment.model.ts

import mongoose, { Schema, Document } from "mongoose";

export type AttachmentType = "file" | "image" | "link";

export interface IAttachment extends Document {
  type: AttachmentType;
  title: string;
  description?: string;

  // If type === 'link'
  linkUrl?: string;

  // If type === 'file' or 'image'
  uploadRef?: mongoose.Types.ObjectId;

  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    type: {
      type: String,
      enum: ["file", "image", "link"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },

    // If it's a link
    linkUrl: {
      type: String,
      required: function (this: IAttachment) {
        return this.type === "link";
      },
    },

    // If it's a file/image (uploaded to your system)
    uploadRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Upload",
      required: function (this: IAttachment) {
        return this.type === "file" || this.type === "image";
      },
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Attachment = mongoose.model<IAttachment>("Attachment", AttachmentSchema);
