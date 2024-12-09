import mongoose, { Mongoose, Schema } from "mongoose";

const channelSchema = new Schema({
    name:{type:String,required:true,unique:true},
    category:{type:String,required:true},
    coverPage:{type:String},
    profilePic:{type:String,required:true},
    description:{type:String,required:true},
    rules:[{type:String,required:true}],
    admin:{type:mongoose.Schema.Types.ObjectId,ref:"User",unique:true},
    isActive:{type:Boolean,default:false},
    
},{
    timestamps:true
})

const Channel = mongoose.model("Channel",channelSchema);

export default Channel;