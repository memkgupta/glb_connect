import { BadRequestError } from "@errors/BadRequestError";
import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import Upload, { extensions, mimeTypes } from "@models/upload.model";
import User from "@models/user.model";
import { getObjecURL, putObject } from "@utils/s3";
import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";

export const startUpload = async(req:Request,res:Response,next:NextFunction)=>{
    const {metaData}:{metaData:{
        title:string,
        type:string,
        mimeType:string,
        
        fileSize:string,
        protected:boolean,
    }}=req.body;
    //@ts-ignore
    const _user = req.user;
    if(!_user){
        return next(new UnauthorizedError("You are not authorized"))
    }
   try {
    const user = await User.findById(_user.userId);

    if(!user){
        return next(new BadRequestError("Invalid session"));
    }
    const isValidFileType = mimeTypes.some((v)=>v===metaData.mimeType);
    if(!isValidFileType){
        return next(new BadRequestError("File type not supported"))
    }
     
    const isValidSize = parseInt(metaData.fileSize)<=(64*1024*1024);
    if(!isValidSize){
        return next(new BadRequestError("File too large"));
    }
    const key = `uploads/${metaData.type}/users/${user._id}/${randomUUID()}-${Date.now()}-${metaData.title}`
    const upload = await Upload.create({
            title:metaData.title,
            key:key,
            mimeType:metaData.mimeType,
        
            type:metaData.type,
            fileSize:metaData.fileSize,
            createdAt:new Date(),
            user:user?._id,
            
            protected:metaData.protected
        });
    const url =await putObject(key,metaData);
    console.log(url);
     res.status(200).json({success:true,preSignedUrl:url,expiresIn:'30min',url:`${process.env.SERVER_URL||`http://localhost:8000`}/api/v1/uploads/public/get?id=${upload._id}`});
   } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"))
   }
}
export const getUpload = async(req:Request,res:Response,next:NextFunction)=>{
    const {id} = req.query;
    try {
        const upload = await Upload.findById(id);
        if(!upload){
            return next(new NotFoundError("Resource not found"))
        }
       
        // const url = await getObjecURL(upload.key);
        const url = `https://d1k9jx0t56dwsj.cloudfront.net/${upload.key}`
        res.status(200).send(url);
    } catch (error) {
        
        console.error(error);
        return next(new InternalServerError("Some error occured"));

    }
}