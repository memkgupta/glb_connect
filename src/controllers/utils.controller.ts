import { BadRequestError } from "@errors/BadRequestError";
import { InternalServerError } from "@errors/InternalServerError";
import { ValidationError } from "@errors/ValidationError";
import Resources from "@models/resource.model";
import Source from "@models/source.model";
import Subject from "@models/subject.model";
import User from "@models/user.model";
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
  const queryParams = req.query.search;

  try {
    // Validate query parameters with Zod schema
    const result = UsernameQuerySchema.safeParse(queryParams);

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
    const { year } = req.query;

    // Build filters dynamically
    const filters: { year?: string } = {};
    if (year) {
      filters.year = year.toString();
    }

    // Query the database with filters
    const subjects = await Subject.find(filters);

    // Map the results into desired format
    const formattedSubjects = subjects.map((option) => ({
      label: option.label,
      value: option.code,
      id: option.code,
    }));

    res.status(200).json({ success: true, subjects: formattedSubjects });
  } catch (error) {
    console.error("GET /api/subjects error:", error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const search = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract query parameters
    const { type, query } = req.query;

    if (!query) {
      return next(new BadRequestError("Query parameters is required"))
    }

    let results;

    if (type === "users") {
      // Search in users
      const users = await User.find(
        { $text: { $search: query.toString(), $caseSensitive: false } },
        { score: { $meta: "textScore" } }
      )
        .select(["name", "username", "_id", "profile"])
        .sort({ score: { $meta: "textScore" } })
        .limit(10);

      results = users.map((user) => ({
        label: user.name,
        thumbnail: user.profile,
        sub: user.username,
        href: `/user/${user.username}`,
      }));
    } else {
      // Search in contributions
      const resources = await Resources.find(
        { $text: { $search: query.toString(), $caseSensitive: false } },
        { score: { $meta: "textScore" } }
      )
        .select(["label", "branch", "_id"])
        .sort({ score: { $meta: "textScore" } })
        .limit(10);

      results = resources.map((res) => ({
        label: res.label,
        sub: res.branch,
        href: `/resources/${res._id}`,
        thumbnail: null,
      }));
    }

    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error("GET /search error:", error);
    res
      .status(500)
      .json({ success: false, message: "Some error occurred" });
  }
};
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