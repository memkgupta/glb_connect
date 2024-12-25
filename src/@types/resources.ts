export type YTLecture = {
    _id: string | null | undefined; label: string | null | undefined; videoUrl: string; thumbnail:string|null|undefined

}
// let {
//     label,
//     branch,
//     code,
//     collegeYear,
//     university,
//     type,
//     file,
//     source,
//     sessionYear,
//     playlist,
//   }
export type BulkResourceBody = {
label:string,
branch:string,
code:string,
collegeYear:string,
university:string,
thumbnail?:string,
type:string,
file:string,
source:string,
sessionYear:string,

}