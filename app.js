// Import NPM Modules
const express = require('express');
const mongoose = require('mongoose'); // ORM 
const session = require('express-session');
const MongoDBSession = require('connect-mongodb-session')(session);

// Import Utils
const { mongoURI } = require('./private-constants'); 

// Import Models
const TodoModel = require('./Models/TodoModel');
const AccessModel = require('./Models/AccessModel');

//Import Routes
const AuthRouter = require('./Routes/Auth');

//Import Middleware
const isAuth = require('./middleware');

const app = express();

// Middleware 
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));

// Auth Related routes
app.use('/auth', AuthRouter);

// rate limiting
const rateLimiting = async (req, res, next) => {

    const sessionId = req.session.id; // This is unique to any user 

    // console.log(req.session);
    // console.log(sessionId);

    if(!sessionId) {
        return res.send({
            status: 404,
            message: "Invalid Session. Please log in."
        })
    }

    // Rate limiting logic

    // If user has accessed the api recently

    const sessionTimeDb = await AccessModel.findOne({sessionId: sessionId});
    
    if(!sessionTimeDb) {
        // Create - Session is not present
        const accessTime = new AccessModel({
            sessionId: req.session.id,
            time: Date.now()
        })
        await accessTime.save();
        next();
        return; 
    }
    
    const previousAccessTime = sessionTimeDb.time;
    const currentTime = Date.now();

    if((currentTime - previousAccessTime) < 1000) {
        return res.send({
            status: 401,
            message: "Too many requests. Please try in some time."
        })
    }

    // Update if already present
    await AccessModel.findOneAndUpdate({sessionId: sessionId}, {time: Date.now()});
    next();
}

const store = new MongoDBSession({
    uri: mongoURI,
    collection: 'mysessions' 
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

app.get('/home', isAuth, rateLimiting, (req, res) => {

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
app.get('/dashboard', isAuth, rateLimiting, async (req, res) => {

    // let todos = [];

    // try {
    //     todos = await TodoModel.find({username: req.session.user.username});
    //     // return res.send({
    //     //     status: 200,
    //     //     message: "Read successful",
    //     //     data: todos
    //     // })
    //     // console.log(todos);
    // }
    // catch(err) {
    //     return res.send({
    //         status: 400,
    //         message: "Database Error. Please try again"
    //     })
    // }

    res.render('dashboard');

    // res.send({
    //     status: 200,
    //     message: "Successful",
    //     data: todos
    // })
})

app.post('/pagination_dashboard', isAuth, rateLimiting, async (req, res) => {

    const skip = req.query.skip || 0;
    const LIMIT = 5;
    const username = req.session.user.username;

    try {
        // Read the first 5 todos -> Read -> find({username: "ritik"}) skip limit
        // Aggregation -> If we want perform multiple actions in a mongodb query, we can use aggregation

        let todos = await TodoModel.aggregate([
            {$match: {username: username}},
            {$sort: {todo: 1}},
            {$facet: {
                data: [ {$skip: parseInt(skip)}, {$limit: LIMIT} ]
            }}
        ])

        return res.send({
            status: 200,
            message: "Read Successful",
            data: todos
        })

    }
    catch(err) {
        return res.send({
            status: 400,
            message: "Database error. Please try again"
        })
    }
})

app.post('/create-item', isAuth, rateLimiting, async (req, res) => {

    console.log(req.body);

    const todoText = req.body.todo;

    console.log(todoText);

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

app.post('/edit-item', isAuth, rateLimiting, async (req, res) => {

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

app.post('/delete-item', isAuth, rateLimiting, async (req, res) => {

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

app.listen(process.env.PORT || PORT, () => {
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

// ORM - Mongoose

// Reverse order => 
// Return data in reverse order -> Backend
// sorting -> time -> 
// 1. add a key in TodoModel -> creation_datetime
// 2. $sort in descending order using creation_datetime

// Show data in reverse order -> frontend

// System -> APIs (Functionality) 
// 1. Open APIs(Only Read op is allowed) - Home page, Posts, Videos on youtube 
// 2. Private APIs(Authenticated) -> Create, Update, Delete (DB write ops)
// 2a. Admin APIs -> isAdmin -> true
// 2b. User APIs 

// Authentication -> /register, /login, /logout

// User, Post, Order, Product

// Without session based auth -> Series of api's that can be hit from the site 
// username, password -> client storage -> send automatically 
// Token -> Random string -> user -> client and db 
// Validity -> Scenario 

// Collections in db
// 1. user -> UserModel
// 2. todo -> TodoModel
// 3. mySessions -> Dummy Schema

// Deleted Op 
// 1. Actually delete the data
// 2. Add a key(isDeleted) mark it as true

// Select p.id, p.name, p.dob, p.cardno, c.expiry from PersonDetails p INNER JOIN 
// CardDetails c ON p.cardno = c.cardno

// Select p.id, p.name, p.dob, p.cardno, c.expiry from PersonDetails p LEFT JOIN 
// CardDetails c ON p.cardno = c.cardno

// Select p.id, p.name, p.dob, p.cardno, c.expiry from PersonDetails p RIGHT JOIN 
// CardDetails c ON p.cardno = c.cardno

// Select p.id, p.name, p.dob, p.cardno, c.expiry from PersonDetails p OUTER JOIN 
// CardDetails c ON p.cardno = c.cardno

// Select p.id, p.name, p.country, c.state from PersonDetails p INNER JOIN CountryDetails c 
// ON p.country = c.country

// Default Join -> Inner JOIN
// Natural Join -> Inner Join, LEFT Join, Right Join