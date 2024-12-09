import { BadRequestError } from "@errors/BadRequestError";
import { ForbiddenError } from "@errors/ForbiddenError";
import { InternalServerError } from "@errors/InternalServerError";
import Channel from "@models/discussion/channel.model";
import Post from "@models/discussion/post.model";
import Reply from "@models/discussion/reply.model";
import PostVote from "@models/discussion/vote";
import User from "@models/user.model";
import Vote from "@models/vote.model";
import { NextFunction, Request, Response } from "express";

export const createChannel = async(req:Request,res:Response,next:NextFunction)=>{
    const _user = req.user;
    const {name,rules,description,category,coverPage,profilePic} = req.body;
    try {
        const user = await User.findById(_user.userId);
        if(!user){
            return next(new ForbiddenError("Invalid session please login again"))
        }
        
        const channel = new Channel({
            name:name,
            admin:user._id,
            category:category,
            coverPage:coverPage?coverPage:null,
            profilePic:profilePic?profilePic:null,
            rules:rules,
            isActive:true,
        });
        await channel.save();
        res.status(200).json({success:true,message:"Channel created successfully"});
    } catch (error) {
        console.error(error);
        return next(new InternalServerError("Some error occured"));
    }
}

export const createPost = async(req:Request,res:Response,next:NextFunction)=>{
    const _user = req.user;
    const {title,content,attachments,tags,channelId} = req.body;
    try {
        const user = await User.findById(_user.userId);
        if(!user){
            return next(new ForbiddenError("Invalid session , please login again"))
        }
        const post = new Post({
title,content,attachments,tags,channel:channelId,author:user._id
        });
        await post.save();
        res.status(200).json({success:true,message:"Post created successfully",id:post._id})
    } catch (error) {
        console.error(error);
        return next(new InternalServerError("Some error occured"));
    }
}

export const reply = async(req:Request,res:Response,next:NextFunction)=>{
    const _user = req.user;
    const {postId,content,attachments,parentId} = req.body;
    try {
        const user = await User.findById(_user.userId);
        if(!user){
            return next(new ForbiddenError("Invalid session , please login again"));
        }
        const post = await Post.findById(postId);
        if(!post){
            return next(new BadRequestError("No such post exists"))
        }
        let parent = null;
        if(parentId){
            parent = await Reply.findById(parentId);
        }

        const reply = new Reply({
            postId,
            content,
            attachments,
            parentId:parent?._id,
            author:user._id
        })
        await reply.save();
        res.status(200).json({success:true,message:"Replied",id:reply._id});
    } 
    catch (error) {
        console.error(error);
        return next(new InternalServerError("Some error occured"));
    }
}
export const deletePost = async(req:Request,res:Response,next:NextFunction)=>{
    const _user = req.user;
    const {postId} = req.body;
    try{
const user = await User.findById(_user.userId);
if(!user){
    return next(new ForbiddenError("Invalid session , please login again"))
}
    const post = await Post.findById(postId);
    if(!post)
    {
        return next(new BadRequestError("Post not found"));
    }
    if(post.author!=user._id){
        return next(new ForbiddenError("Unauthorized"));
    }
    await Post.findByIdAndDelete(post._id);
    res.status(200).json({success:true,message:"Post deleted successfully"});
    }
    catch(error){
        console.error(error);
        return next(new InternalServerError("Some error occured"));
    }
}
export const deleteReply = async(req:Request,res:Response,next:NextFunction)=>{
    const _user = req.user;
    const {replyId} = req.body;
    try{
const user = await User.findById(_user.userId);
if(!user){
    return next(new ForbiddenError("Invalid session , please login again"))
}
    const reply = await Reply.findById(replyId);
    if(!reply)
    {
        return next(new BadRequestError("Post not found"));
    }
    if(reply.author!=user._id){
        return next(new ForbiddenError("Unauthorized"));
    }
    await Reply.findByIdAndUpdate(reply._id);
    res.status(200).json({success:true,message:"Reply removed successfully"});
    }
    catch(error){
        console.error(error);
        return next(new InternalServerError("Some error occured"));
    }
}

export const vote = async(req:Request,res:Response,next:NextFunction)=>{
    const _user = req.user;
    const {postId,voteType} = req.body;
    try {
        const user = await User.findById(_user.userId);
        if(!user)
        {
            return next(new ForbiddenError("Invalid session , please login again"));
        }
        const post =await Post.findById(postId);
        if(!post){
            return next(new BadRequestError("No such post exists"));
        }
        const vote = await PostVote.findOne({
            $and:[{userId:user._id},{postId:post._id}],
        });
        if(vote){
            await PostVote.findByIdAndDelete(vote._id);
if(vote.voteType != voteType){
 await PostVote.create({
    postId:post._id,
    userId:user._id,
    voteType:voteType
 })
}

        }
        else{
            await PostVote.create({
                postId:post._id,
                userId:user._id,
                voteType:voteType
            })
        }
        res.status(200).json({
            success:true,message:"Voted"
        });
    } catch (error) {
        console.error(error);
        return next(new InternalServerError("Some error occured"));
    }
}
export const getPosts = async(req:Request,res:Response,next:NextFunction)=>{
    
}