// import { BadRequestError } from "@errors/BadRequestError";
// import { ForbiddenError } from "@errors/ForbiddenError";
// import { InternalServerError } from "@errors/InternalServerError";
// import { NotFoundError } from "@errors/NotFoundError";
// import { UnauthorizedError } from "@errors/UnauthorizedError";
// import ClubMember from "@models/club/club.members";
// import Club from "@models/club/club.model";
// import { Event, EventFeedback, EventRegistration } from "@models/event.model";
// import Form from "@models/form.model";
// import User from "@models/user.model";
// import { NextFunction, Request, Response } from "express";
// import mongoose from "mongoose";
// import { AddFormBody } from "src/@types";




// // export const addEvent = async (
// //   req: Request,
// //   res: Response,
// //   next: NextFunction
// // ) => {
// //   const {
// //     clubId,
// //     name,
// //     description,
// //     dateTime,
// //     location,
// //     category,
// //     creationTimestamp,
// //     forms,
// //     key_persons,
// //     banner,
// //     participantsFromOutsideAllowed,
// //     maxCapacity,
// //     venue,
// //     isTeamEvent,
// //     maxTeamSize,
// //     isAcceptingVolunteerRegistrations,
// //   } = req.body;

// //   try {
// //     //@ts-ignore
// //     const _user = req.user;

// //     // Validate user session
// //     const user = await User.findById(_user.userId);
// //     if (!user) {
// //       return next(new UnauthorizedError("Please Login Again"));
// //     }

// //     // Validate club
// //     const club = await Club.findById(clubId);
// //     if (!club) {
// //       return next(new BadRequestError("Club not found"));
// //     }

// //     // Authorization check
// //     if (!club.admin.equals(user._id)) {
// //       return next(new ForbiddenError("Don't have enough permissions"));
// //     }

// //     // Create event
// //     const event = await Event.create({
// //       name,
// //       admin: club.admin,
// //       banner,
// //       description,
// //       venue,
// //       dateTime,
// //       maxCapacity,
// //       location,
// //       forms,
// //       key_persons: key_persons,
// //       creationTimestamp: creationTimestamp || new Date(),
// //       category,
// //       club: club._id,
// //       participantsFromOutsideAllowed,
// //       maxTeamSize,
// //       isTeamEvent,
// //       isAcceptingVolunteerRegistrations,
// //     });

// //     res.status(201).json({
// //       success: true,
// //       message: "Event created successfully.",
// //       id: event._id,
// //     });
// //   } catch (error) {
// //     console.error("Error creating event:", error);
// //     return next(new InternalServerError("Some error occured"));
// //   }
// // };
// // export const updateEvent = async (
// //   req: Request,
// //   res: Response,
// //   next: NextFunction
// // ) => {
// //   const { id } = req.params;
// //   const {
// //     name,
// //     description,
// //     dateTime,
// //     organizer,
// //     external_forms,
// //     location,
// //     category,
// //     banner,
// //     isAcceptingVolunteerRegistrations,
// //     isTeamEvent,
// //     key_persons,

// //     maxCapacity,

// //   } = req.body;

// //   try {

// //     //@ts-ignore
// //     const _user = req.user;

// //     const user = await User.findById(_user.userId);
// //     if (!user) {
// //       return next(new ForbiddenError("Invalid session : Please login again"));
// //     }

// //     // Find the event to update
// //     const event = await Event.findById(id);
// //     if (!event) {
// //       return next(new NotFoundError("Event not found"));
// //     }

// //     // Ensure user is authorized to update the event
// //     if (!event.admin.equals(user._id)) {
// //       return next(new ForbiddenError("Not enough permissions"));
// //     }

// //     // Update fields if provided in the request body
// //     if (name) event.name = name;
// //     if (description) event.description = description;
// //     if (dateTime) event.dateTime = dateTime;
// //     if (location) event.location = location;
// //     if (banner) event.banner = banner;
// //     if (category) event.category = category;
// //     if (key_persons) event.key_persons = key_persons;
// //     if (isAcceptingVolunteerRegistrations !== undefined)
// //       event.isAcceptingVolunteerRegistrations =
// //         isAcceptingVolunteerRegistrations;
// //     if (isTeamEvent !== undefined) event.isTeamEvent = isTeamEvent;

// //     if (maxCapacity) event.maxCapacity = maxCapacity;
// //     // if (registrationForm) event.registrationForm = registrationForm;
// //     if (external_forms) event.external_forms = external_forms;
// //     if(organizer){
// //       event.organizer = organizer
// //     }
// //     // Save the updated event
// //     await event.save();

// //     res.status(200).json({
// //       success: true,
// //       message: "Event updated successfully.",
// //     });
// //   } catch (error) {
// //     console.error("Error in PUT /events/:id:", error);
// //     return next(
// //       new InternalServerError("Some error occurred. Please try again later.")
// //     );
// //   }
// // };
// // export const addRegistrationForm

// // export const verifyPass = async (
// //   req: Request,
// //   res: Response,
// //   next: NextFunction
// // ) => {
// //   //@ts-ignore
// //   //@ts-ignore
// //   const _user = req.user;
// //   const { passId } = req.body;
// //   try {
// //     const user = await User.findById(_user.userId);
// //     if (!user) {
// //       return next(new ForbiddenError("Invalid session,please login again"));
// //     }
// //     const clubMember = await ClubMember.findOne({
// //       userId: user._id,
// //     });
// //     if (!clubMember) {
// //       return next(new ForbiddenError("You don't have permission"));
// //     }
// //     const registration = await EventRegistration.findById(passId);
// //     if (!registration) {
// //       return next(new NotFoundError("No registration found"));
// //     }
// //     registration.entry_status = "yes";
// //     await registration.save();
// //     res.status(200).json({
// //       success: true,
// //       message: "Participant entered the event",
// //     });
// //   } catch (error) {
// //     console.error(error);
// //     return next(new InternalServerError("Some error occured"));
// //   }
// // };
