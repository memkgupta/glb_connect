import mongoose, { Schema } from "mongoose";

const voteSchema = new mongoose.Schema({
    resourceId:{type:Schema.Types.ObjectId},
    userId:{type:Schema.Types.ObjectId,ref:'User'},
    voteType:{type:String,required:true,default:'up',enum:['up','down']}
},{timestamps:true});

const Vote = mongoose.models.Vote || mongoose.model('Vote',voteSchema);
export default Vote;