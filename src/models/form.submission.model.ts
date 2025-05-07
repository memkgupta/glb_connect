import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
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
  
  const FormSubmission = mongoose.model('FormSubmission', submissionSchema);
export default FormSubmission;
  