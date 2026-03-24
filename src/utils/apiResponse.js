export const ApiResponse = (res, statusCode,  message, data = null, extra = null) => {

    return res.status(statusCode).json({
        success: true,
        message,
        data,
        extra
    });
}