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