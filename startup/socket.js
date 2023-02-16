
module.exports = function (server) {

  const io = require("socket.io")(server);

  io.on( 'connection', function( socket ) {
    console.log( 'a user has connected!' );
    
    socket.on( 'disconnect', function() {
        console.log( 'user disconnected' );
    });
    
});

};
