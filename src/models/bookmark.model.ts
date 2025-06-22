import mongoose, { Schema } from "mongoose";

const bookmarkSchema = new Schema({
    user:{type:mongoose.Schema.Types.ObjectId,ref:"User",reqiured:true},
    resource:{type:mongoose.Schema.Types.ObjectId,ref:"Resource",required:true},

},{
    timestamps:true
})

export const Bookmark = mongoose.model("bookmark",bookmarkSchema);