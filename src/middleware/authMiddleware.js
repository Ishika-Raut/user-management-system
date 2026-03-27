import { ApiError } from "../utils/apiError.js";
import HTTP_STATUS from "../utils/httpStatusCodes.js";
import jwt from "jsonwebtoken";

//This middleware is verifying Access Token
export const authenticate = (req, res, next) => {
    try 
    {
        //Extract header from req
        const authHeader = req.headers.authorization;
        console.log("authHeader = ", authHeader);

        //check if authHeader is undefined or empty 
        //check if authHeader follows/uses Bearer scheme
        if(!authHeader || !authHeader.startsWith("Bearer "))
            return ApiError(res, "Unauthorized user!", HTTP_STATUS.UNAUTHORIZED);

        //Authorization: "Bearer qhedhbfjh@#%$dsnsd354" --> "Bearer Token"
        //split string by space and convert it into array 
        //[1] means extracting 2nd element from array --> which is Token
        let token = authHeader.split(" ")[1];
        console.log("Token = ", token);
        if(!token)
            return ApiError(res, "Token not found!", HTTP_STATUS.UNAUTHORIZED);

        const decode = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log("Decode data = ", decode);
        req.user = decode;

        next();
    } 
    catch (error) 
    {
        console.log("Authenticate middleware error!", error);
        next(error);
    }
}