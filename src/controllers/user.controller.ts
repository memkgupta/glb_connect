import { BadRequestError } from "@errors/BadRequestError";
import { ForbiddenError } from "@errors/ForbiddenError";
import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";
import { Project } from "@models/project.model";
import Resources from "@models/resource.model";
import User from "@models/user.model";
import { NextFunction, Request, Response } from "express";

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