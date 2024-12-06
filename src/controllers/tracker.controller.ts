import { BadRequestError } from '@errors/BadRequestError';
import { InternalServerError } from '@errors/InternalServerError';
import { NotFoundError } from '@errors/NotFoundError';
import { UnauthorizedError } from '@errors/UnauthorizedError';
import Playlists from '@models/playlist.model';
import { Progress } from '@models/progress.model';
import Resources from '@models/resource.model';
import User from '@models/user.model';
import { NextFunction, Request, Response } from 'express';


export const getTracker = async (req: Request, res: Response,next:NextFunction) => {
  try {
  

    const { rid } = req.query; // Extract the resource ID (rid) from query params
    if (!rid) {
      return res.status(400).json({
        success: false,
        message: 'Resource ID (rid) is required',
      });
    }

    const _user =req.user;

    // If no user in session, return an error
    if (!_user) {
      return next(new UnauthorizedError("Login First"));
    }

    // Find the user in the database
    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new BadRequestError("User does not exists"))
    }

    // Find the progress tracker for the given user and resource
    const tracker = await Progress.findOne({ user_id: user._id, resource_id: rid });
    
    // Return the tracker or null if not found
    if (tracker) {
     res.status(200).json({
        success: true,
        tracker,
      });
    } else {
       res.status(200).json({
        success: true,
        tracker: null,
      });
    }

  } catch (error) {
    console.error(error); // Log the error for debugging
    return next(new InternalServerError("Some error occured"));
  }
};

export const startTracker = async (req: Request, res: Response,next:NextFunction) => {
    try {
      // Check if the session exists
      
  
      const _user = req.user
      if (!_user) {
        return next(new UnauthorizedError("Please Login first"));
      }
  
      // Find the user in the database by email
      const user = await User.findById(_user.userId);
      if (!user) {
        return next(new BadRequestError("User Does not exists"));
      }
  
      // Get the resource ID from query parameters
      const { rid } = req.query; 
      if (!rid) {
        return next(new BadRequestError("Id is required"))
      }
  
      // Find the resource and playlist
      const resource = await Resources.findById(rid);
      if (!resource) {
        return next(new NotFoundError("No resource found"))
      }
  
      const playlist = await Playlists.findById(resource.playlist);
      if (!playlist) {
        return  next(new NotFoundError("No playlist found"))
      }
  
      // Check if a tracker already exists for this user and resource
      const isTrackerExists = await Progress.findOne({ user_id: user._id, resource_id: resource._id });
      if (isTrackerExists) {
        return next(new BadRequestError("Tracker Already exists"))
      }
  
      // Create the tracker
      const tracker = await Progress.create({
        resource_id: resource._id,
        taken: [],
        recent: playlist.lectures[0]._id, // Assuming the first lecture is the 'recent'
        user_id: user._id,
      });
  
      res.status(200).json({
        success: true,
        tracker,
      });
    } catch (error) {
      console.error(error);
      return next(new InternalServerError("Some error occured"))
    }
  };
export const getProgress = async(req:Request,res:Response,next:NextFunction)=>{
  try {


    const { tid } = req.query;
    if (!tid) {
        return next(new BadRequestError("Bad request"));
    }

    const tracker = await Progress.findById(tid);
    if (!tracker) {
        return next(new BadRequestError("Bad request"));
    }

    const resource = await Resources.findById(tracker.resource_id);
    if (!resource) {
        return next(new NotFoundError("Resource not found"));
    }

    const playlist = await Playlists.findById(resource.playlist);
    if (!playlist) {
        return next(new BadRequestError("Bad request"));
    }

    const data = {
        progress: (tracker.taken.length / playlist.lectures.length) * 100,
        lecturesCompleted: tracker.taken.length,
        totalLectures: playlist.lectures.length,
    };

    console.log(data);

     res.status(200).json({ success: true, data });
} catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
}
}
export const getCourses = async(req:Request,res:Response,next:NextFunction)=>{
  try {
 

    // Simulate fetching session details
 
    const _user = req.user;

    if (!_user) {
        return next(new UnauthorizedError("Login First"));
    }

    const { page = '1', limit = '10' } = req.query; // Default to page 1 and limit 10
    const parsedPage = parseInt(page as string );
    const parsedLimit = parseInt(limit as string);

    // Find user by session email
    const user = await User.findById(_user.userId);
    if (!user) {
        return next(new BadRequestError("Session Expired . Please Login Again"));
    }

    // Perform aggregation
    const courses = await Progress.aggregate([
        { $match: { user_id: user._id } },
        {
            $lookup: {
                from: 'resources',
                as: 'course',
                localField: 'resource_id',
                foreignField: '_id',
            },
        },
        {
            $lookup: {
                from: 'playlists',
                as: 'playlist',
                localField: 'course.playlist',
                foreignField: '_id',
            },
        },
        { $unwind: "$playlist" },
        {
            $project: {
                createdAt: 1,
                taken: { $size: "$taken" },
                resource_id: 1,
                totalLectures: { $size: "$playlist.lectures" },
                title: { $arrayElemAt: ["$course.label", 0] },
            },
        },
        { $limit: parsedLimit },
        { $skip: (parsedPage - 1) * parsedLimit },
    ]);

 res.status(200).json({ success: true, courses });
} catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
}
}