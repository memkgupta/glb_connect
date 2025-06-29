import { eventCategories } from "../constants/index";
import mongoose,{Document, mongo, Schema, Types} from "mongoose";
const eventCategoriesEnum = eventCategories.map(categ=>categ.value);
const eventSchema = new Schema({
    owner: { type: Schema.Types.ObjectId, required: true },
    
    type:{type:String,enum:["hackathon","session","workshop","contest","campaign","other","ground-work"],required:true},
    basicDetails:{
       title: { type: String, required: true },
       description: { type: String, required: true },
       participantsFromOutsideAllowed:{type:Boolean,required:true,default:false},
       venue:{type:String,required:true},
       startDate:{ type: Date, required: true },
       endDate:{type:Date,required:true},
       isOnline:{type:Boolean,default:false},
       isTeamEvent:{type:Boolean,default:false},
       category: { type: String, required: true },
       isFree:{type:Boolean,default:false},
       maxParticipants:{type:String},
       registrationDeadline:{type:Date,required:true},
       multipleRounds:{type:Boolean,default:false}
    },
    eventStructure:{
        eligibility:{type:String},
        teamRequirements:{
            type:{
                minimumStrength:{type:Number},
                maximumStrength:{type:Number},
                diffCollegeTeamMembersAllowed:{type:Boolean},
                otherCriterias:[{type:String}]
            },required:false
        },
        roundsDetails:{type:[{
            title:{type:String,required:true},
            description:{type:String,required:true},
            isOnline:{type:Boolean,default:false},
            isElimination:{type:Boolean,default:false}
        }],required:false},
        guests:{type:[{name:{type:String,required:true},about:{type:String},image:{type:String,required:true}}],required:false},
        speakers:{type:[{name:{type:String,required:true},about:{type:String},image:{type:String,required:true}}],required:false},
        mentors:{type:[{name:{type:String,required:true},about:{type:String},image:{type:String,required:true}}],required:false},
        judges:{type:[{name:{type:String,required:true},about:{type:String},image:{type:String,required:true}}],required:false},
    },
    monetaryDetails:{
        ticketDetails:{
            type:{
                tickets:[{
                    title:{type:String,required:true},
                    price:{type:Number,required:true},
                    description:{type:String,required:true}
                }],
                description:{type:String}
            },required:false
        },
        prizes:{type:[
            {
                title:{type:String,required:true},
                description:{type:String,required:true},
                type:{type:String,required:true,default:"cash",enum:["cash","swags","voucher","goods"]},
            }
        ],required:false},
        sponsors:{type:[
            {
                name:{type:String,required:true},
                description:{type:String,required:true},
                level:{type:String,required:true},
                logo:{type:String,required:true}
            }
        ],required:false}
    },
    organiserDetails:{
       type:{ organisers:{type:[
            {
                name:{type:String,required:true},
                level:{type:Number,required:true},
                position:{type:String,required:true},
                image:{type:String,required:true}
            }
        ],required:false},
        guidelines:{type:[
            {
                title:{type:String,required:true},
                description:{type:String,required:true}
            }
        ],required:false}},required:false
    },
    isPublished:{type:Boolean,default:false},
    banner:{type:String},
   gallery:{type:[
    {url:{type:String,required:true},index:{type:Number,required:true}},
   ]},
   
   
    creationTimestamp: { type: Date, default: Date.now },
  
    registrationForm:{type:mongoose.Schema.Types.ObjectId,ref:"form"},
    
    status:{type:String,enum:["upcoming","completion-pending","completed"]},
    isRemoved:{type:Boolean,default:false},
    isClubEvent:{type:Boolean,default:false},
    club:{type:Schema.Types.ObjectId,ref:'Club'},
    
},{timestamps:true});
const eventRegistrationSchema =new Schema({
    event:{type:Schema.Types.ObjectId,ref:'Event',required:true},
    user:{type:Schema.Types.ObjectId,ref:'User'},
    formSubmission:{type:Schema.Types.ObjectId,ref:'FormSubmission'},
    status:{type:String,default:'pending',enum:["pending","completed"]},
    team:{type:Schema.Types.ObjectId,ref:"Team"},
    registrationCode:{type:String,unique:true,required:true},
    isApproved:{type:Boolean,default:false},
    registrationTimestamp:{type:Date,default:Date.now},
    email:{type:String,required:true,unique:true},
    name:{type:String,required:true},
    phoneNo:{type:String,required:true},
    collegeDetails:{collegeName:{type:String,required:true},year:{type:Number,required:true}},
},{timestamps:true});
const teamMemberSchema = new Schema({
    event:{type:Schema.Types.ObjectId,ref:"Event",required:true},
    team:{type:Schema.Types.ObjectId,ref:"Team",required:true},
    user:{type:Schema.Types.ObjectId,ref:"User"},
    isLead:{type:Boolean,default:false},
    registrationDetails:{type:Schema.Types.ObjectId,ref:"EventRegistration"},
});
const teamSchema = new Schema({
    event:{type:Schema.Types.ObjectId,ref:"Event",required:true},
    name:{type:String,required:true},
    status:{type:String,default:"not-submitted",enum:["not-submitted","submitted","approved"]},
    code:{type:String,required:true,unique:true},
    lead:{type:Schema.Types.ObjectId,ref:"TeamMember"},
    token:{type:String},
    members:[{type:Schema.Types.ObjectId,ref:"TeamMember"}]
},{timestamps:true})
const rsvpSchema = new Schema({
event:{type:Schema.Types.ObjectId,ref:'Event',required:true},
status:{type:String,default:'pending',enum:['pending','rejected','accepted']},
user:{type:Schema.Types.ObjectId,ref:'User',required:true},
eventRegistration:{type:Schema.Types.ObjectId,ref:'EventRegistration',required:true},
},{timestamps:true});
const attendanceSchema = new Schema({
    event:{type:Schema.Types.ObjectId,ref:"Event",required:true},
    registration:{type:Schema.Types.ObjectId,ref:"EventRegistration",required:true},
    timeStamp:{type:Date,required:true}
})
const passSchema = new Schema({
    event:{type:mongoose.Schema.Types.ObjectId,ref:'Event'},
    isValid:{type:Boolean,default:true},
    registration:{type:mongoose.Schema.Types.ObjectId,ref:'EventRegistration'}
});
const feedbackSchema = new Schema({
    event:{type:mongoose.Schema.Types.ObjectId,ref:'Event'},
    user:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
    registration:{type:mongoose.Schema.Types.ObjectId,ref:"EventRegistration"},
    rating:{type:Number,required:true},
    feedback:{type:String}
})
const tempUser = new Schema({
    registration:{type:Schema.Types.ObjectId,ref:"EventRegistrations"},
    memberId:{type:Schema.Types.ObjectId,ref:"TeamMember"},
    teamId:{type:Schema.Types.ObjectId,ref:"Team"},
    email:{type:String,required:true},
    password:{type:String,required:true}
})
interface ILink {
  title: string;
  description: string;
  url: string;
}

// Interface for Attachment
interface IAttachment {
  title: string;
  url: string;
}

// Interface for EventAssignment
export interface IEventAssignment extends Document {
  event: Schema.Types.ObjectId;
  title: string;
  description: string;
  leadOnly:boolean;
  submissionDeadline: Date;
  links?: ILink[];
  form:Schema.Types.ObjectId;
  attachements?: IAttachment[];
  createdAt?: Date;
  updatedAt?: Date;
}
export interface IEventAssignmentSubmisssionSchema extends Document{
    assignment:string,
}
// Schema for Link
const linkSchema = new Schema<ILink>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  url: { type: String, required: true },
});

// Schema for Attachment
const attachementSchema = new Schema<IAttachment>({
  title: { type: String, required: true },
  url: { type: String, required: true },
});

// Main Schema for EventAssignment
const eventAssignmentSchema = new Schema<IEventAssignment>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    title: { type: String, required: true },
    leadOnly:{type:Boolean,required:true,default:false},
    description: { type: String, required: true },
    submissionDeadline: { type: Date, required: true },
    links: { type: [linkSchema], required: false },
    form:{type:mongoose.Schema.Types.ObjectId,ref:"Form",required:true},
    attachements: { type: [attachementSchema], required: false },
  },
  { timestamps: true }
);
export interface IEventAssignmentSubmission extends Document {
  assignment: mongoose.Types.ObjectId;
  formSubmission?: mongoose.Types.ObjectId;
  member?: mongoose.Types.ObjectId;
  team?:mongoose.Types.ObjectId;
  registration?:mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const eventAssignmentSubmissionSchema = new Schema<IEventAssignmentSubmission>(
  {
    assignment: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'EventAssignment', // optionally add ref if needed
    },
    formSubmission: {
      type: Schema.Types.ObjectId,
      ref: 'FormSubmission',
    },
    team:{
        type:Schema.Types.ObjectId,
        ref:"Team"
    },
    registration:{
        type:Schema.Types.ObjectId,
        ref:"EventRegistration"
    },
    member: {
      type: Schema.Types.ObjectId,
      ref: 'TeamMember',
    },
  },
  { timestamps: true }
);
export const EventAttendance = mongoose.model("EventAttendance",attendanceSchema);
export const EventFeedback = mongoose.model('Feedback',feedbackSchema);
export const Event =mongoose.model('Event',eventSchema);
export const EventRegistration =mongoose.model('EventRegistration',eventRegistrationSchema);
export const RSVP = mongoose.models.RSVP||mongoose.model('RSVP',rsvpSchema);
export const Team = mongoose.model("Team",teamSchema);
export const TeamMember = mongoose.model("TeamMember",teamMemberSchema)
export const TempUser = mongoose.model("TeamUser",tempUser)
export const EventAssignmentSubmission = mongoose.model("EventAssignmentSubmission",eventAssignmentSubmissionSchema)
export const EventAssignment = mongoose.model<IEventAssignment>("EventAssignment",eventAssignmentSchema)