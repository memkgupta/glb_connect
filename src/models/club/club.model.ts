import mongoose,{Schema} from "mongoose";

const clubSchema = new Schema({
    clubEmail:{type:String,required:true,unique:true},
    clubDescription:{type:String,required:true},
    clubLogo:{type:String,required:true},
    contactPhone:{type:String,required:true,unique:true},
    clubName:{type:String,required:true},
    isVerified:{type:Boolean,required:true,default:false},
    admin:{type:Schema.Types.ObjectId,ref:'User',required:true,unique:true},
});

const Club =  mongoose.model('Club',clubSchema);
export default Club;