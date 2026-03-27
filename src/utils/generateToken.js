import jwt from "jsonwebtoken";

export const generateToken = ({payload, secret, expiresIn}) => {
    try 
    {
        const token = jwt.sign(payload, secret, { expiresIn });
        return token;
    } 
    catch (error) 
    {
        console.log("Token generation error!", error);
        throw error; // let controller handle it
        // next(error) - next only exists in Express middleware/controllers
        // Your utility function doesn’t have access to it
    }
}