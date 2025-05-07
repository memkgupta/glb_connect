import { BadRequestError } from "@errors/BadRequestError";
import { ForbiddenError } from "@errors/ForbiddenError";
import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import Club from "@models/club/club.model";
import { Event, EventFeedback, EventRegistration } from "@models/event.model";
import Form from "@models/form.model";
import FormSubmission from "@models/form.submission.model";
import User from "@models/user.model";
import { AddFormBody, FormField } from "../../@types/index";
import { NextFunction, Request, response, Response } from "express";
import mongoose, { PipelineStage } from "mongoose";
import { date, ZodError } from "zod";
import { sendEventRegistrationEmail } from "../../helpers/mail";
import ClubMember from "@models/club/club.members";
import { profile } from "console";
import { z } from "zod";
import { eventCreationSchema } from "@utils/validators/schemas/event";
import { APIError } from "@errors/APIError";
import { eventCreationBasicDetailsSchema, eventCreationEventStructureSchema, eventCreationMonetoryDetailsSchema, eventCreationOrganiserDetailsSchema } from "@utils/validators/schemas/event";

export const getEventDashboardById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
 
  try {
    const _user = req.user;
    // Check if the event exists
    const event = await Event.findById(id);
    if (!event) {
      return next(new NotFoundError("Event not found "));
    }
    if(!event.owner.equals(_user._id))
    {
      return next(new UnauthorizedError("You are not authorised"));
    }
    // Aggregate data with additional club details
    const eventData = await Event.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) },
      },
    
      {
        $lookup: {
          from: "forms",
          localField: "_id",
          foreignField: "event",
          as: "forms",
        },
      },

    
      // {
      //   $project: {
      //     name: 1,
      //     description: 1,
      //     dateTime: 1,
      //     location: 1,
      //     category: 1,
      //     banner: 1,
      //     venue: 1,

      //     external_forms: 1,
      //     maxCapacity: 1,
      //     forms: {
      //       _id: 1,
      //       formName: 1,
      //     },
      //     clubDetails: {
      //       clubLogo: 1,
      //       _id: 1,
      //       clubName: 1,
      //     },
      //   },
      // },
    ]);
   
    // Return event data
    res.status(200).json({
      success: true,
      data: eventData[0],
    });
  } catch (error) {
    console.error("Error in GET /events/:id:", error);
    return next(new InternalServerError("Some error occured"));
  }
};

export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const _user = req.user;
    const body = req.body;
    const { event_organiser_type, club_id } = req.query;
    console.log(body)
    const parsedData = eventCreationSchema.parse(body);

    const event = new Event(parsedData);
    event.owner = _user._id;
    if (event_organiser_type === "club") {
      event.isClubEvent = true;
      if (!club_id) throw new Error("Club id not provided");
      event.club = new mongoose.Types.ObjectId(club_id as string);
    }
    await event.save();
    res.status(200).json({
      success: true,
      event: event._id,
      message: "Event created Successfully",
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      console.log(error)
      return next(new BadRequestError(error.errors));
    }
    if (error instanceof Error) {
      return next(new BadRequestError(error.message));
    }
    return next(new InternalServerError("Some error occured"));
  }
};
export const updateEventDetails = async(req:Request,res:Response,next:NextFunction)=>{
    try {
      const id = req.params.id;
    const {section} = req.query;
    const body = req.body;

    const event = await Event.findById(id);
    if(!event){
      return next(new NotFoundError("Event not found"));
    }
    let parsedData = null;
    let response = null;
    switch(section){
      case "banner":
        event.banner = body.banner;
        break;
      case "gallery":
        event.gallery = body.gallery;
        break;  
      case "publish":
        event.isPublished = body.isPublished 
        break; 
      case "basic_details":
        parsedData= eventCreationBasicDetailsSchema.parse(body)
     
        event.basicDetails = parsedData
        break;
       case "structure":
        parsedData = eventCreationEventStructureSchema.parse(body)
        event.eventStructure = parsedData as any
        break;
      case "monetary":
        parsedData = eventCreationMonetoryDetailsSchema.parse(body)
        event.monetaryDetails = parsedData as any
        break;
      case "organiser":
        parsedData = eventCreationOrganiserDetailsSchema.parse(body)
        event.organiserDetails = parsedData as any
        break;
      default:
        parsedData = null;   
    }
   
    await event.save();
 res.status(200).json({success:true,message:"Event updated",event:event});
        }
   catch (error:any) {
    if(error.name==="ZodError"){
      return next(new BadRequestError(error.errors))
    }
    if(error instanceof APIError){
      return next(error);
    }
    return next(new InternalServerError("Some error occured"));
  }
}

export const fetchFeedbacks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
 
  const { page = '1', eid: event_id } = req.query;
  const currentPage = parseInt(page as string);
  const limit = 10;
  const skip = (currentPage - 1) * limit;

  try {
    if (!req.user || !req.user.userId) {
      return next(new ForbiddenError("Invalid session, please login again"));
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return next(new ForbiddenError("Invalid session, please login again"));
    }

    const eventObjectId = new mongoose.Types.ObjectId(event_id as string);

    const aggregationPipeline :PipelineStage[]= [
      {
        $match: {
          event: eventObjectId,
        },
      },
      {
        $lookup: {
          from: "users",
          as: "user",
          localField: "user",
          foreignField: "_id",
        },
      },
      { $unwind: "$user" },
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
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const countPipeline = [
      {
        $match: {
          event: eventObjectId,
        },
      },
      { $count: "total" },
    ];

    const [feedbacks, totalCountResult] = await Promise.all([
      EventFeedback.aggregate(aggregationPipeline),
      EventFeedback.aggregate(countPipeline),
    ]);

    const total = totalCountResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      feedbacks,
      total,
      currentPage,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occurred"));
  }
};
export const getAnalytics = async(req:Request,res:Response,next:NextFunction)=>{

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
    if(!event.owner.equals(user._id)){
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
export const getEventRegistrations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { event_id, page = "1", search = "" } = req.query;
  const currentPage = parseInt(page as string, 10) || 1;
  const limit = 10;
  const skip = (currentPage - 1) * limit;

  if (!event_id) {
    return next(new BadRequestError("Missing event_id"));
  }

  try {
    const _user = req.user;
    if (!_user || !_user.userId) {
      return next(new UnauthorizedError("Invalid session. Please login again."));
    }

    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new UnauthorizedError("Invalid session. Please login again."));
    }

    const event = await Event.findById(event_id);
    if (!event) {
      return next(new NotFoundError("Event not found"));
    }

    if (!event.owner.equals(user._id)) {
      return next(new ForbiddenError("You don’t have permission to access this event"));
    }

    const eventObjectId = new mongoose.Types.ObjectId(event_id as string);

    const pipeline:PipelineStage[] = [
      {
        $match: {
          event: eventObjectId,
          status: "completed",
        },
      },
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
          $or: [
            { "user.email": { $regex: search as string, $options: "i" } },
            { "user.name": { $regex: search as string, $options: "i" } },
          ],
        },
      },
      {
        $facet: {
          data: [
            {
              $project: {
                _id: 1,
                updatedAt: 1,
                user: {
                  name: 1,
                  email: 1,
                  username: 1,
                },
              },
            },
            { $skip: skip },
            { $limit: limit },
          ],
          totalCount: [{ $count: "total" }],
        },
      },
    ];

    const result = await EventRegistration.aggregate(pipeline);
    const registrations = result[0]?.data || [];
    const total = result[0]?.totalCount[0]?.total || 0;

    res.status(200).json({
      success: true,
      registrations,
      total,
      currentPage,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return next(new InternalServerError("Some error occurred"));
  }
};
export const getCreatedEvents = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { page = "1", title = "" , category=""} = req.query;
    const currentPage = parseInt(page as string, 10) || 1;
    const limit = 50;
    const skip = (currentPage - 1) * limit;
  
    try {
      const _user = req.user;
  
      if (!_user || !_user._id) {
        return next(new UnauthorizedError("Invalid session, please login again"));
      }
  
      const ownerId = new mongoose.Types.ObjectId(_user._id);
  
      const pipeline = [
        {
          $match: {
            owner: ownerId,
            isRemoved: false,
            ...(title
              ? {
                  "basicDetails.title": {
                    $regex: title as string,
                    $options: "i",
                  },
                }
              : {}),
          },
        },
        {
          $addFields: {
            status: {
              $cond: {
                if: { $gte: ["$basicDetails.startDate", new Date()] },
                then: "Upcoming",
                else: "Completed",
              },
            },
          },
        },
        {
          $facet: {
            data: [
              {
                $project: {
                  _id: 1,
                  basicDetails: {
                    title:1,
                    venue:1,
                    startDate:1,
                    endDate:1,
                    isOnline:1,
                    category:1
                  },
                  isPublished: 1,
                  status: 1,
                },
              },
              { $skip: skip },
              { $limit: limit },
            ],
            totalCount: [{ $count: "total" }],
          },
        },
      ];
  
      const result = await Event.aggregate(pipeline);
      const events = result[0]?.data || [];
      const total = result[0]?.totalCount[0]?.total || 0;
  
      res.status(200).json({
        success: true,
        events,
        total,
        currentPage,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("GET /events error:", error);
      return next(new InternalServerError("Some error occurred"));
    }
  };
 export const attachRegistrationForm = async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const {formId,eventId} = req.body;
    const _user = req.user;
    const event = await Event.findById(eventId);
    if(!event){
      return next(new NotFoundError("Event Not Found"));

    }
    if(!event.owner.equals(_user._id))
    {
      return next(new UnauthorizedError("You are not allowed"))
    }
    const form = await Form.findById(formId);
    if(!form){
      return next(new NotFoundError("Form not found"));
    }
    
    if(event.registrationForm!=null){
      return next(new BadRequestError("Registration form already exists"));
    }
    event.registrationForm = form._id;
    
    await event.save();
    res.status(200).json({success:true,message:"Form attached successfully",})
  } catch (error) {
    console.log(error);
    return next(new InternalServerError("Some error occured"))
  }
 }
 export const togglePublish = async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const {event_id,toggle} = req.body;
    const event = await Event.findById(event_id);
    const _user = req.user;
    if(!event){
      return next(new NotFoundError("Event not found"));
    }
    if(!event.owner.equals(_user._id)){
      return next(new UnauthorizedError("You are not allowed"));
    }
    event.isPublished = toggle;
  } catch (error) {
    
    return next(new InternalServerError("Some error occured"));
  }
 }

