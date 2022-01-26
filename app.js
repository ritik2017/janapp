// Import NPM Modules
const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const validator = require('validator');
const session = require('express-session');
const MongoDBSession = require('connect-mongodb-session')(session);

// Import Utils
const { mongoURI } = require('./private-constants'); 
const { cleanUpAndValidate } = require('./utils/AuthUtils');

// Import Models
const UserModel = require('./Models/UserModel');
const TodoModel = require('./Models/TodoModel');

const app = express();

// Middleware 
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));

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

const store = new MongoDBSession({
    uri: mongoURI,
    collection: 'mySessions'
})

app.use(session({
    secret: "Our Secret key",
    resave: false,
    saveUninitialized: false,
    store: store
}))

const PORT = 3000;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then((res) => {
    // console.log(res);
    console.log('Connected to the database');
})

// ejs - Template rendering engine
app.set('view engine', 'ejs');

// API's begin here

app.get('/', (req, res) => {
    res.send('Welcome to our app');
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

    // We can log in the user 
    req.session.isAuth = true;
    req.session.user = { username: user.username, email: user.email };

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

// app.post('/logout_from_all_devices', (req, res) => {
//     req.session.user.username;
// })

app.get('/home', isAuth, (req, res) => {

    res.send(`
        <html>
            <head></head>
            <body>
                <h1> Welcome to home page </h1>

                <form action='/logout' method='POST'>
                    <button> Logout </button>
                </form>

            </body>

        <html>
    `);
})

// ToDo App API's
app.get('/dashboard', isAuth, async (req, res) => {

    let todos = [];

    try {
        todos = await TodoModel.find({username: req.session.user.username});
        // return res.send({
        //     status: 200,
        //     message: "Read successful",
        //     data: todos
        // })
        // console.log(todos);
    }
    catch(err) {
        return res.send({
            status: 400,
            message: "Database Error. Please try again"
        })
    }

    res.render('dashboard', {todos: todos});

    // res.send({
    //     status: 200,
    //     message: "Successful",
    //     data: todos
    // })
})

app.post('/create-item', isAuth, async (req, res) => {

    console.log(req.body);

    const todoText = req.body.todo;

    if(!todoText) {
        return res.send({
            status: 404,
            message: "Missing Parameters"
        })
    }

    if(todoText.length > 100) {
        return res.send({
            status: 400,
            message: "Todo too long. Max characters allowed is 100."
        })
    }

    let todo = new TodoModel({
        todo: todoText,
        username: req.session.user.username
    })

    try {
        const todoDb = await todo.save();
        return res.send({
            status: 200,
            message: "Todo created successfully",
            data: todoDb
        })
    }
    catch(err) {
        return res.send({
            status: 400,
            message: "Database error. Please try again",
            error: err
        })    
    }
})

// find the item and update the item

app.post('/edit-item', isAuth, async (req, res) => {

    const id = req.body.id;
    const newData = req.body.newData; // {todo: "A todo"}

    if(!id || !newData || !newData.todo) {
        return res.send({
            status: 404,
            message: "Missing Paramters.",
            error: "Missing todo data"
        })
    }
    
    try {
        const todoDb = await TodoModel.findOneAndUpdate({_id: id}, {todo: newData.todo});
        return res.send({
            status: 200,
            message: "Update Successful",
            data: todoDb
        })
    }
    catch(err) {
        return res.send({
            status: 400,
            message: "Database Error. Please try again",
            error: err
        })
    }
})

app.post('/delete-item', isAuth, async (req, res) => {

    const id = req.body.id;

    if(!id) {
        return res.send({
            status: 404,
            message: "Missing parameters",
            error: "Missing id of todo to delete"
        })
    }
    
    try {
        const todoDb = await TodoModel.findOneAndDelete({_id: id});

        return res.send({
            status: 200,
            message: "Todo Deleted Succesfully",
            data: todoDb
        })
    }
    catch(err) {
        return res.send({
            status: 400,
            message: "Database error. Please try again.",
            error: err
        })
    }
})

// app.get('/mypage', isAuth, (req, res) => {
//     res.send('Welcome to my page');
// })

// app.get('/openpage', (req, res) => {
//     res.send('This is a open page. Anyone can view it.')
// })

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
})

// Create a folder
// npm init
// npm install express

// ipconfig - Windows
// ifconfig - linux

// Lazy Loading

// express-session - Store session in client
// connect-mongodb-session - Store session in server

// req.session.isAuth will only be true if user is logged in

// middlewares - app.use(), app.get('/apiname', middleware1, middleware2, (req, res) => {})

// Dev1, Dev2, Dev3, Dev4, Dev5 -> Ses1, Ses2, Ses3, Ses4, Ses5

// Login from a device - 1 session is created - username=ritik
// Login from device2 - 1 more session is created - username=ritik

// Netflix - 4 screen at one time - 100 devices 
// 100 Devices = 100 sessions
// At any moment only 4 sessions at max will response 

// Create, Read, Update, Delete 

// create, update, delete -> More Important

// Allow random users to keep on creating data our database will be out of capacity to store data.

// Anything that performs create, update, delete should be protected using session based auth. 

// Anyone can create an account on todoapp -> Create a todo

// 1. Unauth users - Done (Session based authentication)
// 2. Authenticated Users
//    a. One account - Add a limit ( Ex - Youtube comment) - 30 comments(500 character) / min - 500*30=15000 character/min 
//    b. Multiple Accounts - 

// Keep pressing a button - Too many requests. Please try after some time.

// Add a limit - Charcter Limit(Done), Number of API call(To be done)

// app.js -> f1 -> f2

// axios

// Pagination, Rate Limiting

// Normalisation, Indexing, Cloud, Deployment a app, Load Balancing, Scaling of DB, Database migration

// Buy a domain - ourtodoapp.com -> 10.100.109.14 

// Small site - Wiki - 10Mb - index.html

// Serverless - domain -> index.html

// MVC - Model, Views, Controllers