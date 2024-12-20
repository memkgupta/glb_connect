import * as express from 'src/@types/global';

declare global {
    namespace Express {
        interface Request {
            user?: any;
            role?:{
                havePermission:boolean,
                resource_id:any|string
            } // Add the user property here
        }
        
    }
}