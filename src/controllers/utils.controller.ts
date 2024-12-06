import { InternalServerError } from "@errors/InternalServerError";
import { ValidationError } from "@errors/ValidationError";
import User from "@models/user.model";
import { NextFunction, Request, Response } from "express";
import {z} from 'zod';
const usernameValidation = z
  .string()
  .min(2, 'Username must be at least 2 characters')
  .max(20, 'Username must be no more than 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username must not contain special characters');

const UsernameQuerySchema = z.object({
  username: usernameValidation,
});
export const isUserNameValid = async(req:Request,res:Response,next:NextFunction)=>{
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const queryParams = {
      username: searchParams.get('username'),
    };
  
    try {
      // Validate query parameters with Zod schema
      const result = UsernameQuerySchema.safeParse(queryParams);
  
      if (!result.success) {
        const usernameErrors = result.error.format().username?._errors || [];
        return next(new ValidationError("Not a valid username"));
      }
  
      const { username } = result.data;
  
      // Check if the username is already taken by a verified user
      const existingVerifiedUser = await User.findOne({ username, verified: true });
  
      if (existingVerifiedUser) {
         res.status(200).json({
          success: false,
          message: 'Username is already taken',
        });
      }
  
       res.status(200).json({
        success: true,
        message: 'Username is valid',
      });
  
    } catch (error) {
      // Handle any unexpected errors
      console.error('Error checking username:', error);
      return next(new InternalServerError("Some error occured"))
    }
}