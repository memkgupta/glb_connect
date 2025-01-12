import { UnauthorizedError } from "@errors/UnauthorizedError";
import Resources from "@models/resource.model";
import User from "@models/user.model";
import { BulkResourceBody, YTLecture } from "../@types/index";
import { NextFunction, Request, Response } from "express";
import Playlists from "@models/playlist.model";
import { InternalServerError } from "@errors/InternalServerError";
import { BadRequestError } from "@errors/BadRequestError";
import { NotFoundError } from "@errors/NotFoundError";
import Vote from "@models/vote.model";
import { Progress } from "@models/progress.model";
import mongoose from "mongoose";
import { ForbiddenError } from "@errors/ForbiddenError";
import Source from "@models/source.model";

export const uploadResource = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
   //@ts-ignore
       //@ts-ignore
        const _user = req.user;
    if (!_user) {
      return next(new UnauthorizedError("Please login first"));
    }

    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new UnauthorizedError("Please login first"));
    }

    // Destructure the fields from the incoming request
    let {
      label,
      branch,
      code,
      collegeYear,
      university,
      type,
      file,
      source,
      sessionYear,
      playlist,
    } = req.body;
    const sourceExists = await Source.findOne({name:source});
    if(!sourceExists){
      await Source.create({name:source});
    }
    const resource = new Resources({
      label,
      branch,
      file,
      source,
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

      if (type === "lectures") {
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
export const getResources = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const params = req.query;
  const filters: {
    collegeYear: string;
    branch?: string;
    code?: string;
    university?: string;
    type: string;
    source?: string;
    subject?:string;
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
  if (params.source) {
    filters.source = params.source as string;
  }
  // if(params.subject){
  //   filters.subject = params.subject as string
  // }
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
          foreignField: "resourceId", // Field in Votes collection
        },
      },
      {
        $unwind: {
          path: "$votes",
          preserveNullAndEmptyArrays: true, // Include documents even if there are no votes
        },
      },
      {
        $group: {
          _id: "$_id", // Group by resource ID
          data: { $first: "$$ROOT" }, // Get the first occurrence of the document
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
        $sort: {
          upvoteCount: -1,
          downvoteCount:1,
        }
      },
      {$limit:20},
      {$skip:(parseInt((params.page||"1")as string)-1)*20},
      {
        $project: {
          _id: 0,
          upvoteCount: 1,
          downvoteCount: 1,
          data:{
            thumbnail:1,
            label:1,
            sessionYear:1,
            _id:1,
            type:1,
            
          }
       
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
export const postVote = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { r_id, type } = req.body; // Assuming you're sending JSON in the request body

  try {
   //@ts-ignore
       //@ts-ignore
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
      return next(new NotFoundError("No such resource exists"));
    }

    // Check if the user has already voted
    const isAlreadyVoted = await Vote.findOne({
      userId: user._id,
      resourceId: resource._id,
    });
console.log(isAlreadyVoted)
    if (isAlreadyVoted && isAlreadyVoted.voteType === type) {
      // If the user has already voted for this contribution with the same type, remove the vote
      await Vote.findByIdAndDelete(isAlreadyVoted._id);
      res.status(201).json({
        success: true,
        message: "Vote removed",
      });
  return;
    }

    // If a new vote or different vote, delete the old vote (if exists) and add the new one
    if (isAlreadyVoted && isAlreadyVoted.voteType !== type) {
      await Vote.findByIdAndDelete(isAlreadyVoted._id); // Delete the old vote
    }

    const vote = new Vote({
     resourceId: resource._id,
      userId: user._id,
      voteType: type,
    });

    // Save the new vote
    await vote.save();

    res.status(200).json({
      success: true,
      message: "Voted successfully",
    });
  } catch (error) {
    console.log(error); // Log the error for debugging
    return next(new InternalServerError("Some error occured"));
  }
};

/**
 * Builds the aggregation pipeline based on resource type.
 */
const buildAggregationPipeline = (id: string, type: string) => {
  const pipeline: any[] = [
    {
      $match: { _id: new mongoose.Types.ObjectId(id) },
    },
    {
      $lookup: {
        from: "users",
        localField: "contributor",
        foreignField: "_id",
        as: "contributor",
      },
    },
    { $unwind: {
      path:"$contributor",
      preserveNullAndEmptyArrays: true} },
  ];

  if (type === "lectures") {
    pipeline.push(
      {
        $lookup: {
          from: "playlists",
          localField: "playlist",
          foreignField: "_id",
          as: "playlist",
        },
      },
      { $unwind: "$playlist" }
    );
  }

  pipeline.push({
    $project: {
      branch: 1,
      label: 1,
      type: 1,
      code: 1,
      sessionYear: 1,
      thumbnail: 1,
      file: 1,
      collegeYear: 1,
      university: 1,
      contributor: {
        username: 1,
        name: 1,
        profile: 1,
      },
      playlist: type === "lectures" ? { lectures: 1 } : undefined,
    },
  });

  return pipeline;
};

/**
 * Retrieves user-specific data such as vote status and progress tracker.
 */
const getUserData = async (userId: string, resourceId: string) => {
  if (!userId) {
    return { isVoted: null, tracker: null };
  }
  const user = await User.findById(userId);

  if (!user) return { isVoted: null, tracker: null };

  const [isVoted, tracker] = await Promise.all([
    Vote.findOne({ userId: user._id, resourceId: resourceId }),
    Progress.findOne({ user_id: user._id, resource_id: resourceId }),
  ]);

  return { isVoted, tracker };
};

/**
 * Aggregates votes for a specific contribution.
 */
const aggregateVotes = async (contributionId: mongoose.Types.ObjectId) => {
  const voteAggregation = await Vote.aggregate([
    { $match: { resourceId:contributionId } },
    {
      $group: {
        _id: "$voteType",
        upvoteCount: {
          $sum: { $cond: [{ $eq: ["$voteType", "up"] }, 1, 0] },
        },
        downvoteCount: {
          $sum: { $cond: [{ $eq: ["$voteType", "down"] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        upvoteCount: { $ifNull: ["$upvoteCount", 0] },
        downvoteCount: { $ifNull: ["$downvoteCount", 0] },
      },
    },
  ]);

  // Ensure both upvoteCount and downvoteCount are present
  const votes = { upvoteCount: 0, downvoteCount: 0 };
  voteAggregation.forEach((vote) => {
    if (vote.upvoteCount !== undefined) votes.upvoteCount = vote.upvoteCount;
    if (vote.downvoteCount !== undefined)
      votes.downvoteCount = vote.downvoteCount;
  });

  return votes;
};

/**
 * Marks lectures as taken based on user progress.
 */
const markTakenLectures = (resource: any, tracker: any) => {
  const takenSet = new Set(
    tracker.taken.map((id: mongoose.Types.ObjectId) => id.toString())
  );

  resource.playlist.lectures = resource.playlist.lectures.map(
    (lecture: any) => ({
      ...lecture,
      taken: takenSet.has(lecture._id.toString()),
    })
  );
};
export const getResourceById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
   //@ts-ignore
       //@ts-ignore
        const _user = req.user;
    // Retrieve session and user information

    // Fetch the contribution resource
    const resource = await Resources.findById(id).populate("contributor");

    if (!resource) {
      return next(new NotFoundError("Resource Not Found"));
    }

    // Build aggregation pipeline
    const aggregationPipeline = buildAggregationPipeline(id, resource.type as string);
    const aggregatedResource = await Resources.aggregate(aggregationPipeline);

    // Fetch user-specific data if the user is authenticated
    let userData = null;
    if(_user){
      console.log(_user)
     userData = await getUserData(_user.userId, id);
    }
     

    // Aggregate votes
    const votes = await aggregateVotes(resource._id);

    // Update resource based on user progress
    if (userData&&userData.tracker && resource.type === "lectures") {
   
      markTakenLectures(aggregatedResource[0], userData.tracker);
    }

    res.status(200).json({
      success: true,
      data: {
        resource: aggregatedResource[0],
        votes,
        // tracker:resource.type==="lectures" && userData &&userData.tracker && userData.tracker,
        isVoted:userData&& userData.isVoted?.voteType || null,
      },
    });
  } catch (error) {
    console.error("GET /api/contribution:", error);
    return next(new InternalServerError("Something went wrong"));
  }
};
export const getMyContributions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
 //@ts-ignore
       //@ts-ignore
        const _user = req.user;
  const page = req.query.page;
  const skip = (parseInt((page as string) || "1") - 1) * 10;
  try {
    const user = await User.findById(_user.userId);
    if (!user) {
      return next(new ForbiddenError("Invalid session please login again"));
    }
    const contributions = await Resources.aggregate([
   
      {
        $match:{
            contributor:user._id,
        }

    },
    {
      $lookup: {
        as: "votes",
        from: "votes", // The collection to join
        localField: "_id", // Field in Contributions
        foreignField: "resourceId", // Field in Votes collection
      },
    },
    {
      $unwind: {
        path: "$votes",
        preserveNullAndEmptyArrays: true, // Include documents even if there are no votes
      },
    },
    {
      $group: {
        _id: "$_id", // Group by resource ID
        data: { $first: "$$ROOT" }, // Get the first occurrence of the document
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
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            { upvoteCount: "$upvoteCount", downvoteCount: "$downvoteCount" },
            "$data", // Spread the `data` object into the parent
          ],
        },
      },
    },
    {
      $sort: {
        upvoteCount: -1,
        downvoteCount: 1,
      },
    },
    { $limit: 20 },
    { $skip: 0 },
    {
      $project: {
        _id: 1,
        upvoteCount: 1,
        downvoteCount: 1,
        branch: 1,
        label: 1,
        type: 1,
        code: 1,
        sessionYear: 1,
        thumbnail: 1,
      },
    },
    ]);
    const totalContributions = await Resources.find({
      contributor: user._id,
    }).countDocuments();
    res.status(200).json({ success: true, contributions, totalContributions });
  } catch (error) {
    console.log(error);
    return next(new InternalServerError("Some error occured"));
  }
};
export const editContribution = async(req:Request,res:Response,next:NextFunction)=>{
  // todo
}
export const updatePlaylist = async(req:Request,res:Response,next:NextFunction)=>{
  // functionality of changing url , description or position of the playlist item
}
export const uploadBulkResource = async(req:Request,res:Response,next:NextFunction)=>{
  //@ts-ignore
  const _user = req.user;
  const resources:BulkResourceBody[] = req.body;
  try {
    const user = await User.findById(_user.userId);
    if(!user){
      return next(new ForbiddenError("Invalid session , please login again"))
    }
  const resourcesUploaded =  await Resources.insertMany(
      resources.map(res=>({
label:res.label,
branch:res.branch,
thumbnail:res.thumbnail,
code:res.code,
collegeYear:res.collegeYear,
university:'AKTU',
type:res.type,
contributor:user._id,
file:res.file,
source:res.source,
sessionYear:res.sessionYear
      }))
    );
    res.status(200).json({
      success:true,message:"Resources uploaded successfully"
    })
  } catch (error) {
    console.error(error);
    return next(new InternalServerError("Some error occured"));
  }
}