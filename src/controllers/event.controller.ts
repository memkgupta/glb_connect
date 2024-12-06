import { BadRequestError } from "@errors/BadRequestError";
import { ForbiddenError } from "@errors/ForbiddenError";
import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import Club from "@models/club/club.model";
import { Event, EventRegistration } from "@models/event.model";
import User from "@models/user.model";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

export const getEvents = async(req:Request,res:Response,next:NextFunction)=>{
    try {
      
    
        const { page = 1 } = req.query; // Default page is 1 if not provided
       
        const _user = req.user;
    
        if (!_user) {
          return next(new UnauthorizedError("Please login first"));
        }
    
        // Find the logged-in user
        const user = await User.findById(_user.userId);
        if (!user) {
          return next(new ForbiddenError("Invalid session : Please Login Again"));
        }
    
        // Find the club associated with the admin user
        const club = await Club.findOne({ admin: user._id });
        if (!club) {
          return next(new BadRequestError("Bad request"));
        }
    
        // Pagination setup
        const skip = (parseInt(page as string) - 1) * 10;
    
        // Aggregate events data
        const events = await Event.aggregate([
          {
            $match: {
              club: club._id,
            },
          },
          {
            $lookup: {
              from: 'event_registrations',
              localField: '_id',
              foreignField: 'event',
              as: 'registrations',
            },
          },
          {
            $project: {
              dateTime: 1,
              name: 1,
              brief_description: { $substr: ['$description', 0, 100] },
              location: 1,
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
              club: club._id,
            },
          },
          {
            $count: 'totalResults',
          },
        ]);
    
         res.status(200).json({
          success: true,
          events,
          totalResults: totalResults[0]?.totalResults || 0,
        });
      } catch (error) {
        console.error('GET /events error:', error);
        return next(new InternalServerError("Some error occured"));
      }
}
export const getEventDashboardById = async(req:Request,res:Response,next:NextFunction)=>{
    const { id } = req.params;

    try {
     
  
      const _user = req.user;
      // Validate user session
      const user = await User.findById(_user.userId);
      if (!user) {
        return next(new ForbiddenError("Invalid session : Please Login Again"))
      }
  
      // Check if the event exists
      const event = await Event.findById(id);
      if (!event) {
        return next(new NotFoundError("Event not found "))
      }
  
      // Ensure the user is authorized to access this event
      if (!event.admin.equals(user._id)) {
        return next(new ForbiddenError("Not Enough Permissions"))
      }
  
      // Aggregate data with additional club details
      const eventData = await Event.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(id) },
        },
        {
          $lookup: {
            from: 'clubs',
            localField: 'club',
            foreignField: '_id',
            as: 'clubDetails',
          },
        },
        {
          $unwind: '$clubDetails',
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
            maxCapacity: 1,
            clubDetails: {
              clubLogo: 1,
              _id: 1,
              clubName: 1,
            },
          },
        },
      ]);
  
      // Return event data
      res.status(200).json({
        success: true,
        data: eventData[0],
      });
    } catch (error) {
      console.error('Error in GET /events/:id:', error);
      return next(new InternalServerError("Some error occured"));
    }
}
export const updateEvent = async(req:Request,res:Response,next:NextFunction)=>{
    const { id } = req.params;
  const {
    name,
    description,
    dateTime,
    forms,
    location,
    category,
    banner,
    isAcceptingVolunteerRegistrations,
    isTeamEvent,
    maxTeamSize,
    maxCapacity,
    registrationForm,
  } = req.body;

  try {
    const _user = req.user;

    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new ForbiddenError("Invalid session : Please login again"))
    }

    // Find the event to update
    const event = await Event.findById(id);
    if (!event) {
      return next(new NotFoundError("Event not found"))
    }

    // Ensure user is authorized to update the event
    if (!event.admin.equals(user._id)) {
      return next(new ForbiddenError("Not enough permissions"))
    }

    // Update fields if provided in the request body
    if (name) event.name = name;
    if (description) event.description = description;
    if (dateTime) event.dateTime = dateTime;
    if (location) event.location = location;
    if (banner) event.banner = banner;
    if (category) event.category = category;
    if (isAcceptingVolunteerRegistrations !== undefined)
      event.isAcceptingVolunteerRegistrations = isAcceptingVolunteerRegistrations;
    if (isTeamEvent !== undefined) event.isTeamEvent = isTeamEvent;
    if (maxTeamSize) event.maxTeamSize = maxTeamSize;
    if (maxCapacity) event.maxCapacity = maxCapacity;
    if (registrationForm) event.registrationForm = registrationForm;
    if (forms) event.forms = forms;

    // Save the updated event
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
    });
  } catch (error) {
    console.error('Error in PUT /events/:id:', error);
    return next(new InternalServerError('Some error occurred. Please try again later.'));
  }
}
export const addEvent = async(req:Request,res:Response,next:NextFunction)=>{
    const {
        clubId,
        name,
        description,
        dateTime,
        location,
        category,
        creationTimestamp,
        forms,
        banner,
        participantsFromOutsideAllowed,
        maxCapacity,
        venue,
        isTeamEvent,
        maxTeamSize,
        isAcceptingVolunteerRegistrations,
      } = req.body;
    
      try {
    
        const _user = req.user;
       
    
        // Validate user session
        const user = await User.findById(_user.userId);
        if (!user) {
          return next(new UnauthorizedError("Please Login Again"));
        }
    
        // Validate club
        const club = await Club.findById(clubId);
        if (!club) {
          return next(new BadRequestError("Club not found"))
        }
    
        // Authorization check
        if (!club.admin.equals(user._id)) {
          return next(new ForbiddenError("Don't have enough permissions"))
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
          creationTimestamp: creationTimestamp || new Date(),
          category,
          club: club._id,
          college: club.college,
          participantsFromOutsideAllowed,
          maxTeamSize,
          isTeamEvent,
          isAcceptingVolunteerRegistrations,
        });
    
        res.status(201).json({
          success: true,
          message: 'Event created successfully.',
          id: event._id,
        });
      } catch (error) {
        console.error('Error creating event:', error);
        return next(new InternalServerError("Some error occured"))
      }
}
export const getRegistrations = async(req:Request,res:Response,next:NextFunction)=>{
    const { event_id, page } = req.query;
    const skip = (parseInt(page as string || '1') - 1) * 10;
  
    // Validate query params
    if (!event_id) {
      return next(new BadRequestError("Bad request"))
    }
  
    try {
    
      const _user = req.user;
 
      const user = await User.findById(_user.userId);
      if (!user) {
        return next(new UnauthorizedError("Invalid session please login again"))      }
      
  
      // Validate event and admin authorization
      const event = await Event.findById(event_id);
      if (!event) {
        return next(new NotFoundError("Event not found"));
      }
  
      if (!event.admin.equals(user._id)) {
        return next(new ForbiddenError("Don't have enough permissions"))
      }
  
      // Fetch event registrations
      const registrations = await EventRegistration.aggregate([
        {
          $match: {
            event: event._id,
            isAccepted: false,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
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
      console.error('Error fetching registrations:', error);
      return next(new InternalServerError("Some error occured"));
    }
}