import { NotFoundError } from "@errors/NotFoundError";
import Form from "@models/form.model"
import FormSubmission, { IFormSubmission } from "@models/form.submission.model";

export const getFormSubmissionById = async(id:string)=>{

    const formSubmission = await FormSubmission.findById(id).populate('formId');
    if(!formSubmission){
        throw new NotFoundError("Form submission not found")
    }
    const form = formSubmission?.formId as any;
    if(!form){
        throw new NotFoundError("Form not found");
    }
     const fieldToLabelMap  = new Map()
        form.fields.forEach((f:any)=>{
            fieldToLabelMap.set(f._id,f.fieldLabel)
        })
formSubmission.submissionData = Object.entries(formSubmission.submissionData).reduce<Map<string, string>>((acc, [fieldId, value]) => {
      // Look up the label using the fieldId in the fieldToLabelMap
      const label = fieldToLabelMap.get(fieldId);

      if (label) {
        acc.set(label,value);  // Ensure value is a string
      }
      
      return acc;
    },new Map());
return formSubmission;
}
export const fetchFormById = async(id:string)=>{
    return await Form.findById(id);
}
export const mapFormSubmissionWithLabel =async(formSubmission:IFormSubmission)=>{
    const form = await fetchFormById(formSubmission.formId.toString());
    if(!form)
    {
        throw new NotFoundError("Form not found");
    }
       const fieldToLabelMap  = new Map()
        form.fields.forEach((f:any)=>{
            fieldToLabelMap.set(f._id,f.fieldLabel)
        }) 
formSubmission.submissionData = Object.entries(formSubmission.submissionData).reduce<Map<string, string>>((acc, [fieldId, value]) => {
      // Look up the label using the fieldId in the fieldToLabelMap
      const label = fieldToLabelMap.get(fieldId);

      if (label) {
        acc.set(label,value);  // Ensure value is a string
      }
      
      return acc;
    },new Map());
    return formSubmission;
}