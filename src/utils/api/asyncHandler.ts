import { APIError } from "@errors/APIError";
import { BadRequestError } from "@errors/BadRequestError";
import { InternalServerError } from "@errors/InternalServerError";
import { NextFunction,Request,Response } from "express";
import { ZodError } from "zod";

export const asyncHandler = (fn:(req:Request,res:Response,next:NextFunction)=>Promise<any>)=>{
    return async(req:Request,res:Response,next:NextFunction)=>{
        try{
            await fn(req,res,next)
        }
        catch(error:any)
        {
             console.log(error)
                    if(error instanceof ZodError)
                    {
                        return next(new BadRequestError(JSON.stringify(error.errors.map(err=>({field:err.path,message:err.message})))))
                    }
                    if(error instanceof APIError){
                        return next(error)
                    }
                    return next(new InternalServerError("Some error occured"))
        }
    }
} 