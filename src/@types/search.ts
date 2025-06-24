import { Types } from "mongoose";

export interface SearchEntityInterface
{
  type: SearchEntityType;
  refId: Types.ObjectId
 label: string;
  content?: string;
  tags: string[];

}
export type SearchEntityType = 'user' | 'resource' | 'roadmap' | 'lectures' | 'event'|"announcement";
