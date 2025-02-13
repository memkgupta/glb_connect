import { InternalServerError } from "@errors/InternalServerError";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { Event } from "@models/event.model";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

export const getEvents = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { page = 1,club_id } = req.query; // Default page is 1 if not provided
 
  
      // Find the club associated with the admin user
 
  
      // Pagination setup
      const skip = (parseInt(page as string) - 1) * 10;
  
      // Aggregate events data
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
            brief_description: { $substr: ["$description", 0, 100] },
            location: 1,
            status:{$cond:{
              "if":{"$gte":["$dateTime",new Date()]},
              "then":"Upcoming",
              "else":"Completed"
            }},
            category: 1,
            participantsFromOutsideAllowed: 1,
            maxCapacity: 1,
          },
        },
        { $skip: skip },
        { $limit: 10 },
      ]);
  
      // Count total results
      const totalResults = await Event.aggregate([
        {
          $match: {
            club: new mongoose.Types.ObjectId(club_id as string),
          },
        },
        {
          $count: "totalResults",
        },
      ]);
  
      res.status(200).json({
        success: true,
        events,
        totalResults: totalResults[0]?.totalResults || 0,
      });
    } catch (error) {
      console.error("GET /events error:", error);
      return next(new InternalServerError("Some error occured"));
    }
  };

// export const getEvent
  