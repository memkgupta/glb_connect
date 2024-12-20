import { BadRequestError } from "@errors/BadRequestError";
import { ForbiddenError } from "@errors/ForbiddenError";
import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import ClubMember from "@models/club/club.members";
import Club from "@models/club/club.model";
import { Event } from "@models/event.model";
import User from "@models/user.model";
import { NextFunction, Request, Response } from "express";

export const registerClub = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
   //@ts-ignore
        const _user = req.user;
    if (!_user) {
      return next(new UnauthorizedError("Please Login First"));
    }

    // Extract data from the request body
    const { clubEmail, clubName, clubDescription, contactPhone, clubLogo } =
      req.body;

    // Validate and process data
    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new BadRequestError("Bad request"));
    }

    // Create the club
    const club = await Club.create({
      clubEmail,

      clubName,
      clubDescription,
      contactPhone,
      clubLogo,
      isVerified: false,
      admin: user._id,
    });

    res.status(200).json({
      success: true,
      message: "Club registered successfully. Pending verification.",
    });
  } catch (error) {
    console.error("POST /register-club error:", error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const getDashboardData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
       //@ts-ignore
        const _user = req.user;

    if (!_user) {
      return next(new UnauthorizedError("Please Login first"));
    }

    const user = await User.findOne({ email: _user.email });
    if (!user) {
      return next(new ForbiddenError("Invalid session : Please Login First"));
    }

    // Aggregate club details with events, members, and messages
    const club = await Club.aggregate([
      {
        $match: {
          admin: user._id,
        },
      },
      {
        $lookup: {
          from: "events",
          as: "events",
          let: { club_id: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$club", "$$club_id"] } } },
            { $sort: { dateTime: 1 } },
            { $limit: 3 },
          ],
        },
      },
      {
        $lookup: {
          from: "clubmembers",
          as: "members",
          localField: "_id",
          foreignField: "clubId",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "details",
              },
            },
            { $unwind: "$details" },
            {
              $project: {
                _id: 0,
                role: 1,
                status: 1,
                name: "$details.name",
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "clubmessages",
          as: "messages",
          localField: "_id",
          foreignField: "club",
          pipeline: [{ $sort: { createdAt: 1 } }, { $limit: 5 }],
        },
      },
      {
        $project: {
          clubDescription: 1,
          clubName: 1,
          contactPhone: 1,
          clubLogo: 1,
          events: {
            _id: 1,
            name: 1,
            maxTeamSize: 1,
            maxCapacity: 1,
            isTeamEvent: 1,
            isAcceptingVolunteerRegistrations: 1,
            location: 1,
            dateTime: 1,
            category: 1,
            venue: 1,
            participantsFromOutsideAllowed: 1,
          },
          members: 1,
          messages: {
            _id: 1,
            subject: 1,
            name: 1,
          },
        },
      },
    ]);

    if (club.length === 0) {
       res
        .status(404)
        .json({ success: false, message: "You have no registered club" });
    }

    // Count upcoming and past events
    const totalEvents = await Event.find({
      admin: user._id,
      dateTime: { $lt: new Date() },
    }).countDocuments();

    const upcomingEvents = await Event.find({
      admin: user._id,
      dateTime: { $gte: new Date() },
    }).countDocuments();

   res.status(200).json({
      success: true,
      clubDetails: {
        ...club[0],
        totalEvents,
        upcomingEvents,
      },
    });
  } catch (error) {
    console.error("GET /club-details error:", error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const updateClubDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
       //@ts-ignore
        const _user = req.user;

    if (!_user) {
      return next(new UnauthorizedError("Please login first"));
    }

    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new ForbiddenError("Invalid session : Please login again"));
    }

    const { clubName, clubLogo, contactPhone, clubDescription } = req.body;

    const club = await Club.findOne({ admin: user._id });
    if (!club) {
      return next(new BadRequestError("Bad request"));
    }

    if (clubName) club.clubName = clubName;
    if (clubDescription) club.clubDescription = clubDescription;
    if (clubLogo) club.clubLogo = clubLogo;
    if (contactPhone) club.contactPhone = contactPhone;

    await club.save();
    res
      .status(200)
      .json({ success: true, message: "Club Details Updated Successfully" });
  } catch (error) {
    console.error("PUT /update-club-details error:", error);
    return next(new InternalServerError("Some error occured"));
  }
};

export const addMember = async(req:Request,res:Response,next:NextFunction)=>{
    try {
 
    
        const { clubId, userId, role, team, status, joinedAt } = req.body;
    

      
       //@ts-ignore
        const _user = req.user;
    
        if (!_user) {
          return next(new UnauthorizedError("Please login first"));
        }
    
        // Check if the logged-in user is an admin of the club
        const admin = await User.findById(_user.userId);
        const club = await Club.findById(clubId);
        if(!admin){
          return next(new ForbiddenError("Invalid session , please login again"))
        }
        if (!club || !club.admin.equals(admin._id)) {
          return next(new BadRequestError("Bad request"));
        }
    
        const user = await User.findById(userId);
    
        if (!user) {
          return next(new ForbiddenError("Invalid session : Please Login again"))
        }
    
        const member = await ClubMember.create({
          clubId: club._id,
          userId: userId,
          role: role,
          team: team,
          status: status,
          joinedAt: joinedAt
        });
    
      res.status(200).json({ success: true, message: 'Member added successfully' });
      } catch (error) {
        console.error('POST /add-club-member error:', error);
        return next(new InternalServerError("Some error occured"));
      }
}

export const updateMember = async(req:Request,res:Response,next:NextFunction)=>{
    try {
       
    
        const { member_id, role, team, status } = req.body;
    
        // Get logged-in user's session
     
       //@ts-ignore
        const _user = req.user;
    
       
    
        // Find the logged-in user in the database
        const user = await User.findById(_user.userId);
        if (!user) {
          return next(new ForbiddenError("Invalid session : Please Login Again"))
        }
    
        // Find the club member by ID and populate the club information
        const member = await ClubMember.findById(member_id).populate('clubId');
    
        if (!member) {
          return next(new NotFoundError("Member not found"));
        }
    
        // Check if the logged-in user is the admin of the club
        //@ts-ignore
        if (!member.clubId.admin.equals(user._id)) {
          return next(new ForbiddenError("Not Enough Permissions"));
        }
    
        // Update member details
        if (role) member.role = role;
        if (team) member.team = team;
        if (status) member.status = status;
    
        await member.save();
    
       res.status(200).json({ success: true, message: 'Member updated successfully' });
      } catch (error) {
        console.error('PUT /update-club-member error:', error);
        return next(new InternalServerError("Somer error occured"));
      }
}
export const myClub = async(req:Request,res:Response,next:NextFunction)=>{

       //@ts-ignore
        const _user = req.user;
  try {
    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new ForbiddenError("Invalid session please login again"));
    }

    // Retrieve only the ID, name, and admin fields of the clubs where the user is the admin
    const clubs = await Club.findOne(
      { admin: user._id },
      { _id: 1, clubName: 1, admin: 1 }
    );

    if (clubs.length === 0) {
      return next(new NotFoundError("No registered club found"));
    }

    res.status(200).json({success:true,clubs:clubs});
    
  } catch (error) {
    console.log(error);
    return next(new InternalServerError("Some error occured"));
  }
}
export const viewClub = async(req:Request,res:Response,next:NextFunction)=>{
 const {clubId} = req.params;
  try {
    const club = await Club.aggregate([
      {
        $match:{
          _id:clubId
        }
      },
      {
        $lookup:{
        from:'clubmembers',
        as:'members',
        foreignField:'clubId',
        localField:'_id',
      }
    },
    {$unwind:"$members"},
    {
      $lookup:{
        from:'users',
        as:'users',
        foreignField:'_id',
        localField:'members.userId'
      }
    },
    {
      $unwind:"$users"
    },
    {$project:{
      clubEmail:1,
      clubDescription:1,
      clubLogo:1,
      contactPhone:1,
      clubName:1,
      members:{
        "userId":"$members.userId",
        "pic":"$users.profile",
        "name":"$users.name",
        "role":"$members.role"
      }
    }}
    ]);
    if(!club)
    {
      return next(new NotFoundError("Club not found"))
    }
    res.status(200).json({
      success:true,
      club:club
    })
  } catch (error) {
    
  }
}
export const getEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1 } = req.query; // Default page is 1 if not provided

   //@ts-ignore
       //@ts-ignore
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