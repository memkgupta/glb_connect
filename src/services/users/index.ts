import { NotFoundError } from "@errors/NotFoundError";
import { Activity } from "@models/activity.model";
import Announcement from "@models/announcement.model";
import { Event } from "@models/event.model";
import User from "@models/user.model"

export const getUserByEmail = async(email:string)=>{
const user = await User.findOne({email:email});
if(!user)
{
    throw new NotFoundError("User not found");
}
return user;
}

export const getFeed = async()=>{
 const topRecentAnnouncements = await Announcement.aggregate([
  {
    $match: {
      isActive: true,
    },
  },
  {
    $sort: {
      createdAt: -1,
    },
  },
  {
    $limit: 4,
  },
]);
const upcomingEvents = await Event.aggregate([
  {
    $match: {
      isPublished: true,
      isRemoved: false,
      "basicDetails.startDate": { $gte: new Date() }, // ✅ upcoming
    },
  },
  {
    $sort: {
      "basicDetails.startDate": 1, // soonest upcoming first
    },
  },
  {
    $limit: 4,
  },
  {
    $project: {
      _id: 1,
      type: 1,
      "basicDetails.title": 1,
      "basicDetails.startDate": 1,
      "basicDetails.endDate": 1,
      "organiserDetails.organisers": 1,
    },
  },
]);
const recentActivities = await Activity.aggregate([
  { $sort: { createdAt: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: "users",
      localField: "createdBy",
      foreignField: "_id",
      as: "createdBy",
    },
  },
  { $unwind: "$createdBy" },
  {
    $project: {
      _id: 1,
      type: 1,
      title: 1,
      createdAt: 1,
      message: 1,
      "createdBy.name": 1,
      "createdBy.profileImage": 1,
    },
  },
]);
return {topRecentAnnouncements,upcomingEvents,recentActivities}
}