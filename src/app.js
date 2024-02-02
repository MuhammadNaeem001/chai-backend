import express from 'express';

import cookieParser from "cookie-parser";
import cors from "cors"
const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(Express.json({limit:"16kb"}))
app.use(Express.urlencoded({
    extended:true,limit:"16kb"}
))
app.use(Express.static("public"))
app.use(cookieParser())

export {app}