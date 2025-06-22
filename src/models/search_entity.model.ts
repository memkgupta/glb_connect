import { model, Schema, Types } from "mongoose";
export interface ISearchEntity extends Document {
  type: 'user' | 'resource' | 'pyq' | 'lecture' | 'event';
  refId: Types.ObjectId;
  label: string;
  content?: string;
  tags: string[];
  createdAt: Date;
}
const searchEntitySchema = new Schema<ISearchEntity>({
    type:{type:String,required:true,enum:["user","resource","event","article","roadmap","lectures"]},
    refId:{type:Schema.Types.ObjectId},
    label:String,
    content:{type:String,required:false},
    tags:[{type:String}]
    
},{
    timestamps:true
})

 searchEntitySchema.index({ label: 'text', content: 'text', tags: 'text' });

const SearchEntity =  model<ISearchEntity>("SearchEntity",searchEntitySchema)
export default SearchEntity