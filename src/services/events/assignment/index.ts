import { EventAssignment, EventAssignmentSubmission, IEventAssignment } from "@models/event.model";
import { eventAssignmentSchema } from "@utils/validators/schemas/event_assignment";
import { z } from "zod";
import { authenticateEventOwner } from "../event_service";
import { NotFoundError } from "@errors/NotFoundError";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { fetchMember } from "../teams";
import FormSubmission, { IFormSubmission } from "@models/form.submission.model";
import mongoose from "mongoose";
import { fetchRegistrationById } from "../registrations";
import { mapFormSubmissionWithLabel } from "@services/forms";

export type EventAssignmentPayload = z.infer< typeof eventAssignmentSchema>
export const createAssignment = async(data:EventAssignmentPayload)=>{
   const assignment = await EventAssignment.create(
    data
   );
   return assignment;
}
export const removeAssignment = async(assignment_id:string,user_id:string)=>{
    const assignment = await EventAssignment.findById(assignment_id);
    if(!assignment)
    {
        throw new NotFoundError("Assignment not found")
    }
    const isAuthorised = await authenticateEventOwner(assignment.event.toString(),user_id);
    if(!isAuthorised)
    {
        throw new UnauthorizedError("Not authorised")
    }
    await assignment.deleteOne();
}
export const updateAssignmentById = async(assignment_id:string,updatedAssignment:EventAssignmentPayload,user_id:string)=>{
    const assignment = await fetchAssignmentById(assignment_id);
    if(!assignment)
    {
        throw new NotFoundError("Assignment not found")
    }
    const isAuthorised = await authenticateEventOwner(assignment.event.toString(),user_id);
    if(!isAuthorised)
    {
        throw new UnauthorizedError("Not authorised")
    }
   return await assignment.updateOne(updatedAssignment,{new:true});
}

// to be cached
export const fetchAssignmentById = async(assignment_id:string)=>{
    return await EventAssignment.findById(assignment_id);
}

export const createAssignmentSubmission = async(assignment_id:string,data:{

    member:string,
    registration_id:string,
    formSubmission:string
})=>{
    const assignment = await fetchAssignmentById(assignment_id);
    if(!assignment){
        throw new NotFoundError("Assignment not found")
    }
    const registration = await fetchRegistrationById(data.registration_id)
    if(!registration){
        throw new NotFoundError("Registration not found");
    }
    let member ;
    if(registration.team)
    {
       member = await fetchMember(data.member);
          if(!member){
        throw new NotFoundError("No member found")
    }
    if(assignment.leadOnly && !member?.isLead)
    {
        throw new UnauthorizedError("Only lead can submit this")
    }
    }
 

    const form_submission = await FormSubmission.findById(data.formSubmission);
    if(!form_submission){
        throw new NotFoundError("Form submission not found")
    }
    const assignment_submission = await EventAssignmentSubmission.create({
        assignment:assignment._id,
        member:member?._id,
        team:registration.team,
        registration:registration._id,
        formSubmission:form_submission._id
    })
    return assignment_submission; 
}

export const fetchSubmissions = async(filters:any)=>{
    const submissions:any = await EventAssignmentSubmission.find(filters).populate('formSubmission').populate("registration");
    submissions.forEach((s:any)=>{
        s.formSubmission = mapFormSubmissionWithLabel(s.formSubmission as any)
    })
    return submissions;
}

