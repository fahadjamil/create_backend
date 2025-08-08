module.exports = (app) => {
    let router = require('express').Router()
    let userController = require('../controllers/user.controller')

    router.get('/signup', userController.signup)


     // Mount the router on a base path
    app.use('/user', router);
}