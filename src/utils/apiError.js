export const ApiError = (res, statusCode, message) => {
    return res.status(statusCode).json({success: false, message});
}