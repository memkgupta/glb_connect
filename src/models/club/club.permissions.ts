import mongoose from "mongoose";

const clubPermissionSchema = new mongoose.Schema({
    title:{type:String,required:true},
    resource:{type:String,required:true},
    club:{type:mongoose.Schema.Types.ObjectId,ref:'Club'},
    resourceId:{type:mongoose.Schema.Types.ObjectId},
    action:{type:String,required:true,enum:["OWNER","VIEW","DELETE","WRITE"]},
    member:{type:mongoose.Schema.Types.ObjectId,ref:"ClubMember"}
})
const ClubPermission = mongoose.model("ClubPermission",clubPermissionSchema)
export default ClubPermission;