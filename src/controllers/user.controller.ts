import { BadRequestError } from "@errors/BadRequestError";
import { ForbiddenError } from "@errors/ForbiddenError";
import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";
import { Event, EventRegistration } from "@models/event.model";
import { Progress } from "@models/progress.model";
import { Project } from "@models/project.model";
import Resources from "@models/resource.model";
import User from "@models/user.model";
import { asyncHandler } from "@utils/api/asyncHandler";
import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import * as userService from "@services/users/index"
export const getUserByUsername =  async(req:Request,res:Response,next:NextFunction)=>{
    const username = req.query.username;
    try {
        const user = await User.findOne({username:username});
        if(!user){
            return next(new NotFoundError("User not found"));
        }
        res.status(200).json({
            success:true,
            data:{
                _id:user._id,
                profile:user.profile,
                username:user.username,
                socials:user.socials,
                name:user.name,
                bio:user.bio,
                interests:user.interests
            }
        })
    } catch (error) {
        console.error(error);
        return next(new InternalServerError("Some error occured"));
    }
}

export const getUserProjects = async(req:Request,res:Response,next:NextFunction)=>{
   let userId = req.query.uid;
     
    try {
        const user = await User.findById(userId);
        if(!user){
            return next(new BadRequestError("Invalid user id"));
        }
        const page = parseInt(req.query.page  as string);
        const limit = parseInt((req.query.limit || "20") as string);
        const projects = await Project.aggregate([
            {
                $match:{
                    user:user._id,
                }
            },
            {
                $lookup:{
                    from:'votes',
                    as:'votes',
                    localField:'_id',
                    foreignField:"resourceId"
                }
            },
            {$unwind:{
                path:"$votes",
                preserveNullAndEmptyArrays:true
            }},
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
                  downvoteCount:1,
                }
              },
            {
                $project: {
                  _id: 0,
                  upvoteCount: 1,
                  downvoteCount: 1,
                  data:{
                    category:1,
                    title:1,
                    banner:1,
                    openForCollab:1,
                    tags:1,
                    technologiesUsed:1,
                    updatedAt:1,
                   }
                },
              },
              {$limit:limit},
              {$skip:(page-1)*limit}
        ]);
        res.status(200).json({
            success:true,
            projects:projects
        });
    } catch (error) {
        console.error(error);
        return next(new InternalServerError("Some error occired"))
    }
}
export const getUserContributions = async(req:Request,res:Response,next:NextFunction)=>{
    let userId = req.query.uid;
   
    try {
        const user = await User.findById(userId);
        if(!user){
            return next(new BadRequestError("Invalid user id"));
        }
        const page = parseInt(req.query.page  as string);
        const limit = parseInt((req.query.limit || "20") as string);
        const contributions = await Resources.aggregate([
            {
                $match:{
                    contributor:user._id,
                }

            },
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
                  downvoteCount:1,
                }
              },
              {$limit:limit},
              {$skip:(page-1)*limit},
              {$project:{
                upvoteCount: 1,
                downvoteCount: 1,
                data:{
                  branch:1,
                  label:1,
                  type:1,
                  code:1,
                  sessionYear:1,
                  thumbnail:1,
                }
              }}
        ]) 
res.status(200).json({success:true,contributions})
    } catch (error) {
        console.error(error);
        return next(new InternalServerError("Some error occured"))
    }
}
export const getMyProjects = async(req:Request,res:Response,next:NextFunction)=>{
  // let userId = req.query.uid;
     //@ts-ignore
    const _user = req.user;

   try {
       const user = await User.findById(_user.userId);
       if(!user){
        return next(new ForbiddenError("Invalid session , please login again"));
      
       }
       const page = parseInt(req.query.page  as string);
       const limit = parseInt((req.query.limit || "20") as string);
       const projects = await Project.aggregate([
           {
               $match:{
                   user:user._id,
               }
           },
           {
               $lookup:{
                   from:'votes',
                   as:'votes',
                   localField:'_id',
                   foreignField:"resourceId"
               }
           },
           {$unwind:{
               path:"$votes",
               preserveNullAndEmptyArrays:true
           }},
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
                 downvoteCount:1,
               }
             },
           {
               $project: {
                 _id: 1,
                 upvoteCount: 1,
                 downvoteCount: 1,
                 details:{
                   category:"$data.category",
                   title:"$data.title",
                   banner:"$data.banner",
                   openForCollab:"$data.openForCollab",
                   tags:"$data.tags",
                   technologiesUsed:"$data.technologiesUsed",
                   updatedAt:"$data.updatedAt",
                  }
               },
             },
             {$limit:limit},
             {$skip:(page-1)*limit}
       ]);
       const totalProjects = await Project.find({user:user._id}).countDocuments();
       res.status(200).json({
           success:true,
           projects:projects,
           totalProjects:totalProjects
       });
   } catch (error) {
       console.error(error);
       return next(new InternalServerError("Some error occired"))
   }
}
export const getMyContributions = async(req:Request,res:Response,next:NextFunction)=>{
  //@ts-ignore
  const _user = req.user;
  try {
      const user = await User.findById(_user.userId);
       if(!user){
           return next(new ForbiddenError("Invalid session , please login again"));
       }
       const page = parseInt(req.query.page  as string);
       const limit = parseInt((req.query.limit || "20") as string);
       const contributions = await Resources.aggregate([
           {
               $match:{
                   contributor:user._id,
               }

           },
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
                 downvoteCount:1,
               }
             },
             {$limit:limit},
             {$skip:(page-1)*limit},
             {$project:{
               upvoteCount: 1,
               downvoteCount: 1,
               data:{
                 branch:1,
                 label:1,
                 type:1,
                 code:1,
                 sessionYear:1,
                 thumbnail:1,
               }
             }}
       ]) 
res.status(200).json({success:true,contributions})
   } catch (error) {
       console.error(error);
       return next(new InternalServerError("Some error occured"))
   }
}
export const getFeed = asyncHandler(
  async(req:Request,res:Response,next:NextFunction)=>{
const data = await userService.getFeed();
  res.status(200).json({success:true,data:data})
}
)

export const getDashboard = asyncHandler(
  async(req:Request,res:Response,next:NextFunction)=>{
    const _user =req.user;
    const dashboard = await User.aggregate
    (
      [
       
         {
    $match: {
      _id: new Types.ObjectId(_user._id)
    }
  },
  {
    $lookup: {
      from: "events",
      let: { userId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$owner", "$$userId"] } } },
        { $count: "count" }
      ],
      as: "events"
    }
  },
  {
    $lookup: {
      from: "resources",
      let: { userId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$contributor", "$$userId"] } } },
        { $count: "count" }
      ],
      as: "resources"
    }
  },
  {
    $lookup: {
      from: "projects",
      let: { userId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$user", "$$userId"] } } },
        { $count: "count" }
      ],
      as: "projects"
    }
  },
  {
    $addFields: {
      eventCount: { $ifNull: [{ $arrayElemAt: ["$events.count", 0] }, 0] },
      resourceCount: { $ifNull: [{ $arrayElemAt: ["$resources.count", 0] }, 0] },
      projectCount: { $ifNull: [{ $arrayElemAt: ["$projects.count", 0] }, 0] }
    }
  },
        {$project:{
eventCount:1,
resourceCount:1,
projectCount:1
        }}
      ],
      
    );

res.status(200).json({success:true ,dashboard:dashboard[0]})
  }
)
export const getRecentActivity = asyncHandler(
  
  async(req:Request,res:Response,next:NextFunction)=>{
    const _user = req.user;
    const userId = new Types.ObjectId(_user._id)
    const recentActivity = await Resources.aggregate([
     { $match: { contributor: userId } },
  { $project: {
      type: { $literal: "resource" },
      title: "$title",
      date: "$createdAt"
    }
  },
  { $unionWith: {
    coll: "projects",
    pipeline: [
      { $match: { user: userId } },
      { $project: {
          type: { $literal: "project" },
          title: "$title",
          date: "$createdAt"
        }
      }
    ]
  }},
  { $unionWith: {
    coll: "events",
    pipeline: [
      { $match: { owner: userId } },
      { $project: {
          type: { $literal: "event" },
          title: "$name",
          date: "$createdAt"
        }
      }
    ]
  }},
  { $sort: { date: -1 } },
  { $limit: 10 }
    ])

    console.log(JSON.stringify(
      [
     { $match: { contributor: userId } },
  { $project: {
      type: { $literal: "resource" },
      title: "$title",
      date: "$createdAt"
    }
  },
  { $unionWith: {
    coll: "projects",
    pipeline: [
      { $match: { user: userId } },
      { $project: {
          type: { $literal: "project" },
          title: "$title",
          date: "$createdAt"
        }
      }
    ]
  }},
  { $unionWith: {
    coll: "events",
    pipeline: [
      { $match: { owner: userId } },
      { $project: {
          type: { $literal: "event" },
          title: "$name",
          date: "$createdAt"
        }
      }
    ]
  }},
  { $sort: { date: -1 } },
  { $limit: 10 }
    ]
    ))

    res.status(200).json({
      success:true,activity:recentActivity
    })
  }
)