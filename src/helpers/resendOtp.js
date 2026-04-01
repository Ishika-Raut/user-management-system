// helpers/resendOtp.js
import crypto from "crypto";
import { sendEmail } from "../services/sendEmail.js";
import { emailVerificationTemplate } from "../templates/emailVerificationTemplate.js";
import { generateOTP } from "../utils/generateOTP.js";

export const sendOtp = async (user) => {
    const otp = generateOTP();

    //crypto is Node.js’s built-in cryptography library. 
    //.createHash("sha256") - creates a SHA-256 hash object.
    //.update(otp) - This “feeds” your OTP into the hash function.
    //.digest("hex") - finalizes hash caln. "hex" means hash output is returned as hexadecimal string
    //If you don’t provide an encoding, it returns a Buffer instead of a string.
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    user.emailOtp = hashedOtp;
    user.emailOtpExpiration = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    await user.save();

    const html = emailVerificationTemplate(otp);
    await sendEmail(user.email, "Email Verification", html);
};