import mongoose, { Schema } from "mongoose";
const postSchema  = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    attachments:[{
        type:{type:String,enum:["pdf","img"]},
        url:{type:String,required:true}
    }],
    tags:[String],
    author: { type:Schema.Types.ObjectId, ref: 'User', required: true },
    channel: { type:Schema.Types.ObjectId, ref: 'Channel', required: true },
   
},{
    timestamps:true
})
const Post = mongoose.model("Post",postSchema);
export default Post;