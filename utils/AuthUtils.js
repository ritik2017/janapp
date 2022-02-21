const validator = require('validator');
const nodemailer = require('nodemailer');
const UserModel = require('../Models/UserModel');

const cleanUpAndValidate = ({name, password, email, username}) => {

    return new Promise((resolve, reject) => {

        if(typeof(email) != 'string') 
            reject('Invalid Email');
        if(typeof(password) != 'string')
            reject('Invalid Password');
        if(typeof(name) != 'string')
            reject('Invalid Name');
        if(typeof(username) != 'string')
            reject('Invalid Username');

        if(!email || !password || !username)
            reject('Invalid data');

        if(!validator.isEmail(email)) 
            reject('Invalid email');

        if(username.length < 3)
            reject('Username too short');
        
        if(username.length > 50)
            reject('Username too long');

        if(password.length < 5)
            reject('Password too short');

        if(password.length > 200)
            reject('Password too long');

        resolve();
    })
}

const generateVerificationToken = () => {

    const len = 8;
    let token = '';

    for(let i=0;i<len;i++) {
        token += Math.floor((Math.random() * 10) + 1);
    }
    return token;
}

const sendVerificationEmail = (email, verficationToken) => {

    let mailer = nodemailer.createTransport({
        service: "Gmail",
        createTransport: {
            user: "nohello@testaccio.com",
            pass: "mail_password"
        }
    })

    let sender = 'Todo App';
    let mailOptions = {
        from: sender,
        to: email,
        subject: "Email Verification Todo App",
        html: `Press <a href=http://localhost:3000/auth/verifyEmail/${verficationToken}> here </a> to verify your account.`
    }

    mailer.sendMail(mailOptions, function(error, response) {
        if(error) console.log(error);
        else    
            console.log('Mail sent successfully');
    })
}

function resendVerificationEmail(email) {

    const user = UserModel.findOne({email});

    sendVerificationEmail(user.email, user.verficationToken);

}

module.exports = { cleanUpAndValidate, generateVerificationToken, sendVerificationEmail };
