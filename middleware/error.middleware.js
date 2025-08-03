function errorMiddleware(error, req, res, next) {
    let { status = 500, message, data } = error;

    
    if(error.code && error.code.startsWith('23')){
        status = 400; 
        message= 'Database constraint violated';
    }
    else if(error.code && error.code.startsWith('42')){
        status = 400; 
        message= 'Database query error';
    }


    if(!message){
        message='Internal server error';

    }

    console.error(`[${req.method} ${req.originalUrl}] [${status}] ${error.stack || error}`);


    return res.status(status).json({
        type: 'error',
        status,
        message,
        ...(data && {data})

    });
        
}

export default errorMiddleware;
