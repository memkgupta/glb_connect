import { Activity, IActivity } from "@models/activity.model";

export const noteActivity = async(activityData:Partial<IActivity>)=>{
    console.log(activityData);
    const activity = await Activity.create(activityData);
}