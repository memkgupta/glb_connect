import "dotenv/config";
import express, { Express, NextFunction, Request, Response } from "express";
import cors from "cors"
import connect from "@config/db";
import { errorHandler } from "@middlewares/error.middleware";
import authRouter from "@routes/auth.routes"
import clubRouter from "@routes/club/club.routes"
import eventRouter from "@routes/event.routes"
import formRouter from "@routes/form.routes"
import trackerRouter from "@routes/tracker.routes"
import resourceRouter from "@routes/resource.routes"
import utilRouter from "@routes/utils.routes"
import cookieParser from 'cookie-parser'
import uploadRouter from '@routes/upload.routes'
import userRouter from '@routes/user.routes'
import projectRouter from '@routes/project.routes'
import adminRouter from '@routes/admin.routes'
import clubEventRouter from "@routes/club/event.routes"
import clubFormRouter from "@routes/club/forms.routes"
import clubTeamRouter from "@routes/club/team.routes"
import clubTaskRouter from "@routes/club/tasks.routes"
import { authenticate, authorize } from "@middlewares/auth.middleware";
import { UserRoles } from "./@types";
// dotenv.config();
const app: Express = express();
const port = process.env.PORT || 3000;
app.use(cors({
  origin: ["http://localhost:3000","https://campusconnected.vercel.app"], // Frontend URL
  credentials: true,
}));
app.use(cookieParser())
connect();
app.use(express.json())
app.get("/",(req,res)=>{
  res.send("Hello world")
})
app.use("/api/v1/auth",authRouter)
app.use("/api/v1/club",clubRouter)
app.use("/api/v1/club/events",clubEventRouter)
app.use("/api/v1/club/teams",clubTeamRouter)
app.use("/api/v1/club/forms",clubFormRouter)
app.use("/api/v1/club/tasks",clubTaskRouter)
app.use("/api/v1/tracker",trackerRouter)
app.use("/api/v1/resources",resourceRouter)
app.use("/api/v1/events",eventRouter)
app.use("/api/v1/forms",formRouter)
app.use("/api/v1/utils",utilRouter)
app.use("/api/v1/users",userRouter)
app.use("/api/v1/projects",projectRouter)
app.use("/api/v1/uploads",uploadRouter);
app.use("/api/v1/admin",authenticate,async(req:Request,res:Response,next:NextFunction)=>{
   await authorize([UserRoles.ADMIN],next,req);

},adminRouter)
app.use(errorHandler);
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});