import { BadRequestError } from "@errors/BadRequestError";
import { ForbiddenError } from "@errors/ForbiddenError";
import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";
import { Event } from "@models/event.model";
import Form from "@models/form.model";
import FormSubmission from "@models/form.submission.model";
import User from "@models/user.model";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { AddFormBody } from "src/@types";

export const updateForm = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    //@ts-ignore
   
    const _user = req.user;
    const formId = req.query.formId;
    const body: Partial<AddFormBody> = req.body;
    try {
      const user = await User.findById(_user.userId);
      if (!user) {
        return next(new ForbiddenError("Invalid session , please login again"));
      }
  
      const form = await Form.findById(formId);
      if (!form) {
        return next(new BadRequestError("Form not exits"));
      }
      const updateObject: any = {};
      const arrayFilters: any[] = [];
 
      const result = await Form.findByIdAndUpdate(formId, {
        fields: body.fields,
      });
      res.status(200).json({
        success: true,
        message: "Form updated successfully",
      });
    } catch (error) {
      console.error(error);
      return next(new InternalServerError("Some error occured"));
    }
  };
  export const addFormToEvent = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    //@ts-ignore
    const _user = req.user;
    const body: AddFormBody = req.body;
    try {
      const user = await User.findById(_user.userId);
      if (!user) {
        return next(new ForbiddenError("Invalid session , please login again"));
      }
      const event = await Event.findById(body.event);
      if (!event || !event.admin.equals(user._id)) {
        return next(new ForbiddenError("Unauthorized to perform this action"));
      }
      if(event.dateTime<new Date()){
        return next(new BadRequestError("Can't edit event now"));
      }
      const form = await Form.create({
        event: body.event,
        type: body.type,
        formName: body.formName,
        fields: body.fields,
        createdAt: new Date(),
      });
      if(body.type ==="registration"){
        if(event.registrationForm){
          return next(new BadRequestError("Registration form already exists"))
        }
        event.registrationForm = form._id;
        if(event.dateTime<new Date()){
            event.isPublished = true;
            event.status="upcoming"
        }
      }
     
      await event.save();
      res.status(200).json({
        success: true,
        message: "Form added successfully",
        id: form._id,
      });
    } catch (error) {
      console.error(error);
      return next(new InternalServerError("Some error occured"));
    }
  };  
  export const getFormById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    //@ts-ignore
    const _user = req.user;
    const formId = req.params.fid;
    try {
      const user = await User.findById(_user.userId);
      if (!user) {
        return next(new ForbiddenError("Invalid session , please login again"));
      }
  
      // registration.ev
      const form = await Form.findById(formId).populate("event");
      //@ts-ignore
      if (!form?.event.admin.equals(user._id)) {
        return next(new ForbiddenError("Unauthorized"));
      }
      res.status(200).json({ success: true, fields: form?.fields });
    } catch (error) {
      console.log(error);
      return next(new InternalServerError("Some error occured"));
    }
  };
  export const toggleHideForm = async(req:Request,res:Response,next:NextFunction)=>{
    const {fid,enabled} = req.query;
    try {
        const form = await Form.findById(fid as string);
        if(!form){
            return next(new NotFoundError("Form not found"));
        }
        form.enabled = (enabled as string)==="t"?true:false;
        res.status(200).json({success:true,message:"Form updated"})
    } catch (error) {
        console.error(error);
        return next(new InternalServerError("Some error occured"));
    }
  }
  export const getEventForms = async(req:Request,res:Response,next:NextFunction)=>{
    const {eid} = req.query;
    try {
        const forms = await Form.aggregate([
            {
                $match:{
                    event:new mongoose.Types.ObjectId(eid as string)
                }
            },{
                $lookup:{
                    from:"formsubmission",
                    as:"formSubmissions",
                    localField:"_id",
                    foreignField:"formId"
                }
            },
            {
                $project:{
                    event:1,
                    formName:1,
                    type:1,
                    enabled:1,
                    createdAt:1,
                    totalResponses:{$size:"$formSubmissions"}
                }
            }
        ]);
        res.status(200).json({success:true,forms:forms});
    } catch (error) {
        console.error(error);
        return next(new InternalServerError("Some error occured"));
    }
  }
export const getFormResponses = async(req:Request,res:Response,next:NextFunction)=>{
    //@ts-ignore
    const _user = req.user;
    const {fid,page,search} = req.query;
    const skip = (parseInt(page as string)-1)*10;
    try {
     
      const formResponses = await FormSubmission.aggregate([
        {$match:{
          _id:new mongoose.Types.ObjectId(fid as string),
          $or:[
            {"userDetails.email":{$regex:search,$options:'i'}},
            {"userDetails.name":{$regex:search,$options:'i'}}
          ]
        }},
        {$lookup:{
          from:"forms",
          as:"form",
          localField:"formId",
          foreignField:"_id"
        }},
  
        {
          $lookup:{
            from:"users",
            as:"userDetails",
            localField:"studentId",
            foreignField:"_id"
          }
        },
        {$unwind:"$userDetails"},
       
     
        {
          $project:{
            _id:1,
            userDetails:{
              username:1,
              name:1,
              email:1
            },
            submittedAt:1
          }
        },
        
      ]);
      // const total = await FormSubmission.find({formId:fid}).countDocuments()
      res.status(200).json({
        success:true,submissions:formResponses
      });
    } catch (error) {
      console.error(error);
      return next(new InternalServerError("Some error occured"));
    }
  }
  export const getFormResponseById = async(req:Request,res:Response,next:NextFunction)=>{
     //@ts-ignore
     const _user = req.user;
     const {sid} = req.params;
     try {
       const user = await User.findById(_user.userId);
       if(!user){
         return next(new ForbiddenError("Invalid session , please login again"))
       }
  
       const formSubmission = await FormSubmission.aggregate([
        {
          $match:{
            _id:new mongoose.Types.ObjectId(sid!.toString())
          },
  
        },
        {
          $lookup:{
            from:"forms",
            as:"form",
            localField:"formId",
            foreignField:"_id"
          }
        },
        {$unwind:"$form"},
        {
          $lookup:{
            from:"events",
            as:"event",
            localField:"form.event",
            foreignField:"_id",
          }
        },
        {$unwind:"$event"},
        
        {
          $lookup:{
            from:"users",
            as:"userDetails",
            localField:"studentId",
            foreignField:"_id"
          }
        },
        {$unwind:"$userDetails"},
        {
          $project:{
            submissionData:1,
            submittedAt:1,
            event:{
              banner:1,
              name:1,
              description:1,
              dateTime:1
            },
            form:1,
            userDetails:{
              profile:1,
              username:1,
              name:1,
              email:1
            }
          }
        }
       ])
       res.status(200).json({success:true,submission:formSubmission[0]});
      }
      catch(error){
        console.error(error);
        return next(new InternalServerError("Some error occured"));
      }
  }