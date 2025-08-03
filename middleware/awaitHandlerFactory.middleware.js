const awaitHandlerFactory = (func) => {
    return async (req, res, next) => {
        try {
          await func(req, res)
            // res.send({result});
                } catch (err) {
            next(err)
        }
    }
}

export default awaitHandlerFactory;