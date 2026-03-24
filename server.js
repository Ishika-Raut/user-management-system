import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./src/configs/dbConfig.js";

dotenv.config();

const PORT = process.env.PORT;

connectDB();
app.listen(PORT, () => {
    console.log("Server started at 3080");
})