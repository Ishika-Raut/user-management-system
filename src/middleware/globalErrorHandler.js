export const globalErrorHandler = (error, req, res, next) => {

    const statusCode = 500;

    res.status(statusCode).json({
        success: false,
        message: error.message || "Internal server error"
    });
}