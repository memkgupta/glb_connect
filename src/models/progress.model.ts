import mongoose, { mongo }  from "mongoose";
const progressSchema = new mongoose.Schema({
    resource_id:{type:mongoose.Schema.Types.ObjectId,ref:'Resource'},
    taken:[{type:mongoose.Schema.Types.ObjectId}],
    recent:{type:mongoose.Schema.Types.ObjectId},
    user_id:{type:mongoose.Schema.Types.ObjectId,ref:'User'}
},{timestamps:true})

export const Progress =mongoose.model("Progress",progressSchema);