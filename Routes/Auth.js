const express = require('express');
const isAuth = require('../middleware');
const { cleanUpAndValidate } = require('../utils/AuthUtils');
const UserModel = require('../Models/UserModel');
const bcrypt = require('bcrypt');
const validator = require('validator');

const app = express.Router();

app.get('/', (req, res) => {
    res.send('Authentication');
})

// Sends the user login page
app.get('/login', (req, res) => {
    res.render('login'); 
})

// Sends the register page
app.get('/register', (req, res) => {
    res.render('register');
})

// Allow the user to login
app.post('/login', async (req, res) => {

    const { loginId, password } = req.body;

    if(!loginId || !password) {
        return res.send({
            status: 404,
            message: "Missing Parameters"
        })
    }
    //email= ritik@gmail.com  username=kumar@outlook.com
    let user;
    if(validator.isEmail(loginId)) {
        // loginId is a email
        user = await UserModel.findOne({email: loginId});
    }

    if(!user) {
        // loginId is a username
        user = await UserModel.findOne({username: loginId});
    }
    
    // User not found
    if(!user) {
        return res.send({
            status: 401,
            message: "User not found",
            data: req.body
        })
    }

    // Match the password
    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch) {
        return res.send({
            status: 401,
            message: "Invalid Password",
            data: req.body
        })
    }

    // We can log in the user 
    // req.session.isAuth = true;
    // req.session.user = { username: user.username, email: user.email };

    console.log(req.session);

    res.redirect('/dashboard');

    // return res.send({
    //     status: 200,
    //     message: "Login Successful",
    //     data: {
    //         name: user.name,
    //         email: user.email,
    //         username: user.username
    //     }
    // })

    //
})

// Allow the user to register
app.post('/register', async (req, res) => {

    console.log(req.body);
    const { name, email, password, username } = req.body;

    try {
        await cleanUpAndValidate({name, email, username, password});
    }
    catch(err) {
        return res.send({
            status: 400,
            message: "Invalid data",
            error: err
        })
    }

    // Check user already exists
    try {
        let userEmail = await UserModel.findOne({email})
        let userUsername = await UserModel.findOne({username});

        // console.log("Useremail", userEmail);
        // console.log("Username", userUsername);

        if(userEmail) {
            return res.send({
                status: 401,
                message: "Email already exists"
            })
        }
        if(userUsername) {
            return res.send({
                status: 401,
                message: "Username already taken"
            })
        }
    }
    catch(err) {
        return res.send({
            status: 400,
            message: "Database error. Please try again",
            error: err
        })
    }

    const hashedPassword = await bcrypt.hash(password, 13);

    // Save the data to db
    const user = new UserModel({
        name,
        email,
        username,
        password: hashedPassword
    })

    try {
        const userDb = await user.save();

        return res.send({
            status: 200,
            message: "Registration Successful",
            data: {
                name: userDb.name,
                email: userDb.email,
                username: userDb.username
            }
        })
    }
    catch(err) {
        return res.send({
            status: 400,
            message: "Database error",
            error: err
        })
    }
})

app.post('/logout', (req, res) => {

    console.log(req.session);
    console.log(req.session.id);

    req.session.destroy((err) => {
        if(err) throw err;

        res.redirect('/');
    })
})

// Delete all sessions of the current user
app.post('/logout_from_all_devices', isAuth, async (req, res) => {
    const username = req.session.user.username;

    const Schema = mongoose.Schema;

    const sessionSchema = new Schema({_id: String}, {strict: false});
    const SessionModel = mongoose.model('mysessions', sessionSchema, 'mysessions');

    try {
        const sessionsDb = await SessionModel.deleteMany({'session.user.username': username});

        console.log(sessionsDb);

        res.send({
            status: 200,
            message: "Logged out of all devices"
        })
    }
    catch(err) {
        res.send({
            status: 400,
            message: "Logout Failed",
            error: err
        })
    }

})

module.exports = app;