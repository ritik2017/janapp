const validator = require('validator');

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

module.exports = { cleanUpAndValidate };
