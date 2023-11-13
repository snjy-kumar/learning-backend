import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MONGODB connection success DB HOST: ${connectionInstance.connection.host}`);
        //make console and connectionInstance.connection.host in one line and read all the information to understand it and more
    } catch (error) {
        console.log("MONGODB connection failed " , error);
        process.exit(1);
        //learn process.exit(1) with all the numbers
    }
}

export default connectDB;