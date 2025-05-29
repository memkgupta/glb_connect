import { NotFoundError } from "@errors/NotFoundError";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { EventAttendance, EventRegistration } from "@models/event.model";
import { authenticateEventOwner } from "@services/events/event_service";
import { fetchRegistration } from "@services/events/registrations";
import { asyncHandler } from "@utils/api/asyncHandler";
import { NextFunction, Request, Response } from "express";

export const fetchRegistrationDetailsForCheckin = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
    const registration = await fetchRegistration({registrationCode:req.query.regCode});
  console.log(registration)
    res.status(200).json({
        success:true,
        registration:registration
    })
})

export const checkIn = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
    const registration = await EventRegistration.findById(req.query.id);
    if(!registration)
    {
        throw new NotFoundError("Registration not found")
    }
    const isOwner = await authenticateEventOwner(registration.event.toString(),req.user._id);
    if(!isOwner)
    {
        throw new UnauthorizedError("You are not authorised")
    }
    const attendance = await EventAttendance.create(
        {
            event:registration.event,
            registration:registration._id,
            timeStamp:new Date()
        }
    )
    res.status(200).json({
        success:true,id:attendance._id
    })
})