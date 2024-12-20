import mongoose, { Schema } from "mongoose";

const sourceSchema = new Schema({
    name:{type:String,unique:true}
})
const Source = mongoose.model("Source",sourceSchema);
export default Source