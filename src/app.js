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

export { app }; // export app
