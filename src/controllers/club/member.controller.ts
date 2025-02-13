import { BadRequestError } from "@errors/BadRequestError";
import { ForbiddenError } from "@errors/ForbiddenError";
import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import ClubMember from "@models/club/club.members";
import Club from "@models/club/club.model";
import User from "@models/user.model";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

// admin only operations
export const addMember = async(req:Request,res:Response,next:NextFunction)=>{
    try {
 
        const {club_id} = req.query;
        const {  userEmail, role, teamId, status, joinedAt } = req.body;
    

    
        const user = await User.findOne({email:userEmail});
    
        if (!user || !user.verified) {
          return next(new ForbiddenError("User doesn't exist on the platform"))
        }
    
        const member = await ClubMember.create({
          clubId: club_id as string,
          userId: user._id,
          role: role,
          name:user.name,
          teamId: teamId,
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
       
    const member_id = req.query.member_id
        const {  role, teamId, status } = req.body;
    
        const member = await ClubMember.findById(member_id).populate('clubId');
    
        if (!member) {
          return next(new NotFoundError("Member not found"));
        }
    
     
     
        // Update member details
        if (role) member.role = role;
        if (teamId) member.teamId = teamId;
        if (status) member.status = status;
    
        await member.save();
    
       res.status(200).json({ success: true, message: 'Member updated successfully' });
      } catch (error) {
        console.error('PUT /update-club-member error:', error);
        return next(new InternalServerError("Somer error occured"));
      }
}
export const getMembers = async(req:Request,res:Response,next:NextFunction)=>{

    const {name,teamId,page,club_id} = req.query;
  try {
  const filters:any = {
  
  }
  if(name&&name!=""){
    filters.name = {
      $regex:`^${name}`,
      $options:'i'
    }
  }

  if(teamId&&(teamId as string).length>0){
    filters.teamId =new mongoose.Types.ObjectId(teamId as string)
  }

    filters.clubId = new mongoose.Types.ObjectId(club_id as string);
    filters.status = "Active"
  
    const members = await ClubMember.aggregate([
      {$match:filters,
     
    },
    {
      $lookup:{
        from:'users',
        as:'user',
        localField:'userId',
        foreignField:'_id'
      }
    },
    {
        $lookup:{
            from:'clubteams',
            as:'team',
            localField:"teamId",
            foreignField:"_id"
        }
    },
    {$sort:{status:1}},
    {$skip:(parseInt(page as string)-1)*20},
    {$limit:20},
    {$unwind:"$user"},
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            { crole: "$role", team: "$team",joinedAt:"$joinedAt",mid:"$_id" },
           
            "$user", // Spread the `data` object into the parent
          ],
        },
      },
    },
    {$project:{
      mid:1,
      crole:1,
      team:{
        title:1,
      },
      joinedAt:1,
      name:1,
      email:1,
      username:1,
      profile:1
    }}
    ])
    const totalResults = await ClubMember.find(filters).countDocuments();
    res.status(200).json({success:true,members,totalResults:totalResults})
  } catch (error) {
    console.error(error);
    return next(new InternalServerError ("Some error occured"));
  }
}
export const getMemberById = async(req:Request,res:Response,next:NextFunction)=>{
    
    const {member_id} = req.query;
    try{
      const member=await ClubMember.findById(member_id);
      if(!member){
        return next(new NotFoundError("Member not found"));
      } 
      const aggregation = await ClubMember.aggregate([
        {
          $match:{
            _id:member._id
          },
        },
        {
          $lookup:{
            from:'users',
            as:'userDetails',
            localField:"userId",
            foreignField:"_id"
          }
        },
        {
            $lookup:{
                from:'clubteams',
                as:'team',
                localField:"teamId",
                foreignField:"_id"
            }
        },
        {
            $lookup: {
              from: "clubTasks",
              let: { memberId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$assignedTo", "$$memberId"] }
                  }
                },
                {
                  $facet: {
                    totalCount: [{ $count: "taskCount" }],
                    pendingTasks: [
                      { $match: { status: "Pending" } },
                      { $sort: { createdAt: -1 } }, // Sort by latest tasks
                      { $limit: 20 }
                    ]
                  }
                }
              ],
              as: "taskData"
            }
          },
          {
            $addFields: {
              totalTasks: {
                $ifNull: [{ $arrayElemAt: ["$taskData.totalCount.taskCount", 0] }, 0]
              },
              pendingTasks: "$taskData.pendingTasks"
            }
          },
        {$unwind:"$userDetails"},
        {$project:{
          role:1,
          totalTasks:1,
          pendingTasks:1,
          team:{
            title:1
          },
          status:1,
          joinedAt:1,
          userDetails:{
            profile:1,
            name:1,
            email:1,
            username:1,
            bio:1,
            socials:1
          }
        }}
      ])
      res.status(200).json({
        success:true,member:aggregation[0]
      })
    }
    catch(error){
      console.log(error)
      return next(new InternalServerError("Some error occured"));
    }
}

