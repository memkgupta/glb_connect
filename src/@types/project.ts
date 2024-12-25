export type ProjectCreateRequestBody= {
    category:string,
    title:string,
    description:string,
    banner:string,
    openForCollab:boolean,
    start:Date,
    end?:Date,
    currently_working:boolean,
    tags:string,
    status:String,
    technologiesUsed:string,
    live_link:string,
    github:string,

}
export type UpdateProjectBody = {
    updates:{
        field:any,
        value:any,
        type:"push"|"remove"|"edit"
    }[]
}