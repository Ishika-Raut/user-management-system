import mongoose from "mongoose";

const connectDB = async (next) => {

    try 
    {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDB connected successfully!");
    }
    catch (error) 
    {
        console.log("MongoDB connect error", error);
        process.exit(1); //exits process with the failure
    }

}
export default connectDB;