import { BadRequestError } from "@errors/BadRequestError";
import { ForbiddenError } from "@errors/ForbiddenError";
import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";
import { Event, EventRegistration } from "@models/event.model";
import { Progress } from "@models/progress.model";
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
export const getFeed = async(req:Request,res:Response,next:NextFunction)=>{
  //@ts-ignore
  const _user = req.user;
  try {
    const user = await User.findById(_user.userId);
    if(!user){
      return next(new ForbiddenError("Invalid session, please login again"))
    }
    const events = await Event.aggregate([{
      $match:{
        dateTime:{$gte:new Date()}
      },
      
    },
  {
    $sort:{dateTime:1}
  },
  {$limit:5},
  {$project:{
    _id:1,
    name:1,
    dateTime:1,
    location:1,
    category:1,

  }}
  ]);
  const registeredEvents = await EventRegistration.aggregate([{
    $match:{
     user:user._id,
     status:"completed"
    },
    
  },
  {
    $lookup:{
      from:"events",
      as:"event",
     let:{eventId:"$event"},
      pipeline:[
        {
          $match:{
            $expr:{
              $eq:["$$eventId","$_id"]
            }
          }
        },
        {$project:{
  _id:1,
  name:1,
  dateTime:1,
  location:1,
  category:1,
  
}}
      ]
    }
  },
 {$unwind:"$event"}
,{
  $sort:{dateTime:1}
},

{$limit:5},
 {$project: {
   _id:1,

  name:"$event.name",
  dateTime:"$event.dateTime",
  location:"$event.location",
  category:"$event.category",
  
}
 }
]);
  const resourceFilters:any = {}
  if(user.year){
    resourceFilters.collegeYear = user.year
  }
  if(user.branch){
    resourceFilters.branch = user.branch;
  }
  const resources = await Resources.aggregate([
    {$match:resourceFilters},
    {$lookup:{
      from:'votes',
      as:'upvotes',
      let:{resourceId:"$_id"},
      pipeline:[
        {$match:{
          $expr:{
            $eq:["$$resourceId","$resourceId"]
          }
        }},
      
      ]
    }},
    {$lookup:{
      from:"users",
      as:"userDetails",
      localField:"contributor",
      foreignField:"_id",
    }}, {$unwind:"$userDetails"},
   {
    $addFields: {
      tupvotes: { $size: '$upvotes' } // Calculate the size of the 'upvotes' array
    }
  },{
     $sort: {
       createdAt: 1
     }
  },
    {$sort:{tupvotes:-1,}},
{$limit:5},
{$project:{
  _id:1,
  label:1,
  type:1,
  updatedAt:1,
  uploadedBy:"$userDetails.name"
}}
  ])
  const currentCourses = await Progress.aggregate([
    {
      $match:{
        user_id:user._id
      }
    },
    {
      $lookup: {
        from: "resources",
        as: "course",
        localField: "resource_id",
        foreignField: "_id",
      },
    },
    {
      $unwind: "$course",
    },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: {
        path: "$userDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "playlists",
        as: "playlist",
        localField: "course.playlist",
        foreignField: "_id",
      },
    },
    {
      $unwind: {
        path: "$playlist",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        takenLectures: {
          $size: "$taken",
        },
        totalLectures: {
          $size: "$playlist.lectures",
        },
      },
    },
    {
      $sort: {
        takenLectures: -1,
      },
    },
    {
      $limit: 5,
    },
    {
      $project: {
        _id: 1,
        label: "$course.label",
        source: "$course.source",
        description: "$course.description",
        uploadedBy: "$userDetails.name",
        takenLectures: 1,
        totalLectures: 1,
      },
    },
  ])
  const data = {
    currentCourses,
    registeredEvents,
    upcomingEvents:events,
    recentResources:resources,
 
  }
  res.status(200).json({success:true,data:data})
  } catch (error) {
    console.error(error)
    return next(new InternalServerError("Some error occured"));
  }
}