import mongoose from "mongoose";
import { DB_NAME } from "../consants.js";


const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n mongo connected ${connectionInstance.Connection.host}`);
        

    } catch (error) {
        console.error("mongo ERROR failed 222",error);
        process.exit(1)
    }
}

export default connectDB


