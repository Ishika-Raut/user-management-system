export const forgetPasswordTemplate = (resetLink ) => {
    return `<div>
            <p>You are recieving this because you have requested for password reset.</p>
            <p>Please follow this link to reset your password: ${resetLink}</p>
            </div>`;
}