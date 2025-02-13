import mongoose from "mongoose";

const clubTeamSchema =new mongoose.Schema({
    title:{type:String,required:true},
    club:{type:mongoose.Schema.Types.ObjectId,ref:"Club"},
    description:{type:String,required:true},
    status:{type:String,default:"active",enum:["active","removed"]},
    head:{type:mongoose.Schema.Types.ObjectId,ref:"ClubMember"}
},{timestamps:true})

const ClubTeam =mongoose.model("ClubTeam",clubTeamSchema);
export default ClubTeam;