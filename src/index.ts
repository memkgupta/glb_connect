import "dotenv/config";
import express, { Express, Request, Response } from "express";
import cors from "cors"
import connect from "@config/db";
import { errorHandler } from "@middlewares/error.middleware";
import authRouter from "@routes/auth.routes"
import clubRouter from "@routes/club.routes"
import eventRouter from "@routes/event.routes"
import formRouter from "@routes/form.routes"
import trackerRouter from "@routes/tracker.routes"
import resourceRouter from "@routes/resource.routes"
import utilRouter from "@routes/utils.routes"
import cookieParser from 'cookie-parser'
import userRouter from '@routes/user.routes'
import projectRouter from '@routes/project.routes'
// dotenv.config();
const app: Express = express();
const port = process.env.PORT || 3000;
app.use(cors({
  origin: "http://localhost:3000", // Frontend URL
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
app.use("/api/v1/tracker",trackerRouter)
app.use("/api/v1/resources",resourceRouter)
app.use("/api/v1/events",eventRouter)
app.use("/api/v1/forms",formRouter)
app.use("/api/v1/utils",utilRouter)
app.use("/api/v1/users",userRouter)
app.use("/api/v1/projects",projectRouter)
app.use(errorHandler);
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});