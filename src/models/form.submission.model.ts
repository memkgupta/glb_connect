import mongoose, { Document, Model, Types } from "mongoose";
export interface IFormSubmission extends Document {
  formId: Types.ObjectId;
  submittedBy: Types.ObjectId;
  submissionData: Map<string, any>; // fieldLabel => fieldValue
  submittedAt: Date;
}
const submissionSchema = new mongoose.Schema<IFormSubmission>({
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Form',
      required: true,
    },
    submittedBy:{
      type:mongoose.Schema.Types.ObjectId,
      required:true,
    },
    submissionData: {
      type: Map,  // A map that stores fieldLabel: fieldValue pairs
      of: mongoose.Schema.Types.Mixed,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  });
  
  const FormSubmission:Model<IFormSubmission> = mongoose.model<IFormSubmission>('FormSubmission', submissionSchema);
export default FormSubmission;
  