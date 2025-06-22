import SearchEntity, { ISearchEntity } from "@models/search_entity.model";
import {  SearchEntityInterface } from "src/@types/search";

export const createSearchEntity = async(data:SearchEntityInterface)=>{
    const entity = new SearchEntity(data)
    await entity.save();
    
}
