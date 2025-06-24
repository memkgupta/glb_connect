import mongoose, { Schema } from "mongoose";

export interface IAnnouncement extends Document {
  title: string;
  description: string;
  details:string;
  createdBy: mongoose.Types.ObjectId;
  attachements:mongoose.Types.ObjectId[]; // reference to User
  tags?: string[];
  from?:string,
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema: Schema = new Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    details:{type:String},
    attachements:[{type:mongoose.Types.ObjectId,ref:'Attachement'}],
    description: {
      type: String,
      required: true,
    },
    from:{
        type:String,
        enum:["Admin","HOD","FACULTY","EXAM-CELL"],
        default:"Admin"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],

    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

const Announcement = mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);
export default Announcement