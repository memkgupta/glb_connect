import { Team } from "@models/event.model";
import mongoose, { PipelineStage } from "mongoose";

export const fetchEventTeams = async (
  event_id: mongoose.Types.ObjectId,
  params: any | undefined
) => {
  const { name, approved, status,page } = params;
  try {
    const matchStage: any = {
      event: event_id,
    };

    if (name && (name as string).length > 0) {
      matchStage.name = { $regex: name, $options: "i" };
    }
 
    if (status && (status as string).length > 0) {
      matchStage.status = status;
    }

    const aggregatePipeline: PipelineStage[] = [
      {
        $match: matchStage,
      },
           {
        $skip:(page-1)*50,},
      {  $limit:50}
      ,
      {
        $project: {
          name: 1,
          _id: 1,
          status: 1,
          code:1,
          members: 1,
        },
      },
      
    ];
    console.log(aggregatePipeline)
    const teams = await Team.aggregate(aggregatePipeline)
   const totalCount = await Team.countDocuments(matchStage);
    return {teams,totalTeams:totalCount};
  } catch (error:any) {
    throw new Error(error.message)
  }
};
export const fetchTeamById = async(team_id:mongoose.Types.ObjectId)=>{
try{
  const team =await Team.aggregate([
      {
        $match:{
          _id:team_id
        }
      },
      {
        $lookup:{
          from:"teammembers",
          as:"members",
         let:{
         memberIds:"$members"
         },
         pipeline:[
          {
            $match: {
            $expr: {
              $in: ["$_id", "$$memberIds"]
            }
          }
          },
          {
            $lookup:{
              from:"eventregistrations",
              as:"registrationDetails",
              localField:"registrationDetails",
              foreignField:"_id"
            }
          },
          {
            $unwind:{
              path:"$registrationDetails",
              preserveNullAndEmptyArrays:true
            }
          }
         ]
        }
      }
    ]);
    if(team.length==0){
        return null;
    }
console.log(team)
 return team[0];  
}
catch(error:any){
    throw new Error(error.message);
}
}