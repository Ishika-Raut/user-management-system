import nodemailer from "nodemailer";

export const sendEmail = async (email, otp, next) => {
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

        const mailOptions = {
            from: `"Support" <${process.env.SMTP_EMAIL}>`, //sender email - that will be shown to reciever
            to: email,
            subject: "OTP for verification",
            text: `You are receiving this email to verify your email address. Your OTP for email verification is: ${otp}.
This OTP will be valid for 5 minutes.`
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