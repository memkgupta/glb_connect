import { BadRequestError } from "@errors/BadRequestError";
import { ForbiddenError } from "@errors/ForbiddenError";
import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";

import {Event, EventAssignment, EventRegistration,} from "@models/event.model";


import { NextFunction, Request, response, Response } from "express";
import { PipelineStage } from "mongoose";




export const getEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
    const queryParams = req.query;
    const page = parseInt(queryParams.page as string) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
  
    let matchStage: any = {
      isPublished:true
    };
  
    // Basic filters
    if (queryParams.location) {
      matchStage["basicDetails.venue"] = queryParams.location;
    }
    if (queryParams.category && queryParams.category !== "all") {
      matchStage["basicDetails.category"] = queryParams.category;
    }
    if (queryParams.keyword) {
      matchStage["basicDetails.title"]= { $regex: queryParams.keyword, $options: "i" };
    }
  
    // Date range filters
    if (queryParams.happening) {
      const now = new Date();
      let startDate = now;
      let endDate = now;
  
      switch (queryParams.happening) {
        case "this-week":
          startDate = getWeekStart(now);
          endDate = getWeekEnd(now);
          break;
        case "this-month":
          startDate = getMonthStart(now);
          endDate = getMonthEnd(now);
          break;
        case "this-year":
          startDate = getYearStart(now);
          endDate = getYearEnd(now);
          break;
      }
  
      matchStage["basicDetails.startDate"]={$gte:startDate,$lte:endDate}
      console.log({$gte:startDate,$lte:endDate})
    }

    try {
      console.log("Yo oY")
      const pipeline:PipelineStage[] = [
        { $match: matchStage },
        
        {
          $lookup: {
            from: "clubs",
            localField: "club",
            foreignField: "_id",
            as: "club",
          },
        },
        { $unwind: {path:"$club",preserveNullAndEmptyArrays:true} },
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
            basicDetails:{
                title:1,
                startDate:1,
                brief_description: { $substr: ["$basicDetails.description", 0, 100] },
                venue:1,
                category:1,
                participantsFromOutsideAllowed: 1,
                maxParticipants:1,

            },
          
            
            
            club: {
              clubLogo: 1,
              clubName: 1,
            },
  
            totalRegistrations: { $size: "$registrations" },
          },
        },
        {
          $sort: { totalRegistrations: -1 },
        },
        {
          $facet: {
            data: [
              { $skip: skip },
              { $limit: limit },
            ],
            totalCount: [{ $count: "count" }],
          },
        },
      ];
  console.log(pipeline)
      const result = await Event.aggregate(pipeline);
      const events = result[0]?.data || [];
      const total = result[0]?.totalCount[0]?.count || 0;
  
      res.status(200).json({
        success: true,
        events,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.log(error);
      return next(new InternalServerError("Some error occurred"));
    }
};
export const getEventById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const _user = req.user;
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
          path: "$clubDetails",preserveNullAndEmptyArrays:true
        },
      },

      {
        $project: {
          _id:1,
         basicDetails:1,
         monetaryDetails:1,
         eventStructure:1,
         organiserDetails:1,
         banner:1,
         gallery:1,
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
    let registration = null;
   
    if(_user)
    {
    
      registration    = await EventRegistration.findOne({
        user:_user._id,
        event:event[0]._id
      })
    }
    let assignments:any = []
    if(registration)
    {
       assignments = await EventAssignment.find(
          {
            event:event[0]._id,
          }
      )
    }
    res.status(200).json({
      success: true,
      data: event[0],
      registered: registration?._id || "null",
      assignments:assignments
    });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
};


// Helper function to get the start of the week (Sunday)
function getWeekStart(date: Date) {
  const now = new Date(); // Current date
  const dayOfWeek = now.getDay(); // Day of the week (0 = Sunday, 6 = Saturday)
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust if week starts on Monday
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - diff); // Subtract days to get Monday
  startOfWeek.setHours(0, 0, 0, 0); // Set time to start of day
  return startOfWeek;
}

// Helper function to get the end of the week (Saturday)
function getWeekEnd(date: Date) {
  const now = new Date(); // Current date
  const dayOfWeek = now.getDay(); // Day of the week (0 = Sunday, 6 = Saturday)
  const diff = dayOfWeek === 0 ? 0 : 7 - dayOfWeek; // Days remaining until Sunday
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