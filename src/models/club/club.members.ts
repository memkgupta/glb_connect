import mongoose from "mongoose";

const clubMemberSchema = new mongoose.Schema({
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',  // Assuming there is a 'Club' schema
      required: true,
    },
    name:{type:String},
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',  // Reference to the user/student
      required: true,
    },
    role: {
      type: String,
      enum: ['president', 'vice-president', 'team-member', 'team-lead'],
      default: 'team-member',
    },
    teamId:{
        type:mongoose.Schema.Types.ObjectId,ref:"ClubTeam",required:true
    },
    status: {
      type: String,
      enum: ['Active',"Removed"], // Membership status
      default: 'Active',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  
});

const ClubMember =  mongoose.model('ClubMember',clubMemberSchema);
export default ClubMember