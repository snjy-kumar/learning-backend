import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express(); // create express app

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb",}));
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // parse requests of content-type - application/x-www-form-urlencoded
app.use(express.static("public"));
app.use(cookieParser());

// Routes import
import userRouter from "./routes/user.router.js";


// Routes declaration
app.use('/api/v1/users', userRouter)

// https:localhost:3000/api/v1/users/register

// export { app }; // export app
export default app; // export app
