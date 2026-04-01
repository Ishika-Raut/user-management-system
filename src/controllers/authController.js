import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ApiError } from "../utils/apiError.js";
import HTTP_STATUS from "../utils/httpStatusCodes.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateToken } from "../utils/generateToken.js";
import jwt from "jsonwebtoken";
import { generateAccessAndRefreshTokens } from "../helpers/generateAccessAndRefreshTokens.js";
import { sendEmail } from "../services/sendEmail.js";
import { forgetPasswordTemplate } from "../templates/forgetPasswordTemplate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendOtp } from "../helpers/resendOtp.js";

export const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // if (!name || !email || !password)
    //     return ApiError(res, HTTP_STATUS.BAD_REQUEST, "All fields are required!");

    const existingUser = await User.findOne({ email });

    // Already verified
    if (existingUser && existingUser.isEmailVerified) {
        return ApiError(res, HTTP_STATUS.CONFLICT, `User already registered with ${email}`);
    }

    // Already exists but not verified → resend OTP
    if (existingUser && !existingUser.isEmailVerified) 
    {
        await sendOtp(existingUser);
        return ApiResponse(res, HTTP_STATUS.OK, "OTP resent successfully");
    }

    // New user registration
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        isEmailVerified: false,
        emailOtp: null,
        emailOtpExpiration: null,
        otpAttempts: 0
    });

    // Send OTP
    await sendOtp(newUser);

    return ApiResponse(
        res,
        HTTP_STATUS.CREATED,
        "User registered successfully! OTP sent on your email.",
        { name: newUser.name, email: newUser.email }
    );
});



export const verifyOtp = asyncHandler( async (req, res) => {
    
    const {email, otp} = req.body;
    // if(!email || !otp)
    //     return ApiError(res, "All fields are required!", HTTP_STATUS.BAD_REQUEST);

    //find user
    const user = await User.findOne({email});
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
    const hashedIncomingOtp = crypto.createHash("sha256").update(otp).digest("hex")
    if (hashedIncomingOtp !== user.emailOtp)
    {
       return ApiError(res, "Invalid OTP!", HTTP_STATUS.NOT_FOUND);
    }

    user.isEmailVerified = true;
    user.otpAttempts = 0;
    user.emailOtp = null; 
    user.emailOtpExpiration = null; 

    await user.save();

    return ApiResponse(res, HTTP_STATUS.OK, "User email is verified successfully!");
});


export const login = async (req, res, next) => {
    try 
    {
        const { email, password } = req.body;
        
        // if(!email || !password)
        //     return ApiError(res, HTTP_STATUS.BAD_REQUEST, "All fields are required!");

        const user = await User.findOne({email});
        if(!user)
            return ApiError(res, HTTP_STATUS.NOT_FOUND, `User does not registered with ${email}`);

        if(!user.isEmailVerified)
            return ApiError(res, HTTP_STATUS.UNAUTHORIZED, `Your email is not verified!`);

        const isPasswordMatched = await bcrypt.compare(password, user.password);
        if(!isPasswordMatched)
            return ApiError(res, HTTP_STATUS.UNAUTHORIZED, "Invalid Password!");

        const accessToken = generateToken({
            payload: { id: user._id, email: user.email },
            secret: process.env.ACCESS_TOKEN_SECRET,
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        });

        const refreshToken = generateToken({
            payload: { id: user._id },
            secret: process.env.REFRESH_TOKEN_SECRET,
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        });

        user.refreshToken = refreshToken;
        await user.save();
        
         // store refresh token in HTTP-only cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true, 
            sameSite: "Strict",
            maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRY_MS)
        });

        return ApiResponse(res, HTTP_STATUS.OK, "User logged in successfully!",
            {
                name: user.name,
                email: user.email
            },
            { accessToken }  //send Access token in Authorization header
        );
    } 
    catch (error) 
    {
        console.log("Login user controller error", error);
        next(error);
    }
}



// Protected route flow:
// Client → sends access token → authenticate middleware → verified → allow access
// Refresh flow:
// Client → sends refresh token (cookie) → refresh controller → verify → issue new access token

//authenticate middleware is not used in refresh route
//So refresh token must be verified inside controller

//Why not use authenticate middleware for refresh route?
//Middleware expects Authorization header, and Refresh token is in cookies

//if user logs in and Access token expires Backend responds → 401 Unauthorized
//401 -> It comes from your authentication middleware
//NOT called manually by user. It is called automatically by frontend when access token expires.

export const refreshAccessToken = asyncHandler( async (req, res, next) => {
    
    const oldRefreshToken = req.cookies.refreshToken;
    if (!oldRefreshToken)
        return ApiError(res, HTTP_STATUS.UNAUTHORIZED, "Refresh token missing");

    // Find user with this refresh token
    const user = await User.findOne({ refreshToken: oldRefreshToken });
    if (!user)
        return ApiError(res, HTTP_STATUS.FORBIDDEN, "Invalid refresh token");

    // Verify old refresh token
    // jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    //     if (err || decoded.id !== user._id.toString())
    //         return ApiError(res, HTTP_STATUS.FORBIDDEN, "Invalid or expired refresh token");
    // }); //return inside callback does NOT stop outer function

    //use sync version
    let decoded;
    try {
        decoded = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        return ApiError(res, HTTP_STATUS.FORBIDDEN, "Invalid or expired refresh token");
    }

    if (decoded.id !== user._id.toString()) {
        return ApiError(res, HTTP_STATUS.FORBIDDEN, "Invalid refresh token");
    }

    // Rotate tokens
    const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    // Update refresh token cookie
    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRY_MS)
    });

    // Send new access token in response
    return ApiResponse(res, HTTP_STATUS.OK, "Access token refreshed successfully", null, 
        {
            accessToken: newAccessToken
        }
    );
});


//On logout only refresh token will be invalidated
export const logout = asyncHandler( async (req, res, next) => {
   
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return ApiResponse(res, HTTP_STATUS.OK, "User already logged out!");
    }

    const user = await User.findOne({ refreshToken });
    if(!user)
        return ApiError(res, HTTP_STATUS.NOT_FOUND, `User does not found!`);
        
    user.refreshToken = null;
    await user.save();

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "Strict"
    });

    return ApiResponse(res, HTTP_STATUS.OK, "User logged out successfully");
});



export const requestPasswordReset = asyncHandler( async (req, res, next) => {
    
    const { email } = req.body;
    if (!email) return ApiError(res, HTTP_STATUS.BAD_REQUEST, "Email is required");

    const user = await User.findOne({ email });
    if (!user) return ApiError(res, HTTP_STATUS.NOT_FOUND, "No user registered with this email");

        // Prevent unverified users from resetting password
    if (!user.isEmailVerified) {
        return ApiError(res, HTTP_STATUS.UNAUTHORIZED, "Please verify your email first.");
    }

    //Generate secure token
    //Generates 32 random bytes. Each byte is 8 bits → 32 bytes = 256 bits of entropy
    //Why 32 bytes - Long enough to prevent brute force attacksVery secure and hard to guess
    //.toString("hex") - Converts those 32 bytes into a hexadecimal string
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000); //10 min

    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    console.log("hashed token i request passwrd api = ", hashedToken);

    //save token in db
    user.passwordResetToken = hashedToken;
    user.passwordResetTokenExpiration = tokenExpiry;
    await user.save();

    // Create reset link
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    console.log("Reset Link = ", resetLink);

    const html = forgetPasswordTemplate(resetLink)
    await sendEmail(email, "Request for reset password" ,html);

    return ApiResponse(res, HTTP_STATUS.OK, "Password reset link sent to your email");
});



export const resetPassword = asyncHandler( async (req, res, next) => {
    
    const { token, newPassword, confirmPassword } = req.body;
    
    if (!token || !newPassword || !confirmPassword)
        return ApiError(res, HTTP_STATUS.BAD_REQUEST, "All fields are required");

    //Hash incoming token before comparing
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    console.log("hashedToken = ", hashedToken);

    console.log("passwordResetToekn = ", user.passwordResetToken);
    // Validate token
    if (!user.passwordResetToken || user.passwordResetToken !== hashedToken)
        return ApiError(res, HTTP_STATUS.BAD_REQUEST, "Invalid or expired token");

    if (user.passwordResetTokenExpiration < new Date())
        return ApiError(res, HTTP_STATUS.BAD_REQUEST, "Token expired");

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetTokenExpiration: { $gt: new Date() }
    });
    
    if (!user) 
        return ApiError(res, HTTP_STATUS.NOT_FOUND, "User not found");

    // Prevent unverified users from resetting password
    if (!user.isEmailVerified) {
        return ApiError(res, HTTP_STATUS.UNAUTHORIZED, "Your email is not verified.");
    }

    if(newPassword !== confirmPassword )
        return ApiError(res, HTTP_STATUS.BAD_REQUEST, "Invalid password!");

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Invalidate token and refresh tokens
    user.passwordResetToken = null;
    user.passwordResetTokenExpiration = null;
    //Refresh tokens Must be invalidated immediately on password reset.
    //why ?
    //Prevents old refresh tokens from generating new access tokens.
    //Logs out the user from all devices/sessions.
    user.refreshToken = null;
    await user.save();

    return ApiResponse(res, HTTP_STATUS.OK, "Password reset successfully");   
});