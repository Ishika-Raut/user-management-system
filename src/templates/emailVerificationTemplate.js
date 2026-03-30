export const emailVerificationTemplate = (email, otp) => {
    return `<div>
            <p>You are recieving this email to verify your eamil address: ${email}</p>
            <p>To verify your email please enter this OTP: ${otp}. </p>
            <p>This OTP will be valid for 5 minutes.</p>
            </div>`;
}