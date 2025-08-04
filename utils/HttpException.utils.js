class HttpException extends Error {
    constructor(status, message, stack=null) {
        super(message);
        this.status = status;
        this.message = message;
        this.stack = stack || (new Error().stack);
    }
}

const errorMiddleware = (err,req,res,next)=>{
    if(err instanceof HttpException) {
        res.status(err.status).json({error: err.message});
    } else {
        res.status(500).send('Internal Server Error');
    }
};

export {HttpException, errorMiddleware};