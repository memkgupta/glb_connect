import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";
import ClubTask, { TaskComment } from "@models/club/tasks/task.model";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

export const assignTask = async(req:Request,res:Response,next:NextFunction)=>{
    const {title,description,assignedTo,status,attachements,dueDate,teamId,priority,assignedBy} =req.body;
    try {
        const task = await ClubTask.create({
            title:title,
            description:description,
            assignedBy:assignedBy,
            assignedTo:assignedTo,
            status:status,
            attachements:attachements,
            priority:priority,
            teamId:teamId,
            dueDate:dueDate,
        });
        res.status(200).json({
            success:true,
            task
        })
    } catch (error) {
        console.error(error)
        return next(new InternalServerError("Some error occured"))
    }
}

export const deleteTask = async(req:Request,res:Response,next:NextFunction)=>{
    const {task_id} = req.query;
    try {
        
        const task = await ClubTask.findByIdAndDelete(task_id)
        if(!task)
        {
            return next(new NotFoundError("Task not found"))
        }
        res.status(204)
    } catch (error) {
        console.error(error)
        return next(new InternalServerError("Some error occured"))
    }
}
export const updateTask = async(req:Request,res:Response,next:NextFunction)=>{
    const {task_id} = req.query;
    const {
        title,description,assignedTo,status,attachements,dueDate,priority
    } = req.body;
    try {
        const task = await ClubTask.findById(task_id)
        if(!task){
            return next(new NotFoundError("Task not found"));
        }
        if(title){
            task.title = title;
        }
        if(description){
            task.description = description
        }
        if(assignedTo){
            task.assignedTo = assignedTo
        }
        if(status){
            task.status = status
        }
        // if(attachements)
        if(attachements && attachements.length>0){
            task.attachements = attachements
        }
        if(dueDate)
        {
            task.dueDate = dueDate
        }
        if(priority){
            task.priority = priority;
        }
        await task.save();
        res.status(200).json({success:true,task});

    } catch (error) {
        console.error(error)
        return next(new InternalServerError("Some error occured"))
    }
}
export const getMyTasks = async(req:Request,res:Response,next:NextFunction)=>{
    const {member_id,page,priority,dueDate,status} = req.query;
    try {
        const filters:any = {}
        if(priority){
            filters.priority = priority
        }
        if(dueDate){
            filters.dueDate = {
                $gte:dueDate
            }
        }
        if(status){
            filters.status = status
        }
        const tasks = await ClubTask.aggregate([
            {
                $match:{...filters,
                    assignedTo:new mongoose.Types.ObjectId(member_id as string),
                }
            },{
                $skip:(parseInt(page!.toString())-1)*20
            },{
                $limit:20
            },
            {
                $lookup:{
                    from:'clubmembers',
                    as:'assignedBy',
                    localField:'assignedBy',
                    foreignField:"_id"
                }
            },
            {
                $project:{
                    title:1,
                    description:1,
                    assignedBy:{
                        role:1,
                        name:1,
                        _id:1
                    },
                    status:1,
                    dueDate:1,
                    priority:1,
                    
                }
            }
        ]) 
        const totalTasks = await ClubTask.find(filters).countDocuments()
        res.status(200).json({success:true,tasks:1,totalResults:totalTasks})
    } catch (error) {
        console.error(error)
        return next(new InternalServerError("Some error occured"))

    }
}
export const addComment = async(req:Request,res:Response,next:NextFunction)=>{
    const {comment,member_id,task_id} = req.body;
    try {
        const tcomment = await TaskComment.create({
            comment:comment,
            member:member_id,
            task:task_id
        })
        res.status(200).json({success:true,comment:tcomment})
    } catch (error) {
        console.error(error)
        return new InternalServerError("Server error occured");
    }
}
export const getTaskById = async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {task_id} = req.query
        const task = await ClubTask.aggregate([{
            $match:{
                _id:new mongoose.Types.ObjectId(task_id as string)
            },
        },
        //assigned to
    {  
    $lookup:{
        from:"clubmembers",
        as:"assignedTo",
        let:{memberId:"$assignedTo"},
        pipeline:[
            {
                $match:{
                    $expr:{$eq:["$_id","$$memberId"]}
                },
            },
            {
                $lookup:{
                    from:"users",
                    localField:"userId",
                    foreignField:"_id",
                    as:"userDetails"
                }
            },
            {$unwind:{
                path:"$userDetails",
                preserveNullAndEmptyArrays:true
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
    }
    },
    //assigned by
    {  
        $lookup:{
            from:"clubmembers",
            as:"assignedBy",
            let:{memberId:"$assignedTo"},
            pipeline:[
                {
                    $match:{
                        $expr:{$eq:["$_id","$$memberId"]}
                    },
                },
                {
                    $lookup:{
                        from:"users",
                        localField:"userId",
                        foreignField:"_id",
                        as:"userDetails"
                    }
                },
                {$unwind:{
                    path:"$userDetails",
                    preserveNullAndEmptyArrays:true
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
        }
        },
    {
        $project:{

        }
    }
])
if(!task || task.length==0) 
{
    return next(new NotFoundError("Task not found"))
}
res.status(200).json({success:true,task:task[0]});
    } catch (error) {
        return next(new InternalServerError("Some error occured"));
    }
}
export const completeTask = async(req:Request,res:Response,next:NextFunction)=>{
    const taskId = req.query.task_id;
    const {comment,attachements} = req.body;
    try {
        const task = await ClubTask.findById(taskId)
        if(!task){
            return next(new NotFoundError("Task not found"))
        }
        task.completionComment = comment;
        task.attachements.push(attachements);
        task.completedAt = new Date()

        await task.save();

        res.status(200).json({success:true,message:"Task completed"});
    } catch (error) {
        console.error(error)
        return next(new InternalServerError("Some error occured"));
    }
}
export const getEventTasks = async(req:Request,res:Response,next:NextFunction)=>{
const {event_id,page,team} = req.query;
try{
    const filters:any={}
    if(team){
        filters.teamId = new mongoose.Types.ObjectId(team as string)
    }
    const tasks = await ClubTask.aggregate([
        {
            $match:{...filters,
                event:new mongoose.Types.ObjectId(event_id as string),
            }
        },{
            $skip:(parseInt(page!.toString())-1)*20
        },{
            $limit:20
        },
        {
            $lookup:{
                from:'clubmembers',
                as:'assignedBy',
                localField:'assignedBy',
                foreignField:"_id"
            }
        },
        {
            $project:{
                title:1,
                description:1,
                assignedBy:{
                    role:1,
                    name:1,
                    _id:1
                },
                status:1,
                dueDate:1,
                priority:1,
                
            }
        }
    ]) 
}
catch(error){
    console.error(error);
    return next(new InternalServerError("Some error occured"))
}
}