import { UnauthorizedError } from "@errors/UnauthorizedError";
import Resources from "@models/resource.model";
import User from "@models/user.model";
import { YTLecture } from "../types/index";
import { NextFunction, Request, Response } from "express";
import Playlists from "@models/playlist.model";
import { InternalServerError } from "@errors/InternalServerError";
import { BadRequestError } from "@errors/BadRequestError";
import { NotFoundError } from "@errors/NotFoundError";
import Vote from "@models/vote.model";

export const uploadResource = async (req: Request, res: Response,next:NextFunction) => {
  try {
 

    const _user = req.user;
    if (!_user) {
        return next(new UnauthorizedError("Please login first"));

    }

    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new UnauthorizedError("Please login first"));
    }

    // Destructure the fields from the incoming request
    let { label, branch, code, collegeYear, university, type, file, sessionYear, playlist } = req.body;

    const resource = new Resources({
      label,
      branch,
      file,
      type,
      sessionYear,
      code,
      collegeYear,
      contributor: user._id,
      university,
    });

    // Handle playlist if provided
    if (playlist) {
      playlist = playlist.map((i: YTLecture) => ({
        label: i.label,
        thumbnail: i.thumbnail,
        videoUrl: i.videoUrl,
      }));

      if (type === 'lectures') {
        const playlistDoc = await Playlists.create({
          resourceId: resource._id,
          lectures: playlist,
        });
        resource.playlist = playlistDoc._id;
        resource.thumbnail = playlist[0].thumbnail; // Assuming the first lecture's thumbnail is the resource's thumbnail
      }
    }


    await resource.save();

   res.status(200).json({
      success: true,
      message: "Resource Added SuccessFully",
    });
  } catch (error: any) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const getResources = async (req: Request, res: Response,next:NextFunction) => {
    const params = req.query;
    const filters: {
      collegeYear: string;
      branch?: string;
      code?: string;
      university?: string;
      type: string;
    } = {
      collegeYear: "1", // Default values
      university: "AKTU",
      type: "notes",
    };
  
    // Construct filters based on query parameters
    if (params.collegeYear) {
      filters.collegeYear = params.collegeYear as string;
    }
    if (params.branch) {
      filters.branch = params.branch as string;
    }
    if (params.code) {
      filters.code = params.code as string;
    }
    if (params.type) {
      filters.type = params.type as string;
    }
  
    console.log(filters); // You can remove this in production, just for debugging
  
    try {
    
      // Aggregation to get resources and their votes
      const resources = await Resources.aggregate([
        { $match: filters }, // Match the filters
        {
          $lookup: {
            as: "votes",
            from: "votes", // The collection to join
            localField: "_id", // Field in Contributions
            foreignField: "contributionId", // Field in Votes collection
          },
        },
        {
          $unwind: {
            path: '$votes',
            preserveNullAndEmptyArrays: true, // Include documents even if there are no votes
          },
        },
        {
          $group: {
            _id: "$_id", // Group by resource ID
            data: { $first: '$$ROOT' }, // Get the first occurrence of the document
            upvoteCount: {
              $sum: {
                $cond: [{ $eq: ["$votes.voteType", "up"] }, 1, 0], // Count upvotes
              },
            },
            downvoteCount: {
              $sum: {
                $cond: [{ $eq: ["$votes.voteType", "down"] }, 1, 0], // Count downvotes
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            upvoteCount: 1,
            downvoteCount: 1,
            data: 1, // Include resource data and vote counts
          },
        },
      ]);
  
      // Return the response with the aggregated resources
     res.status(200).json({ success: true, resources });
    } catch (error) {
      console.error(error); // Log the error for debugging
      return next(new InternalServerError("Some error occured"));
    }
  };
  export const postVote = async (req: Request, res: Response,next:NextFunction) => {
    const { r_id, type } = req.body; // Assuming you're sending JSON in the request body
    
    try {
      const _user = req.user;
      // If no user in session, return 403 response
      if (!_user) {
        return next(new UnauthorizedError("Please Login First"));
      }
  
      // Find the user in the database
      const user = await User.findById(_user.userId);
      if (!user) {
        return next(new BadRequestError("Please Login First"));
      }
  
      // Find the contribution by its ID
      const resource = await Resources.findById(r_id);
      if (!resource) {
        return next(new NotFoundError('No such resource exists'))
      }
  
      // Check if the user has already voted
      const isAlreadyVoted = await Vote.findOne({ userId: user._id, resourceId: resource._id });
  
      if (isAlreadyVoted && isAlreadyVoted.voteType === type) {
        // If the user has already voted for this contribution with the same type, remove the vote
        await Vote.findByIdAndDelete(isAlreadyVoted._id);
        return res.status(201).json({
          success: true,
          message: 'Vote removed',
        });
      }
  
      // If a new vote or different vote, delete the old vote (if exists) and add the new one
      if (isAlreadyVoted && isAlreadyVoted.voteType !== type) {
        await Vote.findByIdAndDelete(isAlreadyVoted._id); // Delete the old vote
      }
  
      const vote = new Vote({
        contributionId: resource._id,
        userId: user._id,
        voteType: type,
      });
  
      // Save the new vote
      await vote.save();
  
      res.status(200).json({
        success: true,
        message: 'Voted successfully',
      });
    } catch (error) {
      console.log(error); // Log the error for debugging
      return next(new InternalServerError("Some error occured"))
    }
  };