export const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error))
    }
}

//It wraps our controller functions into a Promise - beause our async fuctions returns a Promise
//If promise is not resolved --> means error occurred --> asyncHandler automatically calls next(error)
//next(error) --> global error handler

// With try-catch
// Controller --> Error --> try-catch --> we are sending the response

// With asyncHandler
// Controller --> Error --> asyncHandler catches it --> next(error) calls Global error handler --> sends response

// try-catch --> we handle errors manually
// asyncHandler --> Express handles errors (centralized)
