import { UserRoles } from "../types/index";
import mongoose,{Schema} from "mongoose";
import { Document } from 'mongoose';
const userSchema:Schema = new Schema<IUser>({
    profile:{type:String,default:"/"},
    name:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    username:{type:String,required:true,unique:true},
    otp:{type:String},
    verified:{type:Boolean,required:true,default:false},
    otpExpiry:{type:Date},
    password:{type:String,required:true},
    refresh_token:{type:String},
    role:{type:String,enum:["ADMIN","CONTRIBUTOR","STUDENT","CLUB","DIRECTOR","HOD","FACULTY"],default:'USER'},
    bio:{type:String,default:''},
    college:{type:Schema.Types.ObjectId,ref:'College'},
    interests:[{type:String}],
    socials: [{type:String}],
},{timestamps:true})
userSchema.index({
    name:'text',username:'text',bio:'text'
},{weights:{name:10,username:10,bio:5}})
const User = mongoose.models.User || mongoose.model('User',userSchema);
export default User;

export interface IUser extends Document {
    profile:string,
    name:string,
    email:string,
    username:string,
    otp:string,
    verified:boolean,
    otpExpiry:Date,
    password:string,
    refresh_token:string,
    role:string,
    bio:string,
    college:Schema.Types.ObjectId,
    interests:string[],
    socials:string[],
  createdAt?: Date;
  updatedAt?: Date;
}
