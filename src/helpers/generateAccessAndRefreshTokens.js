import User from "../models/userModel.js";
import { generateToken } from "../utils/generateToken.js";

export const generateAccessAndRefreshTokens = async (userId) => {
    try 
    {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        // Generate new tokens
        const newAccessToken = generateToken({
            payload: { id: user._id, email: user.email },
            secret: process.env.ACCESS_TOKEN_SECRET,
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        });

        const newRefreshToken = generateToken({
            payload: { id: user._id },
            secret: process.env.REFRESH_TOKEN_SECRET,
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        });

        // Rotate refresh token in DB
        user.refreshToken = newRefreshToken;
        await user.save();

        return {
            newAccessToken,
            newRefreshToken
        };
    } 
    catch (error) 
    {
        console.log("Generate Access And Refresh Tokens error:", error);
        throw error; // don't use next() here
    }
};