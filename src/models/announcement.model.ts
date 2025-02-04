import mongoose, { Schema } from "mongoose";

const annoucementSchema = new Schema({
    title:{type:String,required:true},
    description:{type:String,required:true},
    actionLink:{type:String},
    endDate:{type:Date,required:true},
    isRemoved:{type:Boolean,default:false}
},{timestamps:true})

const Announcement = mongoose.model("Announcement",annoucementSchema)
export default Announcement;