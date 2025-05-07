import { BadRequestError } from "@errors/BadRequestError";
import { ForbiddenError } from "@errors/ForbiddenError";
import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { Event } from "@models/event.model";
import Form from "@models/form.model";
import FormSubmission from "@models/form.submission.model";
import User from "@models/user.model";
import { NextFunction, Request, Response } from "express";
import mongoose, { PipelineStage } from "mongoose";
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
      },{new:true});
      res.status(200).json({
        success: true,
        message: "Form updated successfully",
        form:result
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
      if (!event || !event.owner.equals(user._id)) {
        return next(new ForbiddenError("Unauthorized to perform this action"));
      }
      if(event.basicDetails!.startDate!<new Date()){
        return next(new BadRequestError("Can't edit event now"));
      }
      const form = await Form.create({
        event: body.event,
      
        formName: body.formName,
        fields: body.fields,
        createdAt: new Date(),
      });
  
     
      await event.save();
      res.status(200).json({
        success: true,
        message: "Form added successfully",
        form:form
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

    const formId = req.params.fid;
    try {
   
  
    
      const form = await Form.findById(formId).populate("event");


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
        if(form.type==="registration")
        {
          return next(new BadRequestError("Can't hide registration form"))
        }
        form.enabled = (enabled as string)==="t"?true:false;
        res.status(200).json({success:true,message:"Form updated"})
    } catch (error) {
        console.error(error);
        return next(new InternalServerError("Some error occured"));
    }
  }
export const getEventForms = async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const {eid} = req.query;
    const _user = req.user;
    const event = await Event.findById(eid);
    if(!event?.owner.equals(_user._id))
    {
      return next(new UnauthorizedError("You are not allowed"))
    }
    
    const forms = await Form.find({
      event:event._id
    });
    res.status(200).json({
      success:true,forms
    });
  } catch (error) {
      console.log(error);
      return next(new InternalServerError("Some error occured"));
  }
}
export const getFormResponses = async(req:Request,res:Response,next:NextFunction)=>{
  const { fid, page = "1", search = "" } = req.query;

  const skip = (parseInt(page as string) - 1) * 100;
  const limit = 10;

  try {
    if (!fid) {
      return next(new BadRequestError("Form id is required"))
    }

    const formId = new mongoose.Types.ObjectId(fid as string);

    // Build match query
    const matchStage: any = {
      formId,
    };

    if (search) {
      matchStage.$or = [
        { "userDetails.email": { $regex: search, $options: 'i' } },
        { "userDetails.name": { $regex: search, $options: 'i' } },
      ];
    }

    const aggregationPipeline:PipelineStage[] = [
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      { $match: matchStage },
      {
        $project: {
          _id: 1,
          submittedAt: 1,
          userDetails: {
            username: 1,
            name: 1,
            email: 1
          }
        }
      },
      { $sort: { submittedAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    const countPipeline = [
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      { $match: matchStage },
      { $count: "total" }
    ];

    const [formResponses, totalCountResult] = await Promise.all([
      FormSubmission.aggregate(aggregationPipeline),
      FormSubmission.aggregate(countPipeline)
    ]);

    const total = totalCountResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      submissions: formResponses,
      total,
      currentPage: parseInt(page as string),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occurred"));
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