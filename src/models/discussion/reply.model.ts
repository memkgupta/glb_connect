import mongoose, { Schema } from "mongoose";

const replySchema = new Schema({
    postId:{type:mongoose.Schema.Types.ObjectId,ref:'Post'},
    content:{type:String,required:true},
    attachments:[{
        type:{type:String,enum:["pdf","img"]},
        url:{type:String,required:true}
    }],
    parentId:{type:mongoose.Schema.Types.ObjectId,ref:'Reply'},
    author:{type:mongoose.Schema.Types.ObjectId,ref:'User'}
});
const Reply = mongoose.model("Reply",replySchema);
export default Reply;