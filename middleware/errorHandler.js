
const errorHandler = (err, req, res, next) => {
    console.error("Error:", err);

    let error = { ...err };
    error.message = err.message;

    if (err.name === "ValidationError") {
        const message = Object.values(err.errors)
            .map((error) => error.message)
            .join(", ");
        error = {
            message,
            statusCode: 400,
        };
    }

    if (err.code === 11000) {
        const message = "Duplicate field value entered";
        error = {
            message,
            statusCode: 400,
        };
    }

    if (err.name === "CastError") {
        const message = "Resource not found";
        error = {
            message,
            statusCode: 404,
        };
    }

    res.status(error.statusCode || 500).json({
        error: error.message || "Server Error",
    });
};

module.exports = errorHandler;
