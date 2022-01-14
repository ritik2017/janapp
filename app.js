const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const { mongoURI } = require('./private-constants'); 
const { cleanUpAndValidate } = require('./utils/AuthUtils');

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const PORT = 3000;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then((res) => {
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
app.post('/login', (req, res) => {

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
})

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
})

// Create a folder
// npm init
// npm install express