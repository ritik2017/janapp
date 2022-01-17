// Import NPM Modules
const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const validator = require('validator');

// Import Utils
const { mongoURI } = require('./private-constants'); 
const { cleanUpAndValidate } = require('./utils/AuthUtils');

// Import Models
const UserModel = require('./Models/UserModel');

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const PORT = 3000;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then((res) => {
    // console.log(res);
    console.log('Connected to the database');
})

app.get('/', (req, res) => {
    res.send('Welcome to our app');
})

// ejs - Template rendering engine
app.set('view engine', 'ejs');

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

    let user;
    if(validator.isEmail(loginId)) {
        // loginId is a email
        user = await UserModel.findOne({email: loginId});
    }
    else {
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

    return res.send({
        status: 200,
        message: "Login Successful",
        data: {
            name: user.name,
            email: user.email,
            username: user.username
        }
    })
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
            data: userDb
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

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
})

// Create a folder
// npm init
// npm install express

// ipconfig - Windows
// ifconfig - linux

// Lazy Loading