import { BadRequestError } from "@errors/BadRequestError";
import { ForbiddenError } from "@errors/ForbiddenError";
import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { CollabRequest, Documentaion, DocumentationSection, Project, ProjectContributor, ProjectLog } from "@models/project.model";
import User from "@models/user.model";
import Vote from "@models/vote.model";
import { NextFunction, Request, Response } from "express"
import mongoose, { Schema } from "mongoose";
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
            {user:user._id,role:"ADMIN"}
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
    const allowedFields = ["title","banner","images","openForCollab","start","end","currently_working","tags","status","category","technologiesUsed","live_link","github","demo",""];
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
        if(!project.user?.equals(user._id)){
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
        console.log(updateFields)
    const p =  await Project.updateOne(
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
      const p = await Project.findById(pid);
      if(!p){
        return next(new NotFoundError("Project not found"))
      }
        const project = await Project.aggregate([
            {
              $match: {
                _id: p._id,
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
 {$unwind:{
   path:"$admin",
     preserveNullAndEmptyArrays: true
 }},
            {
              $lookup: {
                from: 'users',
                localField: 'contributors.user',
                foreignField: '_id',
                as: 'contributors',
              },
            },
            {
              $project: {
                title: 1,
                category:1,
                description: 1,
                banner:1,
                images:1,
                openForCollab: 1,
                start: 1,
                admin:{
                  _id:1,
                  name:1,
                  email:1,
                  profile:1
                },
                end: 1,
                documentation: 1,
                demo:1,
                currently_working: 1,
                tags:1,
                status:1,
                technologiesUsed: 1,
                live_link: 1,
                github: 1,
                // Select only specific fields from the contributors array
                contributors: {
                  $map: {
                    input: '$contributors',
                    as: 'contributor',
                    in: {
                     
                      // Assuming 'userDetails' is populated and you want to select specific fields
                      user: {
                        _id: "$$contributor._id", // Get the populated user
                        name:"$$contributor.name", // Select specific user field (name in this case)
                        email: "$$contributor.email", // Example: email
                      },
                    },
                  },
                },
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
    const params = req.query;
    console.log(params)
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
                foreignField:'_id',
                localField:'user'
               } 
            },
            {$unwind:{
              path:"$lead",
              preserveNullAndEmptyArrays:true
            }},
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
                $replaceRoot: {
                  newRoot: {
                    $mergeObjects: [
                      { upvoteCount: "$upvoteCount", downvoteCount: "$downvoteCount" },
                      "$data", // Spread the `data` object into the parent
                    ],
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
            {$limit:20},{$skip:skip}
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
        const contributor = await ProjectContributor.create({
          user:contributorUser._id,
          project_id:project._id,
          role:role,
          name:contributorUser.name,
          profile:contributorUser.profile
        });

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
 const {cid} = req.params;
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
     const contributor  = await ProjectContributor.findByIdAndDelete(cid);
        if(!contributor){
            return next(new BadRequestError("Contributor id is not valid"))
        }
   
     const log  =await ProjectLog.create({
         project_id:project._id,
         description:`${contributor.name} was remopved as contributor`
     })
     res.status(200).json({success:true,message:"Contributor Removed successfully"});
 } catch (error) {
     console.error(error)
     return next(new InternalServerError("Some error occured"));
 }
}
export const editContributor = async(req:Request,res:Response,next:NextFunction)=>{

  const {cid,role} = req.body;

  try {
     
      
     
    
      const contributor = await ProjectContributor.findByIdAndUpdate(cid,{
        role:role
      });
if(!contributor){
  return next(new BadRequestError("No such contributor exists"))
}
      const log  =await ProjectLog.create({
          project_id:contributor.project_id,
          description:`${contributor.name}'s role was changed to ${role}`
      })

      res.status(200).json({success:true,message:"Contributor Updated successfully"});
  } catch (error) {
      console.error(error)
      return next(new InternalServerError("Some error occured"));
  }
}


export const getCollaborationRequestStatus = async(req:Request,res:Response,next:NextFunction)=>{
  //@ts-ignore
  const _user = req.user;
  const project_id = req.params.id;
  try {
    const collaboration = await CollabRequest.findOne({
      user_id:_user.userId,
      project_id
    });
    if(!collaboration){
      res.status(200).json({
        success:true,request:null
      })
      return;
    }
    else{
      res.status(200).json({
        success:true,request:{
          _id:collaboration._id,
          createdAt:collaboration.createdAt,
          status:collaboration.status
        }
      })
    }
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"))
  }
}  
export const sendCollabRequest = async(req:Request,res:Response,next:NextFunction)=>{
  const {skills,motive,contact_no,contact_email} = req.body;
  const project_id = req.params.id;
  //@ts-ignore
  const _user = req.user;
  try {
    const project = await Project.findById(project_id);
    if(!project){
      return next(new BadRequestError("Project does not exists"))
    }
    const request = await CollabRequest.create({
      project_id:project._id,
      user_id:_user.userId,
      skills:skills.split(',').map((s:string)=>s.trim()),
      contact_email,
      contact_no,
      motive
    });
    res.status(200).json({success:true,request:{
      _id:request._id,
      createdAt:request.createdAt,
      status:"Pending"
    }});
  } catch (error) {
    console.error(error)
    return next(new InternalServerError("Some error occured"))
  }
}
export const getProjectDashboard = async(req:Request,res:Response,next:NextFunction)=>{
  const project_id = req.params.id;
  try {
    const projectData = await Project.aggregate([
      {
        $match:{
          _id:new mongoose.Types.ObjectId(project_id)
        }
      },
      {
        $lookup:{
          from:"projectcontributor",
          as:"contributors",
          localField:"_id",
          foreignField:"project_id"
        }
      },
      {
        $lookup:{
          from:"documentationsections",
          as:"documentation_sections",
          localField:"_id",
          foreignField:"project_id"
        }
      },
      {
        $lookup:{
          from:"projectlogs",
          as:"project_logs",
          localField:"_id",
          foreignField:"project_id"
        }
      },
      {$lookup:{
        from:"collabrequests",
        as:"collab_requests",
        localField:"_id",
        foreignField:"project_id"
      }},
      {
        $project:{
          _id:1,
          category:1,
          title:1,
          banner:1,
          description:1,
          tags:1,
          live_link:1,
          github:1,
          contributors:1,
          totalContributors:{$size:"$contributors"},
          totalDocumentationPages:{$size:"$documentation_sections"},
          totalLogs:{$size:"$project_logs"},
          totalCollabRequests:{$size:"$collab_requests"}
        }
      }
    ]);
    res.status(200).json({
      success:true,
      data:projectData
    })
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"))
  }
}
export const getCollabRequests = async(req:Request,res:Response,next:NextFunction)=>{
  const {skills,role,page} = req.body.filters;
  try {
    const filters:any = {

    }
    if(skills){
      filters.skills={
        $all:skills
      }
    }
    if(role){
      filters.role={
        $in:role
      }
    }
    const collabRequests = await CollabRequest.aggregate([
{
  $match:filters
},

{
  $skip:(page-1)*20,
},
{$limit:20},
{
  $project:{
    user_id:1,
    skills:1,
    role:1,
    contact_no:1,
    _id:1
  }
}
    ])
    const totalRequests = await CollabRequest.find(filters).countDocuments();
    res.status(200).json({success:true,requests:collabRequests,totalResults:totalRequests})
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
}
export const getCollabRequestById = async(req:Request,res:Response,next:NextFunction)=>{
  const request_id = req.params.id;
  try {
    const request = await CollabRequest.aggregate([
      {
        $match:{
          _id:new mongoose.Types.ObjectId(request_id)
        }
      },
      {
        $lookup:{
          from:"users",
          as:"userDetails",
          localField:"user_id",
          foreignField:"_id"
        }
      },
      {$unwind:"$userDetails"},
      {
        $project:{
          user_id:1,
          skills:1,
          role:1,
          status:1,
          motive:1,
          contact_no:1,
          contact_email:1,
          userDetails:1
        }
      }
    ]);
    res.status(200).json({success:true,request:request});
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"))
  }
}
export const updateCollabRequest = async(req:Request,res:Response,next:NextFunction)=>{
const rid = req.params.id;
const type = req.query.type;
try {
  const request = await CollabRequest.findByIdAndUpdate(rid,{
    status:type
  });
  if(!request){
    return next(new BadRequestError("Request not found"));
  }
  res.status(200).json({success:true,request});
} catch (error) {
  console.error(error);
  return next(new InternalServerError("Some error occured"))
}
}
export const addDocumentSection = async(req:Request,res:Response,next:NextFunction)=>{
  const project_id = req.params.pid;
  const data = req.body;
  try {
    let documentation = await Documentaion.findOne({
      project_id:project_id
    })
    if(!documentation){
      documentation = await Documentaion.create({
        project_id:project_id,
        sections:[]
      });

    }
    let parent = null;
    if(data.parent){
      parent = await DocumentationSection.findById(data.parent);
      if(!parent){
        return next(new BadRequestError("Invalid data"))
      }
    }
    let prev = null;
    if(data.prev){
prev = await DocumentationSection.findById(data.prev);
if(!prev){
  return next(new BadRequestError("Invalid data"));
}
    }
    let nextS = null;
    if(data.next){
      nextS = await DocumentationSection.findById(data.next);
      if(!nextS){
        return next(new BadRequestError("Invalid data"))
      }
    }
    const section = await DocumentationSection.create({
      project_id:project_id,
      parent:parent?._id,
      prev:prev?._id,
      next:nextS?._id,
      title:data.title,
      description:data.description,
      documentationId:documentation._id
    });
    if(nextS){
      nextS.prev = section._id;
      await nextS.save();
    }
    if(prev){
      prev.next = section._id;
      await prev.save();
    }
    res.status(200).json({
      success:true,section
    })
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"))
  }
}
export const deleteDocumentationSection = async(req:Request,res:Response,next:NextFunction)=>{
  const section_id = req.query.id;
  try {
    const section = await DocumentationSection.findByIdAndDelete(section_id);
    if(!section){
      return next(new BadRequestError("Section not found"))
    }
    if(section.prev){
      await DocumentationSection.findByIdAndUpdate(section.prev,{
        next:section.next
      });
    }
    if(section.next){
      await DocumentationSection.findByIdAndUpdate(section.next,{
        prev:section.prev
      })
    }
res.status(200).json({success:true,message:"Section deleted"});
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"))
  }
}
export const updateDocumentationSection = async(req:Request,res:Response,next:NextFunction)=>{
  const section_id = req.query.id;
  const posChange = req.query.ispos_change;

  const data = req.body;
  try {
    const section = await DocumentationSection.findById(section_id);
    if(!section){
      return next(new BadRequestError("No such section exists"));
    }
    const changedSections:Array<mongoose.Document> = [];
    if(posChange){
      if(section.prev){
const prevSection = await DocumentationSection.findById(section.prev);
prevSection!.next = section.next;
changedSections.push(prevSection!)      
}
if(section.next){
  const nextSection = await DocumentationSection.findById(section.next);
  nextSection!.prev = section.prev;
  changedSections.push(nextSection!)
}

      if(data.newPos.prev){
        const prev = await DocumentationSection.findById(data.newPos.prev);
   
        if(!prev){
          return  next("Invalid previous section");
  
        }
        section.prev = prev?._id;
        if(!data.newPos.next){
          section.next = null;
        }
      }
        if(data.newPos.next)
        {
          const nextS = await DocumentationSection.findById(data.newPos.next);
          if(!nextS){
            return next(new BadRequestError("Invalid previous section"));
          }
          section.next = nextS._id;
        }
      
    }
    if(data.title){
      section.title = data.title;
    }
    if(data.description){
      section.description = data.description
    }
    changedSections.push(section);
    await DocumentationSection.bulkSave(changedSections)
   res.status(200).json({
    success:true,section
   })
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
}
