const isAuth = (req, res, next) => {
    if(req.session.isAuth) {
        // Proceed to execute the api
        next();
    }
    else {
        res.send({
            status: 401, 
            message: "Invalid Session. Please log in"
        })
    }
}

module.exports = isAuth;