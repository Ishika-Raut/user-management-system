import nodemailer from "nodemailer";
import { emailVerificationTemplate } from "../templates/emailVerificationTemplate.js";
import { forgetPasswordTemplate } from "../templates/forgetPasswordTemplate.js";

export const sendEmail = async (email, data, type = "", next) => {
    try 
    {
        const transporter = nodemailer.createTransport({
            //if we write service then node autimatically knows port, host, security settings
            //if not then manually we need to provide them
            //service:process.env.SERVICE, //services like gmail, outlook, etc
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD
            },
        });

        //select template based on the email type
        let html = "";
        let subject = "";

        switch (type) {
            case "emailVerification":
                html = emailVerificationTemplate(email, data); //data = otp
                subject = "OTP for user email verification"
                break;

            case "forgetPassword":
                html = forgetPasswordTemplate(data); //data = resetLink
                subject = "Link for password reset"
                break;
        
            default:
                break;
        }

        const mailOptions = {
            from: `"Support" <${process.env.SMTP_EMAIL}>`, //sender email - that will be shown to reciever
            to: email,
            subject,
            html
        }

        const info = await transporter.sendMail(mailOptions)

        console.log("Message sent: ", info.messageId);
        console.log("Preview: ", nodemailer.getTestMessageUrl(info));
    } 
    catch (error) 
    {
        console.log("Send email function error", error);
        next(error);
    }

}
