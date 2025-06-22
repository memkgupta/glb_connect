import Resources from "@models/resource.model"

export const fetchResourceById = async(id:string)=>{
    const resource = await Resources.findById(id);
    return resource;
}