import { BadRequestError } from "@errors/BadRequestError";
import { ForbiddenError } from "@errors/ForbiddenError";
import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";
import { Event, EventFeedback, EventRegistration, Team, TeamMember } from "@models/event.model";
import Form from "@models/form.model";
import FormSubmission, { IFormSubmission } from "@models/form.submission.model";
import User from "@models/user.model";
import { NextFunction, Request, response, Response } from "express";
import { sendEventRegistrationEmail,  sendNewTeamMemberMail } from "../../helpers/mail";
import mongoose, { PipelineStage } from "mongoose";
import { v4 } from "uuid";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { authenticateEventOwner, fetchEventById } from "@services/events/event_service";
import { stat } from "fs";
import { fetchEventTeams, fetchTeamById } from "@services/events/teams";
import { fetchRegistrationsPaginated, fetchRegistrationsOfTeam, totalRegistrations } from "@services/events/registrations";
import { Types } from "mongoose";
import { asyncHandler } from "@utils/api/asyncHandler";
import { generateSixDigitCodeFromUUID } from "@utils/index";
export const registerForEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //@ts-ignore
  //@ts-ignore
  const _user = req.user;
  const { event_id,registrationDetails } = req.body;
  console.log(req.body)
  let user_id = null;
  try {
    if(_user){
      const user = await User.findById(_user.userId);
      if (!user) {
        return next(new ForbiddenError("Invalid session, please login again"));
      }
      user_id = user._id;
    }
   
    const event = await Event.findOne({
      _id: event_id,
     
    });
    if (!event) {
      return next(new BadRequestError("No such event exists"));
    }
    if(!event.basicDetails?.participantsFromOutsideAllowed && user_id==null){
      return next(new BadRequestError("Only for GL BAJAJ students"));
    }
    const registrationsTotal = await EventRegistration.find({
      event: event._id,
      status: "completed",
    }).countDocuments();
    if (event.basicDetails?.maxParticipants && registrationsTotal >= parseInt(event.basicDetails!.maxParticipants!)) {
      res.status(200).json({
        success: false,
        message: "Registrations full",
      });
    }
    const registrationExists = await EventRegistration.find({
      email:registrationDetails.email,
      event_id: event._id,
    });
    if (registrationExists.length > 0) {
      return next(new BadRequestError("Already registered"));
    }
    const registration = await EventRegistration.create({
      email:registrationDetails.email,
      user:user_id,
      phoneNo:registrationDetails.phoneNo,
      collegeDetails:registrationDetails.collegeDetails,
      name:registrationDetails.name,
      registrationCode:generateSixDigitCodeFromUUID(),
      registrationTimestamp: new Date(),
      event: event._id,
    });
    res.status(200).json({
      sucess: true,
      id: registration._id,
    });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const getForm = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  

  const { rid, fid } = req.query;
  try {
 
    const registration = await EventRegistration.findById(rid);
    if (!registration) {
      return next(new BadRequestError("No registration found"));
    }
   
    const form = await Form.findOne({
      event: registration.event,
     
    });
    if (!form || !form.enabled) {
      return next(new NotFoundError("No such form exists"));
    }
    
    res.status(200).json({ success: true, fields: form?.fields });
  } catch (error) {
    console.log(error);
    return next(new InternalServerError("Some error occured"));
  }
};

export const fillRegistrationForm = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  const { registrationId, formData ,form_id} = req.body;
  try {
 
    const registration = await EventRegistration.findById(
      registrationId
    ).populate("event");

    if (!registration) {
      return next(new BadRequestError("Event registration not exists"));
    }
    const event = await Event.findById(registration.event);
    if(!event)
    {
      return next(new NotFoundError("Event not found"))
    }
    const form = await Form.findById(event.registrationForm)
    if(!form){
      return next(new NotFoundError("Form not found"))
    }
    const isSubmissionExists = await FormSubmission.findOne({
      formId:form._id,
      submittedBy:registration._id
    })

    if(isSubmissionExists){
      return next(new BadRequestError("Form already submitted"))
    }
    const formSubmission:IFormSubmission = await FormSubmission.create({
      formId: form?._id,
      submittedBy:registration._id,
      submissionData: formData,
      submittedAt: new Date(),
    });
    if(event.registrationForm && event.registrationForm.equals(form._id))
    {
      registration.status = "completed";
      registration.formSubmission = formSubmission._id as Types.ObjectId;
      await registration.save();
      await sendEventRegistrationEmail(registration.email, registration.name, {
        eventDate: event!.basicDetails!.startDate,
        eventName: event!.basicDetails!.title,
        venue: event!.basicDetails!.venue,
      });
      res.status(200).json({
        success: true,
        message: "Registration  successfull",
        registration:registration
      });
      return;
    }
    else{
      res.status(200).json({
        success:true,
        message:"Form submitted",
        submission:formSubmission._id
      })
    }

  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const joinTeam = async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const _user = req.user;
      const {team_code,registration_id} = req.body;
      const registration = await EventRegistration.findById(registration_id).populate('event');
      if(!registration){
        return next(new NotFoundError("Registration doesn't exists"));
      }
      if(registration.team){
        return next(new BadRequestError("You are already registerd"));
      }
      const team = await Team.findOne({
        code:team_code
      }).populate('lead');
      if(!team){
        return next(new NotFoundError("Team doesn't exists"));
      }
      const event = registration.event as any
if(!event.basicDetails.isTeamEvent){
  return next(new BadRequestError("bad request"));
}
      if(team.members.length>=(event.eventStructure.teamRequirements.maximumStrength || 4)){
        return next(new BadRequestError("Team already full"));
      }
      const teamMember = await TeamMember.create({
        event:registration.event,
        team:team._id,
        user:_user?.userId,
        registrationDetails:registration._id,
      });
      team.members.push(teamMember._id);
      await team.save();
      registration.team = team._id;
      await registration.save();
      await sendNewTeamMemberMail((team.lead as any)?.email,registration.name,team.name,{eventName:event.basicDetails.title,eventDate:event.basicDetails.startDate,venue:event.basicDetails.venue})
      res.status(200).json({success:true,message:"Team joined successfully",team:{_id:team._id}});
  }
  catch(error){
    console.log(error);
    return next(new InternalServerError("Som error occured"));
  }
}
export const createTeam = async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const {team_name,registration_id} = req.body;
    const registration = await EventRegistration.findById(registration_id);
    if(!registration){
      return next(new NotFoundError("Registration not found"));
    }
    const isAlreadyTeamMember = await TeamMember.findOne({
      registrationDetails:registration._id
    });
    if(isAlreadyTeamMember){
      return next(new BadRequestError("Already joined a team"));
    }
    const teamCode = v4();
    const team = await Team.create({
      event:registration.event,
      name:team_name,
      code:teamCode,
    });
    const lead = await TeamMember.create({
      event:registration.event,
      team:team._id,
      isLead:true,
      user:req.user?._id,
      registrationDetails:registration._id
    })
    team.lead = lead._id
    team.members.push(lead._id)
    await team.save();
    registration.team = team._id;
    await registration.save()
    res.status(200).json({
      success:true,message:"Team created ",team
    });
  } catch (error) {
    return next(new InternalServerError("Some error occured"))
  }
}
export const submitTeamForReview = async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const _user = req.user;
    const {team_id,token} = req.body;
    const team = await Team.findById(team_id);
    if(!team)
    {
      return next(new NotFoundError("Team not found"));
    }
    if(_user!=null)
    {
      const member = await TeamMember.findOne({
        team:team._id,
        user:_user._id,
      });
      if(!member || !team.lead?.equals(member._id))
      {
        return next(new UnauthorizedError("Not allowed to perform this action"));
      }
    }
    else{
      if(token == null){
        return next(new UnauthorizedError("You are not allowed"));
      }
      if(!team.equals(token))
      {
        return next(new UnauthorizedError("Invalid token"));
      }

    }
team.status ="submitted";
await team.save();
res.status(200).json({success:true,message:"Team submitted",team:team});
  }
  catch(error)
  {
    return next(new InternalServerError("Some error occured"))
  }
}
export const giveFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //@ts-ignore
  const _user = req.user;
  const { feedback_msg, rating, event_id } = req.body;
  try {
    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new ForbiddenError("Invalid session,Please login again"));
    }
    const registration = await EventRegistration.findOne({
      user: user._id,
      event: event_id,
    });
    if (!registration) {
      return next(new ForbiddenError("You can't give feedback for the event"));
    }
    let feedback = await EventFeedback.findOne({
      user: user._id,
      event: event_id,
    });
    if (feedback) {
      res
        .status(200)
        .json({ success: false, message: "Already gave your feedback" });
    } else {
      feedback = await EventFeedback.create({
        event: event_id,
        user: user._id,
        rating: rating,
        feedback: feedback_msg,
      });
    }
    res
      .status(200)
      .json({ success: true, message: "Your feedback was submitted" });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const isRegistered = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //@ts-ignore
  const _user = req.user;
  const eventId = req.query.eid;
  // console.log(eventId);
  try {
    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new BadRequestError("Invalid session"));
    }

    const registration = await EventRegistration.findOne({
      user: user._id,
      event: eventId,
    });
    // console.log(registration)
    if (!registration) {
      res.status(200).json({
        success: true,
        registration: { status: "not-registered", rid: null },
      });
      return;
    }

    res.status(200).json({
      success: true,
      registration: {
        status: registration?.status,
        rid: registration._id,
        createdAt: registration.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const getMyRegistrationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //@ts-ignore
  const _user = req.user;
  const regId = req.query.regId;
  
  try {
    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new BadRequestError("Invalid session"));
    }
  if(!regId || (regId as string).length==0){
    return next(new BadRequestError("Registration id is required"));
  }
    const registration = await EventRegistration.aggregate(
        [
          {$match:{
    _id:new mongoose.Types.ObjectId(regId as string),
            }},
          {
            $lookup:{
              from:"teams",
              let:{teamId:"$team"},
              as:"team",
              pipeline:[
                {
                  $match:{
                    $expr:
                        {
                          $eq:["$_id","$$teamId"]
                        }
                  },

                },
                {
                  $lookup:{
                    from:"teammembers",
                    as:"members",
                    let:{
                      memberIds:"$members"
                    },
                    pipeline:[
                      {
                        $match: {
                          $expr: {
                            $in: ["$_id", "$$memberIds"]
                          }
                        }
                      },


                    ]
                  }
                }
              ]

            }
          },
          {$unwind:{
            path:"$team",
              preserveNullAndEmptyArrays:true
            }}
        ]
    )

  

    res.status(200).json({
      success: true,
      registration: registration[0],
    });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const viewRegistrationById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    //@ts-ignore
    const _user = req.user;
    const { id } = req.params;
    try {
     
      const registration_ = await EventRegistration.findById(id);
      if(!registration_){
        return next(new NotFoundError("Registration not found"))
      }
      if(!registration_.user!.equals(_user._id)){
        return next(new NotFoundError("No registration found"));
      }
      const registration = await EventRegistration.aggregate([
        {
          $match: {
            _id: registration_._id,
          },
        },
        {$lookup: {
          from: 'forms',
          let :{eventId:"$event"},
        as:'registrationForm',
        pipeline:[
          {
            $match:{
              $expr:{
                $and:[
                  {$eq:["$$eventId","$event"]},
                  {$eq:["$type","registration"]}
                ]
             
              },
              
            }
          },{
            $project:{
              fields:1
            }
          }
        ]
        }},
        {$lookup:{
          from:"users",
          as:"user",
          localField:"user",
          foreignField:"_id"
        }},
        {$unwind:"$user"},
         {
              $lookup: {
                from: "events",
                as: "event",
                localField: "event",
                foreignField: "_id",
              },
            },
            {$unwind:"$event"},
      
      
            {
              $lookup: {
                from: "formsubmissions",
                as: "submission",
                localField: "formSubmission",
                foreignField: "_id",
              },
            },
       {$unwind: "$submission"},
            {
              $project: {
                registrationForm:1,
                event: {
                  banner: 1,
                  name: 1,
                  description: 1,
                  dateTime: 1,
                },
                submission: {
                  submissionData: 1,
                },
                user:{
                  profile:1,
                  username:1,
                  email:1,
                  name:1
                },
                applicationNote: 1,
                status: 1,
                registrationTimeStamp: 1,
              },
            },
      ]);
  
      res.status(200).json({
        success: true,
        data: registration[0],
      });
    } catch (error) {
      console.error(error);
      return next(new InternalServerError("Some error occured"));
    }
};
//further optimisations required
export const approveTeam = async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const _user = req.user;
    const {team_id} = req.query;
    const team = await Team.findById(team_id).populate('event');
    const event = team?.event as any;
    if(!team){
      return next(new NotFoundError("Team not found"));
    }
    if(!event.owner.equals(_user._id))
    {
      return next(new UnauthorizedError("You are not allowed"));
    }
    if(team.status=="approved")
    {
      return next(new BadRequestError("Team already approved"))
    }
    team.status = "approved"
    await team.save()
   
    await EventRegistration.updateMany({
      team:team._id
    },{isApproved:true})
    res.status(200).json({success:true,message:"Team approved successfully"});
  }
  catch(error){
return next(new InternalServerError("Some error occured"));
  }
}
export const approveRegistration = async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const _user = req.user;
    const {registration_id} = req.body;
    const registration = await EventRegistration.findById(registration_id).populate('event');
    const event = registration?.event as any;
    if(!registration){
      return next(new NotFoundError("Registration not found"));
    }
    if(!event.owner.equals(_user._id))
    {
      return next(new UnauthorizedError("You are not allowed"));
    }
    if(registration.isApproved)
    {
      return next(new BadRequestError("Registration already approved"))
    }
  registration.isApproved = true;
    await registration.save()

    res.status(200).json({success:true,message:"Team approved successfully"});
  }
  catch(error){
return next(new InternalServerError("Some error occured"));
  }
}
export const getMyTeamDetails = async(req:Request,res:Response,next:NextFunction)=>{
  try{
    const {regId} = req.query;
    const _user = req.user;
    const reg = await EventRegistration.findById(regId);
    if(!reg || !reg.team){
      return next(new NotFoundError("No registration found"));
    }
    if(reg.user && !reg.user?.equals(_user._id))
    {
      return next(new UnauthorizedError("You are not authorised"))
    }
    const teamDetails = await Team.aggregate([
      {
        $match:{
          _id:reg.team
        }
      },
      {
        $lookup:{
          from:"teammembers",
          as:"members",
         let:{
         memberIds:"$members"
         },
         pipeline:[
          {
            $match: {
            $expr: {
              $in: ["$_id", "$$memberIds"]
            }
          }
          },
          {
            $lookup:{
              from:"eventregistrations",
              as:"registrationDetails",
              localField:"registrationDetails",
              foreignField:"_id"
            }
          },
          {
            $unwind:{
              path:"$registrationDetails",
              preserveNullAndEmptyArrays:true
            }
          },
           {
             $project:{
               _id:1,
               user:1,
               registrationDetails:{
                 user:1,
                 email:1,
                 name:1
               }

             }
           }
         ]
        }
      }
    ]);
    if(!teamDetails || teamDetails.length == 0)
    {
      return next(new NotFoundError("No team found"));
    }
      res.status(200).json({
    success:true,team:teamDetails[0]
  })
  }
  catch(error){
    return next(new InternalServerError("Some error occured"));
  }
}

export const getTeams = async(req:Request,res:Response,next:NextFunction)=>{
  try{
      const {event_id} =req.query;
      if(!event_id){
        return next(new BadRequestError("Bad request event_id is required"))
      }
      const _user = req.user;
      const event = await fetchEventById(event_id as string);
      if(event ==null)
      {
        return next(new NotFoundError("Event not found"));
      }
      const {name,approved,status,page} = req.query;
      console.log(req.query)
      const {teams,totalTeams} = await fetchEventTeams(event._id,{name,approved,status,page:parseInt(((page || "1" )as string))});
      res.status(200).json({success:true,teams,totalTeams});
     
  }
  catch(error)
  {
    console.log(error);
    return next(new InternalServerError("Some error occured"))
  }
}
export const getTeamDetails = async(req:Request,res:Response,next:NextFunction)=>{
    try{
      const team_id = req.params.tid;
      const {event_id} = req.query;
      const _user = req.user;
      if(!event_id || !team_id){
        return next(new BadRequestError("Bad request"))
      }
      if(!(await authenticateEventOwner(event_id as string,_user._id))){
        return next(new UnauthorizedError("You are not authorised"));
      }
    
      const team =await fetchTeamById(new mongoose.Types.ObjectId(team_id as string));
      const registrationDetails = await fetchRegistrationsOfTeam(team_id);
 
      res.status(200).json({success:true,team,registrationDetails});
    }
    catch(error:any)
    {
      console.log(error)
      return next(new InternalServerError("Some error occured"))
    }
}

export const getMyRegistrations = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
  const user = req.user;
  let {title,page} = req.query; 
 const pageInt = parseInt(page ? page as string :"1");

  const registrations = await fetchRegistrationsPaginated({
    
   title:{$regex:new RegExp(title as string,"i")}
  },pageInt,new mongoose.Types.ObjectId(user._id))
  const total = await totalRegistrations(new mongoose.Types.ObjectId(user._id),{
   
    title:{$regex:new RegExp(title as string,"i")}
  },)
  res.status(200).json({success:true,registrations:registrations,total})
})