const express = require("express");
const app = express();
//const bcrypt = require('bcrypt');
var http  = require('http').createServer( app );


require("./startup/routes")(app);
require("./startup/db")();
require("./startup/socket")(http);


const PORT = 3000;
http.listen( PORT, function() {
    console.log( 'listening on *:' + PORT );
});


