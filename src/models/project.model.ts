import { Schema } from "zod";
import { projectCategories } from "../constants/index";
import mongoose from "mongoose";
const projectCategoriesEnum = projectCategories.map(categ=>categ.value);
const projectSchema = new mongoose.Schema({
    user:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
    category:{type:String,enum:projectCategoriesEnum,},
    title:{type:String,required:true},
    description:{type:String,required:true},
    banner:{type:String},
    images:[String],
    openForCollab:{type:Boolean,default:false},
    start:{type:Date,required:true},
    end:{type:Date},
    documentation:String,
    demo:String,
    currently_working:{type:Boolean,default:true},
    tags:String,
    status:String,
    technologiesUsed:String,
    lead:String,
    live_link:{type:String},
    github:{type:String},
    
    contributors:[{user:{type:mongoose.Schema.Types.ObjectId,required:true,ref:'User'},
        role:{type:String,required:true}}]
},{timestamps:true});

const projectLogsSchema = new mongoose.Schema({
    project_id:{type:mongoose.Schema.Types.ObjectId,ref:'Project',required:true},
    description:{type:String,required:true},
    
},{timestamps:true});
const projectContributors = new mongoose.Schema({
    user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    project_id:{type:mongoose.Schema.Types.ObjectId,ref:'Project',required:true},
    role:{type:String,required:true},
    name:{type:String,required:true},
    profile:{type:String},
})
const projectDocumentation = new mongoose.Schema({
    project_id:{type:mongoose.Schema.Types.ObjectId,ref:"Project"},
    sections:[{
        index:{type:Number},
        sectionId:{type:mongoose.Schema.Types.ObjectId,ref:"DocumentationSection"},
    }],

});
const projectDocumentationSection = new mongoose.Schema({
    project_id:{type:mongoose.Schema.Types.ObjectId,ref:"Project"},
    parent:{type:mongoose.Schema.Types.ObjectId,ref:"DocumentSection"},
    prev:{type:mongoose.Schema.Types.ObjectId,ref:"DocumentationSection"},
    next:{type:mongoose.Schema.Types.ObjectId,ref:"DocumentationSection"},
    title:{type:String,required:true},
    description:{type:String,required:true},
    articleRef:{type:mongoose.Schema.Types.ObjectId,ref:"Article"},
    documentationId:{type:mongoose.Schema.Types.ObjectId,ref:"Documentation"}
});
const collabRequestSchema = new mongoose.Schema({
    project_id:{type:mongoose.Schema.Types.ObjectId,ref:'Project',required:true},
    user_id:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    skills:[String],
    role:{type:String},
   status:{type:String,enum:["Pending",'Accepted',"Rejected"],default:"Pending"},
    motive:{type:String,required:true},
    contact_no:{type:String},
    contact_email:{type:String}
},{timestamps:true})

export const Project =  mongoose.model("Project",projectSchema);
export const ProjectLog = mongoose.model("ProjectLog",projectLogsSchema)
export const CollabRequest = mongoose.model("CollabRequest",collabRequestSchema)
export const ProjectContributor = mongoose.model("ProjectContributor",projectContributors);
export const Documentaion = mongoose.model("Documentation",projectDocumentation)
export const DocumentationSection = mongoose.model("DocumentationSection",projectDocumentationSection)
