import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
title:{type:String,required:true},
member:{type:mongoose.Schema.Types.ObjectId,ref:'ClubMember'},
});