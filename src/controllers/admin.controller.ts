import { EncryptionFilterSensitiveLog } from "@aws-sdk/client-s3";
import { collegeData } from "@constants/index";
import { BadRequestError } from "@errors/BadRequestError";
import { ForbiddenError } from "@errors/ForbiddenError";
import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";
import Announcement from "@models/announcement.model";
import Club from "@models/club/club.model";
import College from "@models/college.model";
import Resources from "@models/resource.model";
import Subject from "@models/subject.model";
import User from "@models/user.model";
import { NextFunction, Request, Response } from "express";
import mongoose, { Schema } from "mongoose";
import { sendUserBannedEmail } from "../helpers/mail";

export const dashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //todo

  try {
    const data = await College.aggregate([
      {
        $match: {
          name: collegeData.name,
        },
      },
      // total clubs
      {
        $lookup: {
          from: "clubs",
          as: "clubs",
          pipeline: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                lastMonthCount: {
                  $sum: {
                    $cond: [
                      {
                        $gte: [
                          "$createdAt",
                          {
                            $dateSubtract: {
                              startDate: "$$NOW",
                              unit: "month",
                              amount: 1,
                            },
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                lastToLastMonthCount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          {
                            $gte: [
                              "$createdAt",
                              {
                                $dateSubtract: {
                                  startDate: "$$NOW",
                                  unit: "month",
                                  amount: 2,
                                },
                              },
                            ],
                          },
                          {
                            $lt: [
                              "$createdAt",
                              {
                                $dateSubtract: {
                                  startDate: "$$NOW",
                                  unit: "month",
                                  amount: 1,
                                },
                              },
                            ],
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
        },
      },
      //total users
      {
        $lookup: {
          from: "users",
          as: "users",
          pipeline: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                lastMonthCount: {
                  $sum: {
                    $cond: [
                      {
                        $gte: [
                          "$createdAt",
                          {
                            $dateSubtract: {
                              startDate: "$$NOW",
                              unit: "month",
                              amount: 1,
                            },
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                lastToLastMonthCount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          {
                            $gte: [
                              "$createdAt",
                              {
                                $dateSubtract: {
                                  startDate: "$$NOW",
                                  unit: "month",
                                  amount: 2,
                                },
                              },
                            ],
                          },
                          {
                            $lt: [
                              "$createdAt",
                              {
                                $dateSubtract: {
                                  startDate: "$$NOW",
                                  unit: "month",
                                  amount: 1,
                                },
                              },
                            ],
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
        },
      },
      // total resources
      {
        $lookup: {
          from: "resources",
          as: "resources",
          pipeline: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                lastMonthCount: {
                  $sum: {
                    $cond: [
                      {
                        $gte: [
                          "$createdAt",
                          {
                            $dateSubtract: {
                              startDate: "$$NOW",
                              unit: "month",
                              amount: 1,
                            },
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                lastToLastMonthCount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          {
                            $gte: [
                              "$createdAt",
                              {
                                $dateSubtract: {
                                  startDate: "$$NOW",
                                  unit: "month",
                                  amount: 2,
                                },
                              },
                            ],
                          },
                          {
                            $lt: [
                              "$createdAt",
                              {
                                $dateSubtract: {
                                  startDate: "$$NOW",
                                  unit: "month",
                                  amount: 1,
                                },
                              },
                            ],
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
        },
      },
      // total events hosted
      {
        $lookup: {
          from: "events",
          as: "events",
          pipeline: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                lastMonthCount: {
                  $sum: {
                    $cond: [
                      {
                        $gte: [
                          "$createdAt",
                          {
                            $dateSubtract: {
                              startDate: "$$NOW",
                              unit: "month",
                              amount: 1,
                            },
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                lastToLastMonthCount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          {
                            $gte: [
                              "$createdAt",
                              {
                                $dateSubtract: {
                                  startDate: "$$NOW",
                                  unit: "month",
                                  amount: 2,
                                },
                              },
                            ],
                          },
                          {
                            $lt: [
                              "$createdAt",
                              {
                                $dateSubtract: {
                                  startDate: "$$NOW",
                                  unit: "month",
                                  amount: 1,
                                },
                              },
                            ],
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
        },
      },
      // total projects
      {
        $lookup: {
          from: "projects",
          as: "projects",
          pipeline: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                lastMonthCount: {
                  $sum: {
                    $cond: [
                      {
                        $gte: [
                          "$createdAt",
                          {
                            $dateSubtract: {
                              startDate: "$$NOW",
                              unit: "month",
                              amount: 1,
                            },
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                lastToLastMonthCount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          {
                            $gte: [
                              "$createdAt",
                              {
                                $dateSubtract: {
                                  startDate: "$$NOW",
                                  unit: "month",
                                  amount: 2,
                                },
                              },
                            ],
                          },
                          {
                            $lt: [
                              "$createdAt",
                              {
                                $dateSubtract: {
                                  startDate: "$$NOW",
                                  unit: "month",
                                  amount: 1,
                                },
                              },
                            ],
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]);
    res.status(200).json({
      success: true,
      analytics: data,
    });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
};

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email,page, name, username, from, to } = req.query;
  try {
    const filter: any = {
        email:{
            $regex:"^",
            $options:"i"
        },
        name:{
            $regex:"",
            $options:"i"
        },
       
    };
    if (email) {
      filter.email = {
        $regex: `${email}`,
        $options: "i",
      };
    }
    if (name) {
      filter.name = {
        $regex: `${name}`,
        $options: "i",
      };
    }
    if (username && username.toString().length>0) {
      filter.username = {
        $regex: `^${username}`,
      };
    }
    if (from && !to) {
      filter.createdAt = {
        $gte: new Date(from as string),
      };
    }
    if (to && !from) {
      filter.createdAt = {
        $lte: new Date(to as string),
      };
    }
    if (from && to) {
      filter.createdAt = {
        $and: [
          { $lte: new Date(to as string) },
          { $gte: new Date(from as string) },
        ],
      };
    }
    const aggreagtion:any = [
        {$match:filter},
        {$sort:{createdAt:-1}},
       
        {$skip:(parseInt(page as string)-1)*10}, {$limit:10},
      {
        
        $project: {
          _id: 1,
          profile: 1,
          email: 1,
          username: 1,
          createdAt:1,
          name: 1,
        },
      },
    ];
 console.log(filter.email);
 console.log(filter.name)
    const users = await User.aggregate(aggreagtion);
    const totalUsers = await User.find(filter).sort({createdAt:-1}).countDocuments();
    res
      .status(200)
     
      .json({ success: true, users,totalResults:totalUsers });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.uid;
  
  const aggregation  = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "resources",
        as: "contributions",
        localField: "_id",
        foreignField: "contributor",
      },
    },

    {
      $lookup: {
        from: "clubs",
        as: "club",
        localField: "_id",
        foreignField: "admin",
      },
    },
    {
      $unwind: {
        path: "$club",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "projects",
        as: "projects",
        localField: "_id",
        foreignField: "user",
      },
    },

    {
      $project: {
        _id: 1,
        name: 1,
        username: 1,
        bio: 1,
        profile: 1,
        isBanned: 1,
        verified: 1,
        role: 1,
        year: 1,
        interests: 1,
        socials: 1,
        createdAt: 1,
        updatedAt: 1,
        contributions: {
          $size:"$contributions"
        },
        club: {
          _id: 1,
          clubName: 1,
          clubLogo: 1,
          clubEmail: 1,
          isVerified: 1,
        },
        projects: {
        $size:"$projects"
        },
      },
    },
  ]
  
  try {
   
    const user = await User.aggregate(aggregation);
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const banUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { uid, reason } = req.body;
  try {
    const user = await User.findById(uid);
    if (!user) {
      return next(new BadRequestError("User not found"));
    }
    user.isBanned = true;
    await user.save();
    await sendUserBannedEmail(user.email, user.username, reason);
    res.status(200).json({
      success: true,
      message: "User banned",
    });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some erorr occured"));
  }
};
export const unbanUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { uid } = req.body;
  try {
    const user = await User.findById(uid);
    if (!user || !user.isBanned) {
      return next(new BadRequestError("Bad request"));
    }
    user.isBanned = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User banned",
    });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some erorr occured"));
  }
};
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { uid } = req.params;
  try {
    const user = await User.findById(uid);
    if (!user) {
      return next(new BadRequestError("Bad request"));
    }
    user.isRemoved = true;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "User removed successfully" });
  } catch (error) {
    console.log(error);
    return next(new InternalServerError("Some error occured"));
  }
};

export const getResources = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { label, type, code, from,branch, to, page,year } = req.query;

  const filters: any = {
    isRemoved: false,
  };

  if (label && (label as string).length>0) {
    filters.label = {
      $regex: label,
      $options: "i",
    };
  }
  if (type && (type as string).length>0) {
    filters.type = type;
  }
  if(year && (year as string).length>0){
    filters.collegeYear = year;
  }
  if(year != "1" && branch && (branch as string).length>0){
    filters.branch = branch
  }
  if (code && (code as string).length>0) {
    filters.code = code;
  }
  if (from && !to) {
    filters.createdAt = {
      $gte: new Date(from as string),
    };
  }
  if (to && !from) {
    filters.createdAt = {
      $lte: new Date(to as string),
    };
  }
  if (from && to) {
    filters.createdAt = {
      $and: [
        { $lte: new Date(to as string) },
        { $gte: new Date(from as string) },
      ],
    };
  }
  try {
    const aggregation:any = [
      { $match: filters },
      {
        $lookup: {
          as: "votes",
          from: "votes", // The collection to join
          localField: "_id", // Field in Contributions
          foreignField: "resourceId", // Field in Votes collection
        },
      },
      {
        $unwind: {
          path: "$votes",
          preserveNullAndEmptyArrays: true, // Include documents even if there are no votes
        },
      },
      {
        $group: {
          _id: "$_id", // Group by resource ID
          data: { $first: "$$ROOT" }, // Get the first occurrence of the document
          upvoteCount: {
            $sum: {
              $cond: [{ $eq: ["$votes.voteType", "up"] }, 1, 0], // Count upvotes
            },
          },
          downvoteCount: {
            $sum: {
              $cond: [{ $eq: ["$votes.voteType", "down"] }, 1, 0], // Count downvotes
            },
          },
        },
      },
      {
        $sort: {
          upvoteCount: -1,
          downvoteCount: 1,
        },
      },
      { $limit: 20 },
      { $skip: (parseInt((page || "1") as string) - 1) * 20 },
      {
        $project: {
          _id: 0,
          upvoteCount: 1,
          downvoteCount: 1,
          data: {
            label: 1,
            sessionYear: 1,
            _id: 1,
            type: 1,
            collegeYear:1
          },
        },
      },
    ]
    console.log(aggregation)
    const totalResources = await Resources.find(filters).countDocuments()
    const resources = await Resources.aggregate(aggregation);
    res
      .status(200)
     
      .json({ success: true, totalResources,resources:resources.map(r=>({
        _id:r.data._id,
        votes:{upVote:r.upvoteCount,downVote:r.downvoteCount},
        label:r.data.label,
        sessionYear:r.data.sessionYear,
        collegeYear:r.data.collegeYear,
        type:r.data.type,
        
      })) });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
};

export const removeContribution = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { rid } = req.params;
  try {
    const resource = await Resources.findById(rid);
    if (!resource || resource.isRemoved) {
      return next(new BadRequestError("Bad request"));
    }
    resource.isRemoved = true;
    await resource.save();
    res.status(200).json({ success: true, message: "Resource removed" });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const getAnnouncements = async(req:Request,res:Response,next:NextFunction)=>{
  const {title,date,page,show_removed} = req.query;
  try {
const filters:any = {}
if(title){
  filters.title = {
    $regex:`^${title}`,
    $options:"i"
  }
}
if(date){
  filters.date = new Date(date as string)
}
if(!show_removed){
  filters.isRemoved=false
}
const aggregation = [
  {$match:filters},
  {
    $skip:(parseInt(page as string)-1)*20
  },
  {$limit:20},
]
const announcements = await Announcement.aggregate(aggregation);
const totalAnnouncements = await Announcement.find(filters).countDocuments();

res.status(200).json({
  success:true,announcements,totalResults:totalAnnouncements
})
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"))
  }
}
export const makeAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { title, description, endDate, actionLink } = req.body;
  try {
    const announcement = await Announcement.create({
      title,
      description,
      actionLink,
      endDate,
    });
    res
      .status(200)
      .json({
        success: true,
        message: "Announcement created successfully",
        _id: announcement._id,
      });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const editAnnoucement = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {  title, description, endDate, actionLink, isRemoved } = req.body;
  const id = req.params.id;
  try {
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return next(new BadRequestError("Bad request"));
    }
    if (description) {
      announcement.description = description;
    }
    if (title) {
      announcement.title = title;
    }
    if (endDate) {
      announcement.endDate =endDate
    }
    if (isRemoved) {
      announcement.isRemoved = isRemoved;
    }
    if (actionLink) {
      announcement.actionLink = actionLink;
    }
    await announcement.save();
    res.status(200).json({ success: true, message: "Announcement updated" });
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const addSubjects = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code, description, year, label, branch } = req.body;

    // Validation
    if (!label || !code) {
      return next(new BadRequestError("Bad request"));
    }

    // Check if subject already exists
    const existingSubject = await Subject.findOne({ code });
    if (existingSubject) {
      return next(new BadRequestError("Subject already exists"));
    }

    const newSubject = new Subject({ label, code, year, branch });
    await newSubject.save();

    res
      .status(201)
      .json({ message: "Subject added successfully", subject: newSubject });
  } catch (error) {
    next(error);
  }
};

// ✅ Edit a subject
export const editSubject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params; // Assuming subject ID is in params
    const { label, code, year, branch } = req.body;

    const updatedSubject = await Subject.findByIdAndUpdate(
      id,
      { label, code, branch, year },
      { new: true, runValidators: true }
    );

    if (!updatedSubject) {
      return next(new NotFoundError("Subject not found"));
    }

    res
      .status(200)
      .json({
        message: "Subject updated successfully",
        subject: updatedSubject,
      });
  } catch (error) {
    return next(new InternalServerError("Some error occured"));
  }
};

// ✅ Remove a subject
export const removeSubject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params; // Assuming subject ID is in params

    const deletedSubject = await Subject.findByIdAndDelete(id);

    if (!deletedSubject) {
      return next(new NotFoundError("Subject not found"));
    }

    res.status(200).json({ message: "Subject removed successfully" });
  } catch (error) {
    next(error);
  }
};
export const getSubjectById = async(req:Request,res:Response,next:NextFunction)=>{
    const {id} = req.params;
    try {
        const subject = await Subject.findById(id);
        res.status(200).json({success:true,subject});
    } catch (error) {
        console.error(error)
        return next(new InternalServerError("Some error occured"))
    }
}
// export const editConfiguration = async(req:Request,res:Response,next:NextFunction)=>{

// }
