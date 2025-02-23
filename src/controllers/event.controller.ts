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
import { NextFunction, Request, response, Response } from "express";
import mongoose from "mongoose";
import { date } from "zod";
import { sendEventRegistrationEmail } from "../helpers/mail";
import ClubMember from "@models/club/club.members";
import { profile } from "console";

export const getEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
  let matchStage: any = {};
  if (queryParams.location) {
    matchStage.location = queryParams.location;
  }
  if (queryParams.category && queryParams.category != "all") {
    matchStage.category = queryParams.category;
  }

  if (queryParams.keyword) {
    matchStage.name = { $regex: queryParams.keyword, $options: "i" };
  }

  var startDate = new Date();
  var endDate = new Date();
  if (queryParams.happening) {
    const h = queryParams.happening;
    if (h === "this-week") {
      startDate = getWeekStart(startDate)
      endDate = getWeekEnd(endDate);
    }
    if (h === "this-month") {
      startDate = getMonthStart(startDate);
      endDate = getMonthEnd(endDate);
    }
    if (h === "this-year") {
      startDate = getYearStart(startDate);
      endDate = getYearEnd(endDate);
    }
    matchStage.dateTime = {
      $gte: startDate,
      $lte: endDate,
      
    };
  }
  console.log(matchStage.dateTime)
  const skip = (page - 1) * 20;
  try {
    const events = await Event.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "colleges",
          foreignField: "_id",
          localField: "college",
          as: "college",
        },
      },
      {
        $lookup: {
          from: "clubs",
          foreignField: "_id",
          localField: "club",
          as: "club",
        },
      },
      {
        $unwind: {
          path: "$club",
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
          brief_description: { $substr: ["$description", 0, 100] },
          location: 1,
          category: 1,
          participantsFromOutsideAllowed: 1,
          maxCapacity: 1,
          club: {
            clubLogo: 1,
            clubName: 1,
          },
          college: {
            name: 1,
          },
          totalRegistrations: { $size: "$registrations" },
        },
      },
      {
        $sort: { totalRegistrations: -1 },
      },
      { $skip: skip },
      { $limit: 10 },
    ]);
    const totalResults = await Event.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "colleges",
          foreignField: "_id",
          localField: "college",
          as: "college",
        },
      },

      {
        $count: "totalResults",
      },
    ]);
    res
      .status(200)
      .json({ success: true, events: events, total: totalResults });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const getEventDashboardById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const role = req.query.role;
  try {
  
    // Check if the event exists
    const event = await Event.findById(id);
    if (!event) {
      return next(new NotFoundError("Event not found "));
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
        $lookup: {
          from: "forms",
          localField: "_id",
          foreignField: "event",
          as: "forms",
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

          external_forms: 1,
          maxCapacity: 1,
          forms: {
            _id: 1,
            formName: 1,
          },
          clubDetails: {
            clubLogo: 1,
            _id: 1,
            clubName: 1,
          },
        },
      },
    ]);
    console.log(eventData);
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



export const getEventById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const e = await Event.findById(id);
    if (!e) {
      return next(new NotFoundError("Event not found"));
    }
    const event = await Event.aggregate([
      {
        $match: { _id: e._id },
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
        $lookup: {
          from: "forms",
          localField: "_id",
          foreignField: "event",
          as: "forms",
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

          external_forms: 1,
          maxCapacity: 1,
          forms: {
            _id: 1,
            formName: 1,
          },
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

    res.status(200).json({
      success: true,
      data: event[0],
      registered: null,
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
    const event = await Event.findById(registration.event)
    const form = await Form.findOne({
      event: event?._id,
      type: "registration",
    });
    const formSubmission = await FormSubmission.create({
      formId: form?._id,
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
    res.status(200).json({
      success: true,
      message: "Registration successfull",
      id: registration._id,
    });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
};




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
    if (!registration ||registration.entry_status!=="yes") {
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

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Helper function to get the start of the week (Sunday)
function getWeekStart(date: Date) {
  const now = new Date(); // Current date
  const dayOfWeek = now.getDay(); // Day of the week (0 = Sunday, 6 = Saturday)
  const diff = (dayOfWeek === 0 ? 6 : dayOfWeek - 1); // Adjust if week starts on Monday
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - diff); // Subtract days to get Monday
  startOfWeek.setHours(0, 0, 0, 0); // Set time to start of day
  return startOfWeek;
}

// Helper function to get the end of the week (Saturday)
function getWeekEnd(date: Date) {
  const now = new Date(); // Current date
  const dayOfWeek = now.getDay(); // Day of the week (0 = Sunday, 6 = Saturday)
  const diff = (dayOfWeek === 0 ? 0 : 7 - dayOfWeek); // Days remaining until Sunday
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + diff); // Add days to get Sunday
  endOfWeek.setHours(23, 59, 59, 999); // Set time to end of the day
  return endOfWeek;
}

// Helper function to get the start of the month
function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Helper function to get the end of the month
function getMonthEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999); // Last day of the current month
}

// Helper function to get the start of the year
function getYearStart(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

// Helper function to get the end of the year
function getYearEnd(date: Date) {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999); // Last day of the current year
}

export const getForm = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //@ts-ignore
  const _user = req.user;
  const { rid,fid } = req.query;
  try {
    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new ForbiddenError("Invalid session , please login again"));
    }
    const registration = await EventRegistration.findById(rid);
    if (!registration) {
      return next(new BadRequestError("No registration found"));
    }
    // registration.ev
    const form = await Form.findOne({
      event:registration.event,
      type:'registration'
    })
    if(!form || !form.enabled){
      return next(new NotFoundError("No such form exists"))
    }
    if(form.type!="registration" && registration.status!="completed"){
return next(new ForbiddenError("Please complete your registration"))
    }
    res.status(200).json({ success: true, fields: form?.fields });
  } catch (error) {
    console.log(error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const isRegistered = async(req:Request,res:Response,next:NextFunction)=>{
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
    user:user._id,
    event:eventId,
    
   })
   // console.log(registration)
   if (!registration) {
     res
       .status(200)
       .json({
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
       createdAt:registration.createdAt
     },
   });
 } catch (error) {
   console.error(error);
   return next(new InternalServerError("Some error occured"));
 }
}
export const getRegistrationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //@ts-ignore
  const _user = req.user;
  const regId = req.query.rid;
  // console.log(eventId);
  try {
    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new BadRequestError("Invalid session"));
    }
    
    const registration = await EventRegistration.findById(regId)
    // console.log(registration)
    if (!registration) {
      res
        .status(200)
        .json({
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
        createdAt:registration.createdAt
      },
    });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
};

