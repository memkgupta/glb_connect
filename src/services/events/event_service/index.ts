import { Event } from "@models/event.model"
import mongoose from "mongoose";

export const fetchEventById:any =async(eventId:string|mongoose.Types.ObjectId)=>{
    try{
        const event = await Event.findById(eventId);
        return event;
    }
    catch(error:any){
        throw new Error(error.message);
    }
}

export const authenticateEventOwner = async(event_id:string|mongoose.Types.ObjectId,user_id:string)=>{
        try{
            const event =await fetchEventById(event_id);
            if(!event){
                throw new Error("Event not found");
            }
           
            return event.owner.equals(user_id)
        }
        catch(error:any)
        {
            throw new Error(error.message)
        }
}