import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import connect from "@config/db";
import { errorHandler } from "@middlewares/error.middleware";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
connect();
app.use(express.json())
app.use(errorHandler);
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});