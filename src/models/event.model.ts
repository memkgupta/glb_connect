import { eventCategories } from "../constants/index";
import mongoose,{mongo, Schema} from "mongoose";
const eventCategoriesEnum = eventCategories.map(categ=>categ.value);
const eventSchema = new Schema({
    admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isTeamEvent:{type:Boolean,required:true,default:false},
    isPublished:{type:Boolean,default:false},
    name: { type: String, required: true },
    description: { type: String, required: true },
    dateTime: { type: Date, required: true },
    location: { type: String, required: true },
    venue:{type:String,required:true},
    category: { type: String, enum: eventCategoriesEnum, required: true },
    banner:{type:String,required:true},
    key_persons:[{name:{type:String,required:true},description:{type:String},pic:{type:String,required:true},urls:[String]}],
    participantsFromOutsideAllowed:{type:Boolean,required:true,default:false},
    isAcceptingVolunteerRegistrations:{type:Boolean,default:false},
    maxCapacity:{type:Number,required:true,default:100},
    creationTimestamp: { type: Date, default: Date.now },
    external_forms:[{
        _id:{type:String,required:true},
        label:{type:String,required:true},
        link:{type:String},
        form:{type:String}
    }],
    usingInternalRegistration:{type:Boolean,default:true},
    registrationForm:{type:mongoose.Schema.Types.ObjectId,ref:'Forms'},
    club:{type:Schema.Types.ObjectId,ref:'Club'}
},{timestamps:true});
const eventRegistrationSchema =new Schema({
    event:{type:Schema.Types.ObjectId,ref:'Event',required:true},
   
    user:{type:Schema.Types.ObjectId,ref:'User',required:true},
    formSubmission:{type:Schema.Types.ObjectId,ref:'FormSubmission'},
    applicationNote:{type:String,required:true},
    entry_status:{type:String,default:'pending',enum:['pending','not','yes']},
    status:{type:String,default:'pending',enum:["pending","completed"]},
    registrationType:{type:String,enum:['volunteer','participant']},
    volunteerType:{type:String,enum:["general","technical"]},
    registrationTimestamp:{type:Date,default:Date.now},
    links:[{type:String,url:String}],
    resume:{type:String,default:null},
},{timestamps:true});
const rsvpSchema = new Schema({
event:{type:Schema.Types.ObjectId,ref:'Event',required:true},
isAccepted:{type:Boolean,default:false},
status:{type:String,default:'pending',enum:['pending','rejected','accepted']},
user:{type:Schema.Types.ObjectId,ref:'User',required:true},
eventRegistration:{type:Schema.Types.ObjectId,ref:'EventRegistration',required:true},

},{timestamps:true});
const passSchema = new Schema({
    event:{type:mongoose.Schema.Types.ObjectId,ref:'Event'},
    isValid:{type:Boolean,default:true},
    registration:{type:mongoose.Schema.Types.ObjectId,ref:'EventRegistration'}
});
const feedbackSchema = new Schema({
    event:{type:mongoose.Schema.Types.ObjectId,ref:'Event'},
    user:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
    rating:{type:Number,required:true},
    feedback:{type:String}
})
export const EventFeedback = mongoose.model('Feedback',feedbackSchema);
export const Event =mongoose.model('Event',eventSchema);
export const EventRegistration =mongoose.model('EventRegistration',eventRegistrationSchema);
export const RSVP = mongoose.models.RSVP||mongoose.model('RSVP',rsvpSchema);