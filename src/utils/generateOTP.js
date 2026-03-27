
//Generate 6 digit OTP 
export const generateOTP  =  () => {

    try 
    {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        return otp;
    } 
    catch (error) 
    {
        console.log("OTP generation error!", error);
        next(error);
    }
}