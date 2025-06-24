import { ForbiddenError } from "@errors/ForbiddenError";
import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";
import User from "@models/user.model";
import { UserRoles } from "../@types/index";
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken'
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { Project } from "@models/project.model";
import { BadRequestError } from "@errors/BadRequestError";
import Club from "@models/club/club.model";
import { APIError } from "@errors/APIError";
import mongoose from "mongoose";
import ClubMember from "@models/club/club.members";
import ClubTeam from "@models/club/club.team.model";
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get the token from Authorization header (Bearer token)
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
       return   next(new UnauthorizedError('No Token Provided'))
      }
  
      // Verify the token
      const decoded = jwt.verify(token!, process.env.ACCESS_TOKEN_SECRET!) as JwtPayload
      if (!decoded) {
       return next(new UnauthorizedError('Invalid token'))
      }
  

      const user = await User.findById(decoded.userId);
      if(!user)
      {
        return next(new UnauthorizedError("Invalid token"))
      }
      req.user = {
        userId:decoded.userId,
        _id:decoded.userId,
        role:user.role,
      };
      
      next(); 
    } catch (error) {
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  };
 export const optionalAuth = (req:Request, res:Response, next:NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Assuming Bearer Token
  console.log(token)
    if (token) {
      try {
        const decoded = jwt.verify(token!, process.env.ACCESS_TOKEN_SECRET!) as JwtPayload
       console.log(decoded);
        //@ts-ignore
        req.user = {
         _id:decoded.userId
        };
        next();
      } catch (error) {
        console.error(error);
        next();
      }
    
    } else {
      next(); // No token, proceed without user info
    }
  };
  
  export const authorize = async(roles: UserRoles[],next:NextFunction,req:Request) => {
   
      try {
        // Get user ID from the request object (added by authentication middleware)
        //@ts-ignore
       //@ts-ignore
       //@ts-ignore
        const _user = req.user;
        
        if (!_user) {
            return next(new NotFoundError("User not found"));
        }
  
        // Find the user from the database to get their role
        console.log(_user)
        const user = await User.findById(_user.userId);
        if (!user) {
          return next(new NotFoundError("User not found"));
        }
        if (!roles.includes(user.role as UserRoles)) {
          return next(new ForbiddenError("Insufficient permissions"))
        }
  
        next(); // Proceed to the next middleware or route handler
      } catch (error) {
        console.error(error);
        return next(new InternalServerError("Some error occured"));
      }
    };

export const projectAuhtorize = async(req:Request,res:Response,next:NextFunction)=>{
  //@ts-ignore
  const _user = req.user;
  console.log(_user);
  try {
    if(!_user){
      return next(new BadRequestError("Please login first"))
    }
    const user = await User.findById(_user.userId);
    const projectId = req.query.pid || req.params.pid ;
    if(!projectId){
      return next(new BadRequestError("Invalid project id"))
    }
    if(!user){
      return next(new ForbiddenError("Invalid session , please login again"))
    }
    const project = await Project.findById(projectId as string);
    if(!project){
      return next(new BadRequestError("Project not found"))
    }
    if(!project.user?.equals(user._id)){
      return next(new ForbiddenError("You don't have permissions"))
    }
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"))
  }
 
   next();
}
export const isClubAdmin = async(req:Request,res:Response,next:NextFunction)=>{
 //@ts-ignore
  const _user = req.user;

  try {
    if(!_user){
      return next(new BadRequestError("Please login first"))
    }
    const user = await User.findById(_user.userId);
    const clubId = req.query.club_id || req.params.club_id ;
    if(!clubId){
      return next(new BadRequestError("Invalid club id"))
    }
    if(!user){
      return next(new ForbiddenError("Invalid session , please login again"))
    }
    const club = await Club.findById(clubId as string);
    if(!club){
      return next(new BadRequestError("Project not found"))
    }
    if(!club.admin?.equals(user._id)){
      return next(new ForbiddenError("You don't have permissions"))
    }
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"))
  }
 
   next();
}
export const isClubMember = async(req:Request,res:Response,next:NextFunction)=>{
  //@ts-ignore 
  const _user = req.user;
  const club_id = req.query.club_id;

  const member = await ClubMember.findOne({userId:_user.userId,clubId:club_id as string});
  if(!member){
    return next(new ForbiddenError("You don't have permission"));
  }
  // req.team = member.teamId;
  //@ts-ignore
  req.member = {_id:member._id}
  next();
}
export const isTeamLead = async(req:Request,res:Response,next:NextFunction)=>{
  //@ts-ignore
  const _user = req.user;
  const club_id = req.query.club_id;
  const team_id = req.query.team_id;
  const team  = await ClubTeam.findById(team_id).populate('head');
  if(!team){
    return next(new NotFoundError("Team not found"))
  }
  if(!(team.head as any)?.userId.equals(_user.userId)){
    return next(new ForbiddenError("Don;t have permission"));
  } 
}
export const isAuthorisedToPerformClubAction = async(member:string,resource:string|mongoose.Model<any>,resourceId:string,action:string)=>{
try {
  
} catch (error) {
  console.error(error);
throw new APIError("Some error occured",500);
}
}
export const isAdmin = async(req: Request, res: Response, next: NextFunction) => {
  // Check if user is attached to the request (auth middleware must run before this)
  if (!req.user) {
     res.status(401).json({ success: false, message: "Unauthorized: No user found" })
     return;
  }

  // Check if user has admin role
  if (req.user.role !== "ADMIN") {
  res.status(403).json({ success: false, message: "Forbidden: Admins only" });
  return;
  }

  next(); // ✅ User is admin, proceed
};