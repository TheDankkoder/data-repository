const mongoose = require('mongoose')


module.exports = function () {
    
    const url = "mongodb://127.0.0.1:27017/local"


    mongoose.connect(url, {useNewUrlParser:true})
    const con = mongoose.connection
    
    con.on('open', () => {
        console.log('connected...')
    })
};