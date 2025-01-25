import mongoose, { Schema } from "mongoose";
export const extensions = [
    ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".svg", ".webp", ".heic", // Images
    ".doc", ".docx", ".odt",                                                  // Word files
    ".ppt", ".pptx", ".odp",                                                  // PPTs
    ".pdf"                                                                    // PDFs
  ];
 export const mimeTypes = [
    "image/jpeg", "image/png", "image/gif", "image/bmp", "image/tiff", 
    "image/svg+xml", "image/webp", "image/heic",                              // Images
    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
    "application/vnd.oasis.opendocument.text",                                // Word files
    "application/vnd.ms-powerpoint", 
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", 
    "application/vnd.oasis.opendocument.presentation",                        // PPTs
    "application/pdf"                                                         // PDFs
  ];
const uploadSchema = new Schema({
    title:{type:String,required:true},
    key:{type:String,unique:true,required:true},
    type:{type:String,required:true,enum:["profile","resource","image"]},
    mimeType:{type:String,required:true,enum:mimeTypes},
    fileSize:{type:Number,required:true},
    createdAt:{type:Date,default:Date.now()},
    user:{type:Schema.Types.ObjectId,ref:'User',required:true},
    protected:{type:Boolean,default:false}
},{
    timestamps:true
})

const Upload = mongoose.model("Upload",uploadSchema);
export default Upload;