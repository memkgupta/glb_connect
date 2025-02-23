import { BadRequestError } from "@errors/BadRequestError";
import { ForbiddenError } from "@errors/ForbiddenError";
import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import ClubMember from "@models/club/club.members";
import Club from "@models/club/club.model";
import { Event, EventFeedback, EventRegistration } from "@models/event.model";
import Form from "@models/form.model";
import User from "@models/user.model";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { AddFormBody } from "src/@types";

export const getAdminEvents = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
   const {club_id} = req.query;
      const events = await Event.aggregate([
        {
          $match: {
            club: new mongoose.Types.ObjectId(club_id as string),
            isRemoved:false
          },
        },
        {
          $lookup: {
            from: "event_registrations",
            localField: "_id",
            foreignField: "event",
            as: "registrations",
          },
        },
        {
          $project: {
            dateTime: 1,
            name: 1,
            description: 1,
            location: 1,
            status:{$cond:{
              "if":{"$gte":["$dateTime",new Date()]},
              "then":"Upcoming",
              "else":"Completed"
            }},
            category: 1,
            participantsFromOutsideAllowed: 1,
            maxCapacity: 1,
            _id:1,
            admin:1,
            isTeamEvent:1,
            isPublished:1,
            key_persons:1,
            venue:1,
            isAcceptingVolunteerRegistrations:1,
            banner:1,
            organizer:1
          },
        },
      
      ]);
  
 
  
      res.status(200).json({
        success: true,
        events
       
      });
    } catch (error) {
      console.error("GET /events error:", error);
      return next(new InternalServerError("Some error occured"));
    }
  };
export const getTeamLeadEvents = async(req:Request,res:Response,next:NextFunction)=>{
  res.status(200).json({success:true,events:[]});
}
export const getTeamMemberEvents = async(req:Request,res:Response,next:NextFunction)=>{
  res.status(200).json({success:true,events:[]})
}
export const getEventRegistrations = async(req:Request,res:Response,next:NextFunction)=>{
  const eid = req.query.eid;
  const {username,email,page}= req.query;
  try {
    const filters:any = {

    }
    if(username && username.toString().length>0){
      filters.username = {
        $regex:`^${username}`,
        $options:"i"
      }
    }
    

    if(email && email.toString().length>0){
      filters.email = {
        $regex:`^${email}`,
        $options:"i"
      }
    }
    const registrations = await EventRegistration.aggregate([
      {
        $match:{...filters,event:new mongoose.Types.ObjectId(eid as string)}
      },
      {
        $limit:20
      },
      {$skip:(parseInt(page as string)-1)*20},
      {
        $lookup:{
          from:'users',
          as:'user',
          localField:"user",
          foreignField:"_id"
        }
      },
      {$unwind:{
        path:"$user",
        preserveNullAndEmptyArrays:true,
      }},
      {
        $project:{
          _id:1,
          event:1,
          formSubmission:1,
          entry_status:1,
          updatedAt:1,
          user:{
            profile:1,
            email:1,
            username:1,
            name:1,
          }
        }
      }
    ]);
    const totalResults = await EventRegistration.find({...filters,event:new mongoose.Types.ObjectId(eid as string)}).countDocuments()
    res.status(200).json({success:true,registrations:registrations,totalResults:totalResults});
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
}
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
    if(!registration_.user.equals(new mongoose.Types.ObjectId(_user.userId))){
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

export const addEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    clubId,
    name,
    description,
    dateTime,
    location,
    category,
    creationTimestamp,
    forms,
    key_persons,
    banner,
    participantsFromOutsideAllowed,
    maxCapacity,
    venue,
    isTeamEvent,
    maxTeamSize,
    isAcceptingVolunteerRegistrations,
  } = req.body;

  try {
    //@ts-ignore
    const _user = req.user;

    // Validate user session
    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new UnauthorizedError("Please Login Again"));
    }

    // Validate club
    const club = await Club.findById(clubId);
    if (!club) {
      return next(new BadRequestError("Club not found"));
    }

    // Authorization check
    if (!club.admin.equals(user._id)) {
      return next(new ForbiddenError("Don't have enough permissions"));
    }

    // Create event
    const event = await Event.create({
      name,
      admin: club.admin,
      banner,
      description,
      venue,
      dateTime,
      maxCapacity,
      location,
      forms,
      key_persons: key_persons,
      creationTimestamp: creationTimestamp || new Date(),
      category,
      club: club._id,
      participantsFromOutsideAllowed,
      maxTeamSize,
      isTeamEvent,
      isAcceptingVolunteerRegistrations,
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully.",
      id: event._id,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const updateEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const {
    name,
    description,
    dateTime,
    organizer,
    external_forms,
    location,
    category,
    banner,
    isAcceptingVolunteerRegistrations,
    isTeamEvent,
    key_persons,

    maxCapacity,

  } = req.body;

  try {

    //@ts-ignore
    const _user = req.user;

    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new ForbiddenError("Invalid session : Please login again"));
    }

    // Find the event to update
    const event = await Event.findById(id);
    if (!event) {
      return next(new NotFoundError("Event not found"));
    }

    // Ensure user is authorized to update the event
    if (!event.admin.equals(user._id)) {
      return next(new ForbiddenError("Not enough permissions"));
    }

    // Update fields if provided in the request body
    if (name) event.name = name;
    if (description) event.description = description;
    if (dateTime) event.dateTime = dateTime;
    if (location) event.location = location;
    if (banner) event.banner = banner;
    if (category) event.category = category;
    if (key_persons) event.key_persons = key_persons;
    if (isAcceptingVolunteerRegistrations !== undefined)
      event.isAcceptingVolunteerRegistrations =
        isAcceptingVolunteerRegistrations;
    if (isTeamEvent !== undefined) event.isTeamEvent = isTeamEvent;

    if (maxCapacity) event.maxCapacity = maxCapacity;
    // if (registrationForm) event.registrationForm = registrationForm;
    if (external_forms) event.external_forms = external_forms;
    if(organizer){
      event.organizer = organizer
    }
    // Save the updated event
    await event.save();

    res.status(200).json({
      success: true,
      message: "Event updated successfully.",
    });
  } catch (error) {
    console.error("Error in PUT /events/:id:", error);
    return next(
      new InternalServerError("Some error occurred. Please try again later.")
    );
  }
};
// export const addRegistrationForm
export const getRegistrations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {event_id, page,search} = req.query;
  const skip = (parseInt((page as string) || "1") - 1) * 10;

  // Validate query params
  if (!event_id) {
    return next(new BadRequestError("Bad request"));
  }

  try {
    //@ts-ignore
    //@ts-ignore
    const _user = req.user;

    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new UnauthorizedError("Invalid session please login again"));
    }

    // Validate event and admin authorization
    const event = await Event.findById(event_id);
    if (!event) {
      return next(new NotFoundError("Event not found"));
    }

    if (!event.admin.equals(user._id)) {
      return next(new ForbiddenError("Don't have enough permissions"));
    }

    // Fetch event registrations
    const registrations = await EventRegistration.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {

        $match: {
          event: event._id,
          status: "completed",
          $or: [
            { "user.email": { $regex: search, $options: 'i' } }, // Case-insensitive search in email
            { "user.name": { $regex: search, $options: 'i' } },  // Case-insensitive search in name
           
          ]
        },
      },
     
    
      {
        $project: {
          user: {
            name: 1,
           email: 1,
            username: 1,
          },
          _id:1,
          updatedAt: 1,
          
        },
      },
      { $skip: skip },
      { $limit: 10 },
    ]);

    const total = await EventRegistration.find({
      event: event_id,
      isAccepted: false,
    }).countDocuments();

    res.status(200).json({
      success: true,
      registrations,
      total,
    });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return next(new InternalServerError("Some error occured"));
  }
};

export const verifyPass = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //@ts-ignore
  //@ts-ignore
  const _user = req.user;
  const { passId } = req.body;
  try {
    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new ForbiddenError("Invalid session,please login again"));
    }
    const clubMember = await ClubMember.findOne({
      userId: user._id,
    });
    if (!clubMember) {
      return next(new ForbiddenError("You don't have permission"));
    }
    const registration = await EventRegistration.findById(passId);
    if (!registration) {
      return next(new NotFoundError("No registration found"));
    }
    registration.entry_status = "yes";
    await registration.save();
    res.status(200).json({
      success: true,
      message: "Participant entered the event",
    });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const fetchFeedbacks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //@ts-ignore
  //@ts-ignore
  const _user = req.user;
  let { page, eid:event_id } = req.query;
  try {
    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new ForbiddenError("Invalid session , Please login again"));
    }

    const feedbacks = await EventFeedback.aggregate([
      {
        $match: {
          event: event_id,
        },
      },
      {
        $lookup: {
          from: "users",
          as: "user",
          foreignField: "_id",
          localField: "user",
        },
      },
      {
        $project: {
          user: {
            name: 1,
            email: 1,
          },
          rating: 1,
          feedback: 1,
        },
      },
    ]);
    res.status(200).json({ success: true, feedbacks });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const getAnalytics = async(req:Request,res:Response,next:NextFunction)=>{
  //@ts-ignore
  const _user = req.user;
  const {eid} = req.query;
  try {
    const user = await User.findById(_user.userId);
    if(!user){
      return next(new ForbiddenError("Invalid session, please login again"))
    }
    const event = await Event.findById(eid);
    if(!event){
      return next(new BadRequestError("No such event exists"));
    }
    if(!event.admin.equals(user._id)){
      return next(new ForbiddenError("You don't have permissions"));
    }
    const analytics = await Event.aggregate([
      {
        $match:{
          _id:event._id,

        }
      },
      {
        $lookup:{
          from:"eventregistrations",
          as:"impressions",
          let: { event_id: "$_id" },
          pipeline:[
            {
              $match:{
                $expr:{
                  $and:[
                    {$eq:["$event","$$event_id"]}
                  ]
                }
              }
            }
          ]
        }
      },
      {
        $unwind:{path:"$impressions",preserveNullAndEmptyArrays:true}
      },
      {
        $group: {
          _id:"$_id", 
          totalImpressions: { $sum: 1 },
          totalRegistrations: {
            $sum: { $cond: [{ $eq: ["$impressions.status", "completed"] }, 1, 0] } 
          }
        }
      },
      {
        $lookup:{
          from:'eventregistrations',
          as:'recentRegistrations',
          let:{event_id:"$_id"},
          pipeline:[
            {
              $match:{
                $expr:{
                  $eq:["$event","$$event_id"]
                }
              }
            },
            { $sort:{createdAt:-1},
             
             
            },
            { $limit:5},
            {
              $lookup: {
                from: 'users', 
                localField: 'user',
                foreignField: '_id',
                as: 'userDetails'
              }
            },
            {
              $unwind: {
                path: '$userDetails',
               preserveNullAndEmptyArrays:true
              }
            },
            {
              $project: {
                _id: 1,
                user: {
                  username:"$userDetails.username",
                  name:"$userDetails.name",
                  email:"$userDetails.email"
                }, 
               
                updatedAt: 1
              }
            }
          ]
        }
      },
     {
      $lookup:{
        from:'forms',
        as:'forms',
        let:{eventId:"$_id"},
      pipeline:[
        {$match:{
          $expr:{
            $eq:["$event","$$eventId"]
          }
        }},
        {$lookup:{
          from:"formsubmissions",
          as:"submissions",
          localField:"_id",
          foreignField:"formId"
        }},
        {$project:{
          formName:1,
          enabled:1,
          responseCount:{$size:"$submissions"},
          _id:1
        }}
      ]
      },
     },
      {
        $project:{
         totalImpressions:1,
          totalRegistrations:1,
          recentRegistrations:1,
          totalForms:{$size:"$forms"},
          forms:{
            formName:1,
            _id:1,
            responseCount:1,
            enabled:1
          }
        }
      }
    ])
    res.status(200).json({
      success:true,analytics:analytics[0]
    })
  } catch (error) {
    console.log(error);
    return next(new InternalServerError("Some error occured"));
  }
}