import { BadRequestError } from "@errors/BadRequestError";
import { ForbiddenError } from "@errors/ForbiddenError";
import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { Project, ProjectLog } from "@models/project.model";
import User from "@models/user.model";
import Vote from "@models/vote.model";
import { NextFunction, Request, Response } from "express"
import { Schema } from "mongoose";
import { ProjectCreateRequestBody, UpdateProjectBody } from "src/@types/project";

export const createProject =  async(req:Request,res:Response,next:NextFunction)=>{
    //@ts-ignore
    const _user = req.user;
    const data:ProjectCreateRequestBody = req.body;
    try {
        const user = await User.findById(_user.userId);
        if(!user)
        {
            return next(new ForbiddenError("Invalid session , Please login again"));
        }
        const project = new Project({
           ...data,user:user._id,lead:user.name,contributors:[
            {username:user.username,role:"ADMIN"}
           ]

        });
        await project.save();
        res.status(200).json({
            success:true,message:"Project created successfully",pid:project._id
        });
    } catch (error) {
        console.error(error);
        return next(new InternalServerError("Some error occured"));
    }
}
export const updateProject = async(req:Request,res:Response,next:NextFunction)=>{
   //@ts-ignore
    const _user = req.user 
    const projectId = req.query.pid;
    const allowedFields = ["title","banner","images","openForCollab","start","end","currently_working","tags","status","technologiesUsed","live_link","github","demo"];
    const {updates}:UpdateProjectBody = req.body;
    try {
        const user = await User.findById(_user.userId);
        if(!user ){
            return next(new ForbiddenError("Invalid session, please login again"))
        }
        const project = await Project.findById(projectId)
        if(!project){
            return next(new BadRequestError("Invalid project id"));
        }
        if(project.user!=user._id){
            return next(new ForbiddenError("Access denied"))
        }
        const updateFields:{
            $set?:any,
            $addToSet?:any,
            $pull?:any,
        } = {
            $set:{},
        };
        updates.forEach((update)=>{
            if(allowedFields.includes(update.field)){
                switch(update.type){
                    case "edit":{
                        updateFields.$set[update.field] = update.value
                        break;
                    }
                    case "push":{
                        updateFields.$addToSet[update.field] = {$each:update.value}
                    }
                    break;
                    case "remove":{
                        updateFields.$pull[update.field] = {$in:update.value}
                    }
                    
                }
            }
            else{
                return next(new BadRequestError("Error: Fields can't be updated "))
            }
        });
       await project.updateOne(
            {_id:project._id},
            updateFields
        );
        res.status(200).json({success:true,message:"Project updated successfully"});
    } catch (error) {
        console.log(error);
        return next(new InternalServerError("Some error occured"));
    }
}
export const getProjectById = async(req:Request,res:Response,next:NextFunction)=>{
    const pid = req.query.pid;
    try {
        const project = await Project.aggregate([
            {
              $match: {
                _id: new Schema(pid),
              },
            },
            {
              $lookup: {
                from: 'users',
                as: 'admin',
                localField: 'user',
                foreignField: '_id',
              },
            },
            {
              $unwind: '$contributors',
            },
            {
              $lookup: {
                from: 'users',
                localField: 'contributors.user',
                foreignField: '_id',
                as: 'contributors.userDetails',
              },
            },
            {
              $project: {
                title: { $first: '$title' },
                category: { $first: '$category' },
                description: { $first: '$description' },
                banner: { $first: '$banner' },
                images: { $first: '$images' },
                openForCollab: { $first: '$openForCollab' },
                start: { $first: '$start' },
                end: { $first: '$end' },
                documentation: { $first: '$documentation' },
                demo: { $first: '$demo' },
                currently_working: { $first: '$currently_working' },
                tags: { $first: '$tags' },
                status: { $first: '$status' },
                technologiesUsed: { $first: '$technologiesUsed' },
                live_link: { $first: '$live_link' },
                github: { $first: '$github' },
                // Select only specific fields from the contributors array
                contributors: {
                  $map: {
                    input: '$contributors',
                    as: 'contributor',
                    in: {
                      role: '$$contributor.role',
                      // Assuming 'userDetails' is populated and you want to select specific fields
                      user: {
                        _id: { $arrayElemAt: ['$$contributor.userDetails', 0] }, // Get the populated user
                        name: { $arrayElemAt: ['$$contributor.userDetails.name', 0] }, // Select specific user field (name in this case)
                        email: { $arrayElemAt: ['$$contributor.userDetails.email', 0] }, // Example: email
                      },
                    },
                  },
                },
              },
            },
            {
              $group: {
                _id: '$_id',
                title: { $first: '$title' },
                category: { $first: '$category' },
                description: { $first: '$description' },
                banner: { $first: '$banner' },
                images: { $first: '$images' },
                openForCollab: { $first: '$openForCollab' },
                start: { $first: '$start' },
                end: { $first: '$end' },
                documentation: { $first: '$documentation' },
                demo: { $first: '$demo' },
                currently_working: { $first: '$currently_working' },
                tags: { $first: '$tags' },
                status: { $first: '$status' },
                technologiesUsed: { $first: '$technologiesUsed' },
                live_link: { $first: '$live_link' },
                github: { $first: '$github' },
                contributors: { $push: '$contributors' },
              },
            },
          ]);
          
        if(project.length == 0){
            return next(new NotFoundError("Project not found"));
        }
        res.status(200).json({
            success:true,
            data:project[0]
        });

    } catch (error) {
        console.error(error);
        return next(new InternalServerError("Some error occured"));
    }
}
export const removeProject = async(req:Request,res:Response,next:NextFunction)=>{
  //@ts-ignore
const _user = req.user;
try {
    const user =await User.findById(_user.userId);
    if(!user){
        return next(new ForbiddenError("Invalid session , please login again"))
    }
    const project = await Project.findByIdAndDelete(req.query.pid);
    if(!project){
        return next(new NotFoundError("Project not found"))
    }
    if(project.user!=user._id){
        return next(new ForbiddenError("Access denied"))
    }
    res.status(200).json({success:true,message:"Project removed successfully"});
} catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
}
}
export const getProjects = async(req:Request,res:Response,next:NextFunction)=>{
    const params = req.params;
    
    let filters:any={}
      Object.keys(params).forEach((key)=>{
        if(key!="page" && key!="limit"){
            filters[key] = params[key];
        }
    })
    const page = parseInt((req.query.page || "1") as string);
    const skip = (page-1)*20;
    try {
        const projects = await Project.aggregate([
            {
                $match:filters
            },{
               $lookup:{
                from:'users',
                as:'lead',
                foreignField:'username',
                localField:'lead'
               } 
            },
            {$unwind:"$lead"},
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
                $project:{
                    _id:1,
                    title:1,
                    lead:{
                        username:1,
                        profile:1,
                        name:1
                    },
                    banner:1,
                    description:1,
                }
            },
            {
                $sort: {
                  upvoteCount: -1,
                  downvoteCount:1,
                }
              },
            {$limit:10},{$skip:skip}
        ])
        res.status(200).json({
            success:true,projects:projects
        })
    } catch (error) {
        console.error(error)
        return next(new InternalServerError("Some error occured"));
    }
}
export const getProjectLogs = async(req:Request,res:Response,next:NextFunction)=>{
const pid = req.query.pid;
const page = parseInt((req.query.page || "1") as string)
try {
    const project = await Project.findById(pid);
    if(!project){
        return next(new BadRequestError("Invalid project id"))
    }
    const logs = await ProjectLog.aggregate([
        {$match:
            {
                project_id:project._id
            }
        },
        {
            $project:{
                description:1
            }
        },
        {$skip:(page-1)*20},
        {$limit:20}
    ]);
    res.status(200).json({
        success:true,logs
    })
} catch (error) {
    return next(new InternalServerError("Some error occured"))
}
}
export const addContributor = async(req:Request,res:Response,next:NextFunction)=>{
    //@ts-ignore
    const _user = req.user;
    const {uid,role} = req.body;
    const projectId = req.query.pid;
    try {
        const user =await User.findById(_user.userId)
        if(!user){
            return next(new ForbiddenError("Invalid session, please login again"))
        }
        const project = await Project.findById(projectId);
        if(!project){
            return next(new BadRequestError("Invalid project id"))
        }
        if(project.user!=user._id){
            return next(new ForbiddenError("Access denied"))
        }
        const contributorUser  = await User.findById(uid);
        if(!contributorUser){
            return next(new BadRequestError("User id is invalid"))
        }
        project.contributors.push({
            role:role,
            user:contributorUser._id
        })
        const log  =await ProjectLog.create({
            project_id:project._id,
            description:`${contributorUser.username} was added as contributor with role ${role}`
        })
        res.status(200).json({success:true,message:"Contributor Added successfully"});
    } catch (error) {
        console.error(error)
        return next(new InternalServerError("Some error occured"));
    }
}
export const removeContributor = async(req:Request,res:Response,next:NextFunction)=>{
 //@ts-ignore
 const _user = req.user;
 const {uid} = req.body;
 const projectId = req.query.pid;
 try {
     const user =await User.findById(_user.userId)
     if(!user){
         return next(new ForbiddenError("Invalid session, please login again"))
     }
     const project = await Project.findById(projectId);
     if(!project){
         return next(new BadRequestError("Invalid project id"))
     }
     if(project.user!=user._id){
        return next(new ForbiddenError("Access denied"))
    }
     const contributorUser  = await User.findById(uid);
        if(!contributorUser){
            return next(new BadRequestError("User id is invalid"))
        }
    await Project.updateOne({_id:project._id},{
        $pull:{
            contributors:{user:uid}
        }
    });
     const log  =await ProjectLog.create({
         project_id:project._id,
         description:`${contributorUser.username} was remopved as contributor`
     })
     res.status(200).json({success:true,message:"Contributor Removed successfully"});
 } catch (error) {
     console.error(error)
     return next(new InternalServerError("Some error occured"));
 }
}
export const postVote = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const {p_id, type } = req.query; 
  
    try {

         //@ts-ignore
          const _user = req.user;
  
      if (!_user) {
        return next(new UnauthorizedError("Please Login First"));
      }
  
   
      const user = await User.findById(_user.userId);
      if (!user) {
        return next(new BadRequestError("Please Login First"));
      }

      const resource = await Project.findById(p_id);
      if (!resource) {
        return next(new NotFoundError("No such resource exists"));
      }
  
      // Check if the user has already voted
      const isAlreadyVoted = await Vote.findOne({
        userId: user._id,
        resourceId: resource._id,
      });
  
      if (isAlreadyVoted && isAlreadyVoted.voteType === type) {
        // If the user has already voted for this contribution with the same type, remove the vote
        await Vote.findByIdAndDelete(isAlreadyVoted._id);
        res.status(201).json({
          success: true,
          message: "Vote removed",
        });
      }
  
      // If a new vote or different vote, delete the old vote (if exists) and add the new one
      if (isAlreadyVoted && isAlreadyVoted.voteType !== type) {
        await Vote.findByIdAndDelete(isAlreadyVoted._id); // Delete the old vote
      }
  
      const vote = new Vote({
        resourceId: resource._id,
        userId: user._id,
        voteType: type,
      });
  
      // Save the new vote
      await vote.save();
  
      res.status(200).json({
        success: true,
        message: "Voted successfully",
      });
    } catch (error) {
      console.log(error); // Log the error for debugging
      return next(new InternalServerError("Some error occured"));
    }
  };