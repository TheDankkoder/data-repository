const express = require("express");
const fs = require("fs");
require('ejs');
const bodyParser = require('body-parser');
const Image = require('../models/image');
const upload = require("../middleware/multer")();
const basefolder = 'D:/Assignments/Internet Technologies/assignment2';
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
var ObjectId = require('mongodb').ObjectId;

module.exports = function (app) {


  
app.set('view engine', 'ejs');


  function isAuth(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).send('You are not authorized to view this resource');
    }
  }



  app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: 'mongodb://127.0.0.1:27017/local',
      ttl: 14 * 24 * 60 * 60, // session expiration time (in seconds)
    })
  }));
  

        app.use(bodyParser.urlencoded({
        extended: true
        }));


        app.post('/register', async (req, res) => {
          const {name, email, password } = req.body;
        
          // hash the password using bcrypt
          const hashedPassword = await bcrypt.hash(password, 10);
        
          // create a new user
          const user = new User({ name, email, password : hashedPassword});
        
          // save the user to the database
          await user.save();
        
          res.redirect('/login');
        });

        app.get( '/register', function( req, res ) { 
          res.render('register');
      });


      app.get( '/login', function( req, res ) { 
        res.render('login');
    });
        

       


        app.post('/login', async (req, res) => {
          const { email, password } = req.body;
        
          // find the user by email
          const user = await User.findOne({ email });
        
          if (!user) {
            // user not found
            res.status(401).json({ message: 'Invalid email ' });
          } else {
            // compare the password with the hashed password
            const passwordMatch = await bcrypt.compare(password, user.password);
        
            if (passwordMatch) {
              // set the session user ID
              req.session.userId = user._id;
              res.redirect('/');
            } else {
              // invalid password
              res.status(401).json({ message: 'Invalid  password' });
            }
          }
        });


        app.get('/logout',isAuth, (req, res, next) => {

          req.session.destroy((err) => {
              if(err) {
                  console.error(err.message);
                  return next(err);
              }
          });
    
          res.redirect('/login');
      });
    

        app.get( '/',isAuth, function( req, res ) { 
          res.render('home');
      }); 

        app.get('/profile',isAuth, async (req, res) => {
          if (req.session.userId) {
            // find the user by ID
            const user = await User.findById(req.session.userId);
        
            if (user) {
              // user is logged in
              res.send('Your files: ' + user.files);
            } else {
              // user not found
              res.status(401).json({ message: 'User not found' });
            }
          } else {
            // user is not logged in
            res.redirect('/login');
          }
        });

      
        
        
     
        app.post("/upload",upload.single('file'),(req,res)=>{
            console.log(req)
            const file = req.file;

  // save the file information in the user's files array
  User.findByIdAndUpdate(req.session.userId, {
    $push: {
      files: {
        name: file.originalname,
        url: basefolder + '/../uploads/' + `${file.originalname}`,
        access: 'private'
      }
    }
  }, (err, user) => {
    if (err) {
      res.status(500).json({ message: 'Error saving file information' });
    } else {
      res.status(200).redirect('/');
    }
  });
});


app.get('/files', isAuth, (req, res) => {
  User.findById(req.session.userId, (err, user) => {
    if (err) {
      res.status(500).json({ message: 'Error retrieving user information' });
    } else {
      var ownFileNames = [];
      const files = user.files;
      res.status(200).render('files', {files : files });
    }
  });
});

app.get('/view/:fileName',isAuth, async (req, res) => {
  const user = await User.findById(req.session.userId);
  const root = path.resolve(__dirname + "/../");
  let content;
  let foldername;
  try {
      if (user.username === 'admin') {
          const dirNames = await fs.promises.readdir(root + '/uploads/')
          for (let i = 0; i < dirNames.length; i++) {
              const filePath = root + '/uploads/' + dirNames[i] + '/' + req.params.fileName.slice(1);
              if (fs.existsSync(filePath)) {
                  if (req.params.fileName.endsWith(".txt")) {
                      content = fs.readFileSync(filePath)
                  } else if(req.params.fileName.endsWith(".pdf")) {
                      content = ""
                      foldername = dirNames[i]
                  } else {
                      content = fs.readFileSync(filePath)
                      const base64enc = Buffer.from(content).toString('base64');
                      content = base64enc;
                  }
                  break
              }                
          }
      } else {
          if (req.params.fileName.endsWith(".txt")) {
              content = fs.readFileSync(root + '/uploads/'+  req.params.fileName.slice(1))
          } else if(req.params.fileName.endsWith(".pdf")) {
              content = ""
          } else {
              content = fs.readFileSync(root + '/uploads/'+  req.params.fileName.slice(1))
              const base64enc = Buffer.from(content).toString('base64');
              content = base64enc;
          }
      }
      res.set("Content-Security-Policy", "pdf-src 'self'")
      res.render('view', {content: content, fileName: req.params.fileName.slice(1) , basefolder : basefolder})
  } catch (error) {
      res.render('error', {data: {errorType: "No such file or directory!"}});
  }
});

app.get('/removefile/:fileName', isAuth, async (req, res) => {
  var fileToDelete = path.resolve(__dirname + '/../') + '/uploads/' +  req.params.fileName.slice(1);
  fs.rmSync(fileToDelete);
  User.updateOne({
    _id: ObjectId(req.session.userId)
  }, {
    $pull: {
      files: {
        name: req.params.fileName
      }
    }
  });
  res.redirect('/files');
});


//removeFiles route and view for pdf not working

app.get('/download/:fileName',isAuth, async (req, res, next) => {
  const user = await User.findById(req.session.userId);
  var fileToDownload;
  fileToDownload = path.resolve(__dirname + "/../") + '/uploads/'+ "/" + req.params.fileName.slice(1);
  res.download(fileToDownload, req.params.fileName.slice(1), (err) => {
      if(err) {
          return next(err);
      }
  })
})
        
        
        

};