import { ForbiddenError } from "@errors/ForbiddenError";
import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";
import User from "@models/user.model";
import { UserRoles } from "../@types/index";
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken'
import { UnauthorizedError } from "@errors/UnauthorizedError";
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
  
      // Attach user info to request object for further use in next middleware
      //@ts-ignore
      req.user = {
        userId:decoded.userId
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
        //@ts-ignore
        req.user = {
          userId:decoded.userId
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
  
  export const authorize = async(roles: UserRoles[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
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
  };