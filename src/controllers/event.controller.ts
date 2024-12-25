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
import { AddFormBody, FormField } from "../@types/index";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { date } from "zod";
import { sendEventRegistrationEmail } from "../helpers/mail";
import ClubMember from "@models/club/club.members";

export const getEvents = async(req:Request,res:Response,next:NextFunction)=>{
  const queryParams = req.query;
//   const queryParams = {
//     happening:searchParams.get('happening'),
//     location:searchParams.get('location'),
//     category:searchParams.get('category'),
//     college:searchParams.get('college'),
//     keyword:searchParams.get('keyword'),
//     page : parseInt(searchParams.get('page')||'1'),
//     id:searchParams.get('id'),
// } 
const page = parseInt(req.query.page as string) || 1;
let matchStage:any = {
        
};
if(queryParams.location){
matchStage.location = queryParams.location
}
if(queryParams.category && queryParams.category!="all"){
matchStage.category = queryParams.category
}

if(queryParams.keyword){
matchStage.name = {$regex:queryParams.keyword,$options:'i'}
}

var startDate = new Date();
var endDate = new Date();
if(queryParams.happening){

const h = queryParams.happening;
if(h==="this-week"){
  
   endDate = getWeekEnd(endDate);
 
}
if(h==="this-month"){
    startDate = getMonthStart(startDate);
    endDate = getMonthEnd(endDate);

}
if(h==="this-year"){
    startDate = getYearStart(startDate)
    endDate = getYearEnd(endDate)
   
}
matchStage.dateTime={
    $gte:startDate,
    $lte:endDate
}

}
const skip = (page-1)*20;
try {
  const events = await Event.aggregate([
      
    {$match:matchStage},
     {
        $lookup:{
        from:'colleges',
        foreignField:'_id',
        localField:'college',
        as:'college',
     }
    },
    {
        $lookup:{
        from:'clubs',
        foreignField:'_id',
        localField:'club',
        as:'club',
     }
    },
    {$unwind:{
        path:'$club'
    }},
    {$lookup:{
        from:'event_registrations',
        localField:'_id',
        foreignField:'event',
        as:'registrations'
    }},
    {$project:{
        dateTime:1,
        name:1,
        brief_description:{$substr:["$description", 0, 100]},
        location:1,
        category:1,
        participantsFromOutsideAllowed:1,
        maxCapacity:1,
        club:{
            clubLogo:1,
            clubName:1,
        },
        college:{
            name:1
        },
        totalRegistrations:{$size:"$registrations"}
    }},
    {
        $sort:{'totalRegistrations':-1}
    },
    {$skip:skip},
    {$limit:10}
])
const totalResults = await Event.aggregate([
  
    {$match:matchStage},
     {
        $lookup:{
        from:'colleges',
        foreignField:'_id',
        localField:'college',
        as:'college',
     }
    },
    
    {
        $count:'totalResults'
    }
])
res.status(200).json({success:true,events:events,total:totalResults})
} catch (error) {
  console.error(error);
  return next(new InternalServerError("Some error occured"))
}
}
export const getEventDashboardById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
   //@ts-ignore
       //@ts-ignore
        const _user = req.user;
    // Validate user session
    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new ForbiddenError("Invalid session : Please Login Again"));
    }

    // Check if the event exists
    const event = await Event.findById(id);
    if (!event) {
      return next(new NotFoundError("Event not found "));
    }

    // Ensure the user is authorized to access this event
    if (!event.admin.equals(user._id)) {
      return next(new ForbiddenError("Not Enough Permissions"));
    }

    // Aggregate data with additional club details
    const eventData = await Event.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: "clubs",
          localField: "club",
          foreignField: "_id",
          as: "clubDetails",
        },
      },
      {
        $unwind: "$clubDetails",
      },
      {
        $project: {
          name: 1,
          description: 1,
          dateTime: 1,
          location: 1,
          category: 1,
          banner: 1,
          venue: 1,
          forms: 1,
          external_forms:1,
          maxCapacity: 1,
          clubDetails: {
            clubLogo: 1,
            _id: 1,
            clubName: 1,
          },
        },
      },
    ]);
console.log(eventData)
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
    forms,
    external_forms,
    location,
    category,
    banner,
    isAcceptingVolunteerRegistrations,
    isTeamEvent,
    key_persons,
    maxTeamSize,
    maxCapacity,
    registrationForm,
  } = req.body;

  try {
   //@ts-ignore
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
    if (registrationForm) event.registrationForm = registrationForm;
    if (external_forms) event.external_forms = external_forms;
console.log(external_forms)
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
      // college: club.college,
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
export const getRegistrations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { event_id, page } = req.query;
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
        $match: {
          event: event._id,
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
        $project: {
          user: {
            name: 1,
            profile: 1,
            username: 1,
          },
          registrationType: 1,
          resume: 1,
          createdAt: 1,
          applicationNote: 1,
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
export const getEventById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const event = await Event.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: "clubs",
          localField: "club",
          foreignField: "_id",
          as: "clubDetails",
        },
      },
      {
        $unwind: {
          path: "$clubDetails",
        },
      },

      {
        $project: {
          name: 1,
          description: 1,
          dateTime: 1,
          location: 1,
          category: 1,
          banner: 1,
          forms: 1,
          external_forms:1,
          maxCapacity: 1,
          clubDetails: {
            clubLogo: 1,
            _id: 1,
            clubName: 1,
          },
        },
      },
    ]);
    if (!event || event.length == 0) {
      return next(new NotFoundError("Event not found"));
    }
    let registration;
    //@ts-ignore
    if(req.user){
      registration = await EventRegistration.findOne({
        id:id,
        //@ts-ignore
        user:req.user.userId
      })
    }
    
    res.status(200).json({
      success: true,
      data: event[0],
      registered:registration?registration._id:null
    });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const registerForEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
 //@ts-ignore
       //@ts-ignore
        const _user = req.user;
  const { event_id } = req.body;
  try {
    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new ForbiddenError("Invalid session, please login again"));
    }
    const event = await Event.findOne({
      _id: event_id,
      usingInternalRegistration: true,
    });
    if (!event) {
      return next(new BadRequestError("No such event exists"));
    }
    const registrationsTotal = await EventRegistration.find({
      event: event._id,
      rsvp_status: "accepted",
      status: "completed",
    }).countDocuments();
    if (registrationsTotal >= event.maxCapacity) {
      res.status(200).json({
        success: false,
        message: "Registrations full",
      });
    }
    const registrationExists = await EventRegistration.find({
      user: user._id,
      event_id: event._id,
    });
    if (registrationExists.length > 0) {
      return next(new BadRequestError("Already registered"));
    }
    const registration = await EventRegistration.create({
      user: user._id,
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
export const fillRegistrationForm = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
 //@ts-ignore
       //@ts-ignore
        const _user = req.user;
  const { registrationId, formData } = req.body;
  try {
    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new ForbiddenError("Invalid session , please login again"));
    }
    const registration = await EventRegistration.findById(
      registrationId
    ).populate("event");

    if (!registration) {
      return next(new BadRequestError("Event registration not exists"));
    }
    const event = await Event.findById(registration.event);
    const formSubmission = await FormSubmission.create({
      formId: event!.registrationForm,
      studentId: user._id,
      submissionData: formData,
      submittedAt: new Date(),
    });
    registration.status = "completed";
    registration.formSubmission = formSubmission._id;
    await registration.save();
    await sendEventRegistrationEmail(user.email, user.name, {
      eventDate: event!.dateTime,
      eventName: event!.name,
      venue: event!.venue,
    });
    res
      .status(200)
      .json({
        success: true,
        message: "Registration successfull",
        id: registration._id,
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
       //@ts-ignore
        const _user = req.user;
  const body: AddFormBody = req.body;
  try {
    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new ForbiddenError("Invalid session , please login again"));
    }
    const event = await Event.findById(body.event);
    if (!event || event.admin != user._id) {
      return next(new ForbiddenError("Unauthorized to perform this action"));
    }
    const form = await Form.create({
      formName: body.formName,
      fields: body.fields,
      createdAt: new Date(),
    });
    event.registrationForm = form._id;
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
export const updateForm = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
 //@ts-ignore
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

    if (body.fields) {
      body.fields.forEach((field: FormField, index: number) => {
        const filterKey = `field${index}`;

        arrayFilters.push({ [`${filterKey}.fieldLabel`]: field.fieldLabel });
        Object.entries(field).forEach(([key, value]) => {
          updateObject[`fields.$[${filterKey}].${key}`] = value;
        });
      });
    }
    const result = await Form.updateOne(
      { _id: formId },
      { $set: updateObject },
      { arrayFilters }
    );
    res.status(200).json({
      success: true,
      message: "Form updated successfully",
    });
  } catch (error) {
    console.error(error);
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
    userId:user._id,
  });
  if(!clubMember){
    return next(new ForbiddenError("You don't have permission"));
  }
  const registration = await EventRegistration.findById(passId);
  if(!registration){
    return next(new NotFoundError("No registration found"));
  }
  registration.entry_status = 'yes'
  await registration.save();
  res.status(200).json({
    success:true,message:"Participant entered the event"
  });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const viewRegistrationById = async(req:Request,res:Response,next:NextFunction)=>{
  //@ts-ignore
const _user = req.user;
const {registration_id} = req.body;
try {
  const user = await User.findById(_user.userId);
if(!user)
{
  return next(new ForbiddenError("Invalid session, please login again"));
}
const registration = await EventRegistration.aggregate([
  {$match:{
    _id:registration_id,
  }},
  {
    $lookup:{
      from:'events',
      as:'event',
      localField:'event',
      foreignField:'_id'
    }
  },
  {
    $lookup:{
      from:'users',
      as:'user',
      localField:'user',
      foreignField:'_id'
    }
  },
  {
    $lookup:{
      from:'formsubmissions',
      as:'submission',
      localField:'formSubmission',
      foreignField:'_id'
    }
  },
  {
    $project:{
      event:{
        banner:1,
        name:1,
        description:1,
        dateTime:1
      },
      submission:{
        submissionData:1
      },
      applicationNote:1,
      status:1,
      registrationTimeStamp:1,

    }
  }
])
if(!registration || registration.length<1){
  return next(new NotFoundError("Registration not found"));
}
res.status(200).json({
  success:true,
  data:registration[0]
});
} catch (error) {
  console.error(error);
  return next(new InternalServerError("Some error occured"))
}
}
export const giveFeedback = async(req:Request,res:Response,next:NextFunction)=>{
  //@ts-ignore
const _user = req.user;
const {feedback_msg,rating,event_id} = req.body;
try {
  const user = await User.findById(_user.userId);
  if(!user)
  {
    return next(new ForbiddenError("Invalid session,Please login again"))
  }
  const registration = await EventRegistration.findOne({
    user:user._id,
    event:event_id
  });
  if(!registration)
  {
    return next(new ForbiddenError("You can't give feedback for the event"))
  }
  let feedback = await EventFeedback.findOne({
    user:user._id,
    event:event_id
  })
 if(feedback){
res.status(200).json({success:false,message:"Already gave your feedback"})
 }
 else{
    feedback = await EventFeedback.create({
      event:event_id,
      user:user._id,
      rating:rating,
      feedback:feedback_msg
    });
  }
res.status(200).json({success:true,message:"Your feedback was submitted"})
} catch (error) {
  console.error(error);
  return next(new InternalServerError("Some error occured"));
}
}
export const fetchFeedbacks = async(req:Request,res:Response,next:NextFunction)=>{
 //@ts-ignore
       //@ts-ignore
        const _user = req.user;
  let {page,event_id} = req.query;
  try {
    const user = await User.findById(_user.userId);
  if(!user)
  {
    return next(new ForbiddenError("Invalid session , Please login again"));
  }

  const feedbacks = await EventFeedback
  .aggregate([
    {
      $match:{
        event:event_id,
      }
    },
    {
      $lookup:{
        from:'users',
        as:'user',
        foreignField:'_id',
        localField:'user'
      }
    },
    {$project:{
      user:{
        name:1,
        email:1
      },
      rating:1,
      feedback:1
    }}
  ]);
  res.status(200).json({success:true,feedbacks});
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
  
}

function startOfDay(date:Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Helper function to get the start of the week (Sunday)
function getWeekStart(date:Date) {
  const day = date.getDay();
  console.log(day);
  const diff = date.getDate() - day;
  console.log(diff)
 
  return startOfDay(new Date(date.setDate(diff) + 1));

}

// Helper function to get the end of the week (Saturday)
function getWeekEnd(date:Date) {
  const day = date.getDay();
  const diff = 7;
  
  return startOfDay(new Date(date.setDate(diff+1) + 1)); // Adding 1 to include the whole day
  
}

// Helper function to get the start of the month
function getMonthStart(date:Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Helper function to get the end of the month
function getMonthEnd(date:Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999); // Last day of the current month
}

// Helper function to get the start of the year
function getYearStart(date:Date) {
  return new Date(date.getFullYear(), 0, 1);
}

// Helper function to get the end of the year
function getYearEnd(date:Date) {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999); // Last day of the current year
}