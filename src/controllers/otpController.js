import User from "../models/userModel.js";
import { sendEmail } from "../services/sendEmail.js";
import { generateOTP } from "../utils/generateOTP.js";
import bcrypt, { compare } from "bcryptjs";
import HTTP_STATUS from "../utils/httpStatusCodes.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const sendOtp = async (req, res, next) => {
    try 
    {
        const {email} = req.body;
        if(!email)
            return ApiError(res, "All fields are required!", HTTP_STATUS.BAD_REQUEST);

        const user = await User.findOne({email});
        if(!user)
            return ApiError(res, "User does not exist!", HTTP_STATUS.NOT_FOUND);

         if(user.isEmailOtpVerified)
            return ApiError(res, "Your email already verified!", HTTP_STATUS.BAD_REQUEST);

        //generate 6-digit 
        const otp = generateOTP();

        //hash otp
        const hashedOtp = await bcrypt.hash(otp, 10);

        //store hashed otp in user
        user.emailOtp = hashedOtp;

        //set expiration time for generated otp
        const expiredOtp = new Date(Date.now() + 5 * 60 * 1000);
        user.emailOtpExpiration = expiredOtp;

        await user.save();

        await sendEmail(email, otp);      

        return ApiResponse(res, HTTP_STATUS.OK, "OTP sent successfully!");
    } 
    catch (error)
    {
        console.log("Send otp controller error", error);
        next(error);
    }
}



export const verifyOtp = async (req, res, next) => {
    try 
    {
        const {userId, otp} = req.body;
        if(!userId || !otp)
            return ApiError(res, "All fields are required!", HTTP_STATUS.BAD_REQUEST);

        //find user
        const user = await User.findById(userId);
        if(!user)
            return ApiError(res, "User does not exist!", HTTP_STATUS.NOT_FOUND);

        // Check OTP expiration
        // user.otpExpiration time - 10:35
        // new Date() - gives current date and time - 10:36
        // 10:36 > 10:35 => true - OTP expired!
        if (!user.emailOtpExpiration || new Date() > user.emailOtpExpiration) {
            return ApiError(res, "OTP expired!", HTTP_STATUS.BAD_REQUEST);
        }
        
        //match entered otp with stored otp in user db
        const isOtpMatched = await compare(otp, user.emailOtp);
        if(!isOtpMatched)
            return ApiError(res, "Invalid OTP!", HTTP_STATUS.NOT_FOUND);

        user.isEmailOtpVerified = true;
        user.emailOtp = null; 
        user.emailOtpExpiration = null; 

        await user.save();

        return ApiResponse(res, HTTP_STATUS.OK, "User email is verified successfully!");
    } 
    catch (error) 
    {
        console.log("Verify otp controller error", error);
        next(error);
    }
}


//if(user.lastOtpSentAt && Date.now() - user.lastOtpSentAt < 30000)