import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    title:{type:String,required:true},
    description:{type:String,required:true},
    assignedTo:{type:mongoose.Schema.Types.ObjectId,ref:'ClubMember'},
    status:{type:String,required:true,default:"to-do",enum:["todo","in_progress","completed","backlog"]},
    attachements:[mongoose.Schema.Types.ObjectId],
    dueDate:{type:Date,required:true},
    completedAt:{type:Date},
    completionComment:{type:String},
    teamId:{type:mongoose.Schema.Types.ObjectId,ref:"ClubTeam"},
    priority:{type:String,required:true,default:"low",enum:["low","medium","high"]},
    assignedBy:{type:mongoose.Schema.Types.ObjectId,ref:"ClubMember",required:true},
    event:{type:mongoose.Schema.Types.ObjectId,ref:"Event"},
},{timestamps:true})
const taskCommentSchema = new mongoose.Schema({
    comment:{type:String,required:true},
    member:{type:mongoose.Schema.Types.ObjectId,ref:'ClubMember',required:true},
    task:{type:mongoose.Schema.Types.ObjectId,ref:'ClubTask'},
},{timestamps:true})
export const TaskComment = mongoose.model("TaskComment",taskCommentSchema)
const ClubTask = mongoose.model("ClubTask",taskSchema);
export default ClubTask
