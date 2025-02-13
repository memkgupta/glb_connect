import mongoose from "mongoose";

const eventTaskBoard = new mongoose.Schema({
    title:{type:String,required:true},
    description:{type:String},
    club:{type:mongoose.Schema.Types.ObjectId,ref:"Club"},
    event:{type:mongoose.Schema.Types.ObjectId,ref:"Event"},
    teams:[{
        title:{type:String},
        teamId:{type:mongoose.Schema.Types.ObjectId,ref:"ClubTeam"},  
    }],
   
},{timestamps:true})