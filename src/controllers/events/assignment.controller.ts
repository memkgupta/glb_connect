import { APIError } from "@errors/APIError";
import { BadRequestError } from "@errors/BadRequestError";
import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { createAssignment, createAssignmentSubmission, fetchAssignmentById, fetchSubmissions, removeAssignment, updateAssignmentById } from "@services/events/assignment";
import { authenticateEventOwner, fetchEventById } from "@services/events/event_service";
import { asyncHandler } from "@utils/api/asyncHandler";
import { eventAssignmentSchema } from "@utils/validators/schemas/event_assignment";
import { NextFunction,Request,Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";

export const addAssignment = asyncHandler(async (req:Request,res:Response,next:NextFunction)=>{
         const {event_id} = req.query;
              const parsedData = eventAssignmentSchema.parse(req.body)
            const event = await fetchEventById(event_id);
            if(!event){
               throw new NotFoundError("event not found")
            }
            const user = req.user;
            const isAuthenticated = event.owner.equals(user._id);
            if(!isAuthenticated){
                throw new UnauthorizedError("Not authorised")
            }
          
            const assignment = await createAssignment(parsedData)
            res.status(200).json({
                success:true,assignment:assignment
            })
})
export const deleteAssignment = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
    const {assignment_id} = req.query;
    const user = req.user;
    if(!assignment_id || (assignment_id as string).length==0)
    {
        throw new BadRequestError("assignment id is required")
    }
    await removeAssignment(assignment_id as string,user._id);
    res.status(200).json({success:true,message:"Assignment Removed successfully"})
})
export const updateAssignment = asyncHandler(asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
     const {assignment_id} = req.query;
    const user = req.user;
    if(!assignment_id || (assignment_id as string).length==0)
    {
        throw new BadRequestError("assignment id is required")
    }
    const parsedData = eventAssignmentSchema.parse(req.body)
    const updatedAssignment = await updateAssignmentById(assignment_id as string,parsedData,user._id);
    res.status(200).json({
        success:true,assignment:updateAssignment
    })
}))
export const submitAssignment = asyncHandler(
    async(req:Request,res:Response,next:NextFunction)=>{
        const {member_id,form_submission,assignment_id,registration_id} = req.body;
       const submission = await createAssignmentSubmission(assignment_id,{member:member_id,formSubmission:form_submission,registration_id})
        res.status(200).json({success:true,submission:submission})
    }
)
export const getRegistrationSubmissions = asyncHandler(
    async(req:Request,res:Response,next:NextFunction)=>{
      
        const {registration_id}=req.query;
        if(!registration_id || (registration_id as string).length==0)
        {
         throw new BadRequestError("Assignment id is required")
        }
     
        const submissions = await fetchSubmissions({registration:registration_id as string});
        res.status(200).json({
            success:true,
            submissions
        })
    }
)

export const getTeamSubmissions = asyncHandler(
   async (req:Request,res:Response,next:NextFunction)=>{
        const {team_id} = req.query;
        if(!team_id || (team_id as string).length==0)
        {
            throw new BadRequestError("Team id is required")
        }
        const submissions = await fetchSubmissions({team:team_id});
        res.status(200).json({success:true,submissions})
    }
)