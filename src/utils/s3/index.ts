import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSignedUrl as cdnSigner } from "@aws-sdk/cloudfront-signer";
const s3Client = new S3Client({
    region:'ap-south-1'
    ,
    credentials:{
        accessKeyId:process.env.S3_ACCESS_KEY as string,
        secretAccessKey:process.env.S3_SECRET_KEY as string
    }
});

export async function getObjecURL(key:string){
    const command = new GetObjectCommand({
        Bucket:'campusconnectbucketprivate',
        Key:key,
    });
    const url = cdnSigner({
        url:`https://d1k9jx0t56dwsj.cloudfront.net/${key}`,
        dateLessThan:(new Date(Date.now()+30*60*1000)).toDateString(),
        keyPairId:process.env.CLOUDFRONT_KEY_PAIR_ID as string,
        privateKey:process.env.CLOUDFRONT_PRIVATE_KEY as string

    })
    return url;
}

export async function putObject(key:string,metaData:{  title:string,
    type:string,
    mimeType:string,
 
    fileSize:string,
}){
    const command = new PutObjectCommand({
        Bucket:'campusconnectbucketprivate',
        Key:key,
        ContentType:metaData.mimeType,
      
        
    })
    const url = getSignedUrl(s3Client,command,{expiresIn:30*60,});
    return url;
}