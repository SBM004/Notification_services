const awaitHandlerFactory = (middleware) => {
    return async (req, res, next) => {
        try {
            await middleware(req, res)
            
        } catch (err) {
            next(err)
        } 
    }
}

export default awaitHandlerFactory;
