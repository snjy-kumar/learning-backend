// require("dotenv").config( { path: './.env' } );
import dotenv from "dotenv";
import connectDB from "../src/db/index.js";
import app from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server is running at port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MONGO DB connection failed !!!", error);
  });

/* //first approach to connect to the database through index.js
import express from "express";
const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("ERROR: ", error);
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("ERROR: ", error);
    throw error;
  }
})();
*/
