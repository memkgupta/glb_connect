import { APIError } from "@errors/APIError";
import { InternalServerError } from "@errors/InternalServerError";
import { NotFoundError } from "@errors/NotFoundError";
import { EventRegistration } from "@models/event.model"
import Form from "@models/form.model";
import mongoose from "mongoose"

export const fetchRegistrationsOfTeam = async(team_id:string)=>{
    try{
        let registrations = await EventRegistration.aggregate([

            {$match:{
                team:new mongoose.Types.ObjectId(team_id)
            }},
            {
                $lookup:{
                    from:"formsubmissions",
                    as:"formSubmission",
                    localField:"formSubmission",
                    foreignField:"_id"
                }
            },
            {
                $unwind:{
                    path:"$formSubmission",
                    preserveNullAndEmptyArrays:true
                }
            }
            
        ])
        if(registrations.length==0){
            return[];
        }
        const form = await Form.findById(registrations[0].formSubmission.formId);
        if(!form){
            throw new Error("Bad request")
        }
        const fieldToLabelMap  = new Map()
        form.fields.forEach(f=>{
            fieldToLabelMap.set(f._id.toString(),f.fieldLabel)
        })

registrations = registrations.map(registration => ({
  ...registration,
  formSubmission: {
    ...registration.formSubmission,
    submissionData: Object.entries(registration.formSubmission.submissionData).reduce<Record<string, string>>((acc, [fieldId, value]) => {
      // Look up the label using the fieldId in the fieldToLabelMap
      const label = fieldToLabelMap.get(fieldId);

      if (label) {
        acc[label] = String(value);  // Ensure value is a string
      }
      console.log(acc)
      return acc;
    }, {})
  }
}));
        return registrations;
    }
    catch(error:any){
        throw new Error(error.message)
    }
}
export const fetchRegistrationById = async(registration_id:string)=>{
return await EventRegistration.findById(registration_id)
}
export const fetchRegistration = async(params:any)=>{
  try {
    const reg = await EventRegistration.findOne(params);
    if(!reg ){
      throw new NotFoundError("Registration not found")
    }
    return reg;
  } catch (error) {
    if(error instanceof APIError)
    {
      throw error;
    }
    throw new InternalServerError("Something went wrong")
  }
}
export const fetchRegistrationsPaginated = async (
  filters: any,
  page: number = 1,
  user: mongoose.Types.ObjectId
) => {
  const skip = (page - 1) * 50;

  const registrations = await EventRegistration.aggregate([
    {
      $match: {
        user: user,
      },
    },
    {
      $lookup: {
        from: "events",
        localField: "event",
        foreignField: "_id",
        as: "event",
      },
    },
    {
      $unwind: {
        path: "$event",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: filters
        ? Object.keys(filters).length > 0
          ? Object.fromEntries(
              Object.entries(filters).map(([key, value]) => [
                `event.basicDetails.${key}`,
                typeof value === "string" ? { $regex: value, $options: "i" } : value,
              ])
            )
          : {}
        : {},
    },
    {
      $project: {
        _id: 1,
        event: {
          _id: "$event._id",
          basicDetails: "$event.basicDetails",
        },
        status: 1,
        email: 1,
        name: 1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: 50,
    },
  ]);

  return registrations;
};

export const totalRegistrations = async (
  user: mongoose.Types.ObjectId,
  filters: any
) => {
  const matchStage: any = {
    user: user,
  };

  const filterConditions =
    filters && Object.keys(filters).length > 0
      ? Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [
            `event.basicDetails.${key}`,
            typeof value === "string"
              ? { $regex: value, $options: "i" }
              : value,
          ])
        )
      : {};

  const result = await EventRegistration.aggregate([
    {
      $match: matchStage,
    },
    {
      $lookup: {
        from: "events",
        localField: "event",
        foreignField: "_id",
        as: "event",
      },
    },
    {
      $unwind: {
        path: "$event",
        preserveNullAndEmptyArrays: false, // better fail if event doesn't exist
      },
    },
    {
      $match: filterConditions,
    },
    {
      $count: "total",
    },
  ]);

  return result[0]?.total || 0;
};
