import { ForbiddenError } from "@errors/ForbiddenError";
import { InternalServerError } from "@errors/InternalServerError";
import Club from "@models/club/club.model";
import Resources from "@models/resource.model";
import User from "@models/user.model";
import { NextFunction, Request, Response } from "express";

export const dashboard = async(req:Request,res:Response,next:NextFunction)=>{
    //todo
    //@ts-ignore
    const _user = req.user;
    try {
        const user = await User.findById(_user.userId);
        if(!user){
            return next(new ForbiddenError("Invalid session , please login again"))
        }
        if(user.role!="ADMIN"){
            return next(new ForbiddenError("Unauthorized"));
        }
        const totalUsers = await User.countDocuments();
        const totalResources = await Resources.countDocuments();
        const totalClubs = await Club.countDocuments();
    } catch (error) {
        console.error(error);
        return next(new InternalServerError("Some error occured"))
    }
}

export const getUsers = async(req:Request,res:Response,next:NextFunction)=>{

}
export const getUserById = async(req:Request,res:Response,next:NextFunction)=>{

}
export const banUser = async(req:Request,res:Response,next:NextFunction)=>{

}
export const deleteUser = async(req:Request,res:Response,next:NextFunction)=>{

}
export const getReports = async(req:Request,res:Response,next:NextFunction)=>{
    // todo
}
export const getResources = async(req:Request,res:Response,next:NextFunction)=>{


} 
export const getContributionById = async(req:Request,res:Response,next:NextFunction)=>{

}
export const removeContribution = async(req:Request,res:Response,next:NextFunction)=>{

}
export const makeAnnouncement = async(req:Request,res:Response,next:NextFunction)=>{

}
export const runAdCampaign = async(req:Request,res:Response,next:NextFunction)=>{

}
export const endAdCampaign =async(req:Request,res:Response,next:NextFunction)=>{

}
export const addSubjects = async(req:Request,res:Response,next:NextFunction)=>{

}
export const editSubject = async(req:Request,res:Response,next:NextFunction)=>{

}
export const removeSubject = async(req:Request,res:Response,next:NextFunction)=>{

}
export const editConfiguration = async(req:Request,res:Response,next:NextFunction)=>{
    
}