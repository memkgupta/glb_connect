
import mongoose,{Schema} from "mongoose"

const contributionSchema = new Schema({
    branch:{type:String,required:true},
    label:{type:String,required:true},
    isRemoved:{type:Boolean,default:false},
    type:{type:String,enum:['pyq','notes','question-bank','lectures','short-notes','quantum']},
    code:{type:String,required:true},
    sessionYear:{type:String},
    source:{type:String},
    thumbnail:{type:String,},
    description:{type:String},
    playlist:{type:Schema.Types.ObjectId,ref:'Playlists'},
    collegeYear:{type:String,required:true,enum:['1','2','3','4']},
    file:{type:String},
    university:{type:String,required:'true'},
    contributor:{type:Schema.Types.ObjectId,ref:'User'}
},{timestamps:true});
contributionSchema.index({
    label:'text',branch:'text',code:'text',collegeYear:'text'
},{weights:{label:10,branch:5,code:10,collegeYear:5}})
const Resources = mongoose.model("Resource",contributionSchema);
export default Resources;