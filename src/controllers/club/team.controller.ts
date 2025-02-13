import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";
import ClubMember from "@models/club/club.members";
import ClubTeam from "@models/club/club.team.model";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
// club admin only task
export const addClubTeam = async(req:Request,res:Response,next:NextFunction)=>{
    const {title,description} = req.body;
    const clubId = req.query.club_id;
    try {
        const team = await ClubTeam.create({
            title:title,
            description:description,
            club:clubId
        })
        res.status(200).json({success:true,team:team});
    } catch (error) {
        console.error(error);
        return next(new InternalServerError("Some error occured"));
    }
}
export const removeTeam = async(req:Request,res:Response,next:NextFunction)=>{
    const {team_id} = req.query;
    try {
        const team = await ClubTeam.findByIdAndUpdate(team_id,{
            status:"removed"
        })
        if(!team){
            return next(new NotFoundError("team not found"));
        
        }
        res.status(204);
    } catch (error) {
        console.error(error);
        return next(new InternalServerError("some error occured"));
    }
}

export const updateTeam = async(req:Request,res:Response,next:NextFunction)=>{
    const {team_id} = req.query;
    const {title,head} = req.body;
    try {
        const team = await ClubTeam.findById(team_id);
        if(!team){
            return next(new NotFoundError("team not found"));

        }
        if(head){
            const headUser = await ClubMember.findById(head);
            if(!headUser){
                return next(new NotFoundError("Club member not found"));
            }
            team.head = headUser._id;
        }
        if(title){
            team.title = title;
        }
        await team.save();
res.status(200).json({success:true,team:team});
    } catch (error) {
        console.error(error);
        return next(new InternalServerError("some error occured"));
    }

}

export const getTeamById = async(req:Request,res:Response,next:NextFunction)=>{
    const {team_id} = req.query;
    
    try {
        const team = await ClubTeam.aggregate([
            {$match:{
                _id:new mongoose.Types.ObjectId(team_id as string),
                status:"active"
            }},
            // top pending tasks
            {
                $lookup:{
                    from:'clubtasks',
                    as:'tasks',
                    let:{teamId:"$_id"},
                    pipeline:[
                        {
                            $match:{
                                $expr:{$and:[{$eq:["$teamId","$$teamId"]},{$ne:["$status","completed"]}]}
                            }
                        },
                        {
                            $lookup:{
                                from:'clubteams',
                                as:'team',
                                localField:"$teamId",
                                foreignField:"_id"
                            }
                        },
                        {$unwind:{
                            path:"$team",
                            preserveNullAndEmptyArrays:true
                        }},
                        {
                            $lookup:{
                                from:'clubmembers',
                                as:'assignedTo',
                                localField:"$assignedTo",
                                foreignField:"_id"
                            }
                        },
                        {$unwind:{
                            path:"$assignedTo",
                            preserveNullAndEmptyArrays:true,
                        }},
                        { $limit: 10 }, // Fetch top 10 tasks
                        {
                          $project: {
                            title: 1,
                            description: 1,
                            status: 1,
                            team:"$team.title",
                            priority: 1,
                            dueDate: 1,
                            assignedTo:"$assignedTo.name",
                          },
                        },
                    ]
                }
            },
            //total tasks
            {
                $lookup: {
                  from: "clubtasks",
                  let: { teamId: "$_id" },
                  pipeline: [
                    { $match: { $expr: { $and:[{$eq: ["$teamId", "$$teamId"]}] } } },
                    { $count: "totalTasks" },
                  ],
                  as: "taskCount",
                },
              },
            //
              {
                $addFields: {
                  totalTasks: { $ifNull: [{ $arrayElemAt: ["$taskCount.totalTasks", 0] }, 0] },
                },
              },
         
          
              // team members
              {$lookup:{
                from:"clubmembers",
                as:"members",
                let:{teamId:"$_id"},
                pipeline:[
                    {
                        $match:{
                            $expr:{$and:[{$eq:["$teamId","$$teamId"]},{$eq:["$status","Active"]}]}
                        }
                    },
                    {$lookup:{
                        from:"users",
                        as:"userDetails",
                        localField:"userId",
                        foreignField:"_id"
                    }},
                    {
                        $project:{
                            _id:1,
                            name:"$userDetails.name",
                            profile:"$userDetails.profile",
                            username:"$userDetails.username",
                            role:1
                        }
                    }
                ]
              }},
              {$project:{
                title:1,
                description:1,
                status:1,
                members:1
              }}
        ]);
        if(!team || team.length==0){
            return next(new NotFoundError("Team not found"));
        }
        res.status(200).json({
            success:true,team:team
        })
    } catch (error) {
        console.error(error)
        return next(new InternalServerError("Some error occured"));
    }
}