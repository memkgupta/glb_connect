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
import mongoose from "mongoose";

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

    const user = await User.findById(_user.userId);
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
export const myClub = async(req:Request,res:Response,next:NextFunction)=>{

       //@ts-ignore
        const _user = req.user;
  try {
    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new ForbiddenError("Invalid session please login again"));
    }
const clubs = await ClubMember.aggregate([{
$match:{
    userId:user._id,
    status:"Active"
}
},
{$lookup:{
  from:"clubs",
  as:"club",
  localField:"clubId",
  foreignField:"_id"
}},
{$unwind:{
  path:"$club",
  preserveNullAndEmptyArrays:true
}},
{$lookup:{
  from:'clubteams',
  as:'team',
  localField:"teamId",
  foreignField:"_id"
}},
{
  $unwind:{
    path:"$team",
    preserveNullAndEmptyArrays:true
  }
},
{
  $lookup:{
    from:'clubpermissions',
    as:'permissions',
    let:{clubId:"$clubId",memberId:"$_id"},
    pipeline:[
      {
        $match:{$expr:{
          $and:[{$eq:["$club","$$clubId"]},{$eq:["$member","$$memberId"]}]
          
        }}
      },
      {$project:{
        action:1,
        resource:1
      }}
    ]
  }
},
{$project:{
  _id:"$clubId",
  title:"$club.clubName",
  role:"$role",
  team:{
      _id:"$team._id",
      title:"$team.title",
  },
  member_id:"$_id",
  permissions:{
      action:"$permissions.action",
      resource:"$prermissions.resource"
  }
}}
]);

    

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
        let:{clubId:"$_id"},
        pipeline:[
          {$match:{
            $expr:{$and:[{"$clubId":"$$clubId"},{"$status":"Active"}]}
          }}
        ]
      }
    },

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
export const clubDashboard = async(req:Request,res:Response,next:NextFunction)=>{
  const {club_id} = req.query;
  try {
    const club = await Club.aggregate([
      {$match:{
        _id:new mongoose.Types.ObjectId(club_id as string)
      }},
      {
        $lookup:{
          from:"clubmembers",
          as:"members",
          let:{clubId:"$_id"},
          pipeline:[
          {$match:{
            $expr:{$and:[{$eq:["$clubId","$$clubId"]},{$eq:["$status","Active"]}]}
          }}
        ]
        }
      },
     {
      $lookup:{
        from:"clubteams",
        as:"teams",
        foreignField:"club",
        localField:"_id"
      }
     },
     {
      $project:{
        details:{
          _id:"$_id",
          clubEmail:"$clubEmail",
        clubName:"$clubName",
        clubDescription:"$clubDescription",
        clubLogo:"$clubLogo",
        contactPhone:"$contactPhone",
        isVerified:"$isVerified",
        admin:"$admin",
        },
        members:{
          _id:1,
          clubId:1,
            name:1,
            userId:1,
            role:1,
            teamId:1,
            status:1,
            joinedAt:1,
        },
        teams:{
          title:1,
          club:1,
          description:1,
          status:1,
          head:1,
        }
      },
     
     }
    ])
    res.status(200).json({
      success:true,data:club[0]
    })
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
}