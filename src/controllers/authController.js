import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { ApiError } from "../utils/apiError.js";
import HTTP_STATUS from "../utils/httpStatusCodes.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const register = async (req, res, next) => {
    try 
    {
        const {name, email, password} = req.body;
        if(!name || !email || !password)
            ApiError("All fields are required!", HTTP_STATUS.BAD_REQUEST);

        const isExist = await User.findOne({email});
        if(isExist)
            ApiError(`User already registered with ${email}`);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name, 
            email,
            password: hashedPassword,
            isOtpVerfied: false
        });

        return ApiResponse(res, HTTP_STATUS.CREATED, true, "User registered successfully!", 
            {
                name: newUser.name,
                email: newUser.email
            }
        );
    } 
    catch (error) 
    {
        console.log("Register user controller error", error);
        next(error);
    }
}