import { BadRequestError } from "@errors/BadRequestError";
import { InternalServerError } from "@errors/InternalServerError";
import { ValidationError } from "@errors/ValidationError";
import Resources from "@models/resource.model";
import SearchEntity from "@models/search_entity.model";
import Source from "@models/source.model";
import Subject from "@models/subject.model";
import User from "@models/user.model";
import { asyncHandler } from "@utils/api/asyncHandler";
import { NextFunction, Request, Response } from "express";

import { z } from "zod";
const usernameValidation = z
  .string()
  .min(2, "Username must be at least 2 characters")
  .max(20, "Username must be no more than 20 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username must not contain special characters");

const UsernameQuerySchema = z.object({
  username: usernameValidation,
});
export const isUserNameValid = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const queryParams = req.query.username;
console.log(queryParams)
  try {
    // Validate query parameters with Zod schema
    const result = UsernameQuerySchema.safeParse({username:queryParams});
    
    if (!result.success) {
      const usernameErrors = result.error.format().username?._errors || [];
      return next(new ValidationError("Not a valid username"));
    }

    const { username } = result.data;

    // Check if the username is already taken by a verified user
    const existingVerifiedUser = await User.findOne({
      username,
      verified: true,
    });

    if (existingVerifiedUser) {
      res.status(200).json({
        success: false,
        message: "Username is already taken",
      });
    }

    res.status(200).json({
      success: true,
      message: "Username is valid",
    });
  } catch (error) {
    // Handle any unexpected errors
    console.error("Error checking username:", error);
    return next(new InternalServerError("Some error occured"));
  }
};

export const getSubjects = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {year,branch,page,label } = req.query;

    // Build filters dynamically
    const filters: { year?: string,branch?:string,label?:any} = {};
    if (year) {
      filters.year = year.toString();
    }
if(branch){
  filters.branch = branch as string;
}
if(label){
  filters.label = {
    $regex:label,$options:"i"
  }
}
    // Query the database with filters
    const subjects = await Subject.find(filters);

    // Map the results into desired format
    const formattedSubjects = subjects.map((option) => ({
      _id:option._id,
      label: option.label,
      value: option.code,
      id: option.code,
      year:parseInt(option.year),
      code:option.code,
      branch:option.code
    }));

    res.status(200).json({ success: true, subjects: formattedSubjects });
  } catch (error) {
    console.error("GET /api/subjects error:", error);
    return next(new InternalServerError("Some error occured"));
  }
};
// export const getSearchItem = asyncHandler(
//   async(
//     req:Request,
//     res:Response,
//     next:NextFunction
//   )=>{
//     const {search_id} = req.query;
//     const result = 
//   }
// )
export const search = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const query = req.query.q as string;
  const page = parseInt(req.query.page as string) || 1; // default: page 1
  const limit = parseInt(req.query.limit as string) || 10; // default: 10 results per page
  const skip = (page - 1) * limit;

  if (!query) {
    return res.status(400).json({ message: 'Query string `q` is required' });
  }

  const regexQuery = { $regex: query, $options: 'i' };
console.log( { title: regexQuery },
      { content: regexQuery },
      { tags: regexQuery })
const [results, total] = await Promise.all([
  SearchEntity.find({
    $or: [
      { label: regexQuery },
      { content: regexQuery },
      { tags: regexQuery }
    ]
  })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit),

  SearchEntity.countDocuments({
    $or: [
      { label: regexQuery },
      { content: regexQuery },
      { tags: regexQuery }
    ]
  })
]);

  const totalPages = Math.ceil(total / limit);
console.log(results)
  res.json({
    currentPage: page,
    totalPages,
    totalResults: total,
    results:results.map(result=>({...result.toObject(),url:getSearchURL(result.type,result.refId.toString())}))
  });
});

export const getSources = async(req:Request,res:Response,next:NextFunction)=>{
  let {page=0} = req.query
  try {
    const sources = await Source.find().limit(20).skip((parseInt(page as string)-1)*20);
    res.status(200).json({success:true,data:sources})
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"))
  }
}
// const getModelForType = (type: string) => {
//   switch (type) {
//     case 'user': return User;
//     case 'resource': return Resources;
    
//     case 'event': return Event;
//     default: throw new Error('Unknown type');
//   }
// };
const getSearchURL = (type:string,refId:string)=>{
  switch(type)
  {
    case 'user':return `/user/${refId}`;
    case 'resource': return `/resource/${refId}`;
    case 'event':return `/event/${refId}`;
    case 'lectures':return `/lectures/${refId}`;
    default: throw new Error("Unknown type");
  }
}