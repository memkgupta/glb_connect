
import mongoose,{Schema} from "mongoose";
const userSchema = new Schema({
    profile:{type:String,default:"/"},
    name:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    username:{type:String,required:true,unique:true},
    otp:{type:String},
    verified:{type:Boolean,required:true,default:false},
    otpExpiry:{type:Date},
    lastOtpSent:{type:Date},
    password:{type:String,required:true},
    refresh_token:{type:String},
    role:{type:String,enum:["USER","ADMIN","CONTRIBUTOR","STUDENT","CLUB","DIRECTOR","HOD","FACULTY"],default:'USER'},
    bio:{type:String,default:''},
    college:{type:Schema.Types.ObjectId,ref:'College'},
    interests:[{type:String}],
    socials: [{type:String}],
},{timestamps:true})

const User =  mongoose.model('User',userSchema);
export default User;


