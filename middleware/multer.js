const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null,  __dirname + '/../uploads/');
    },
    filename: function (req, file, cb) {
      console.log(file)
      cb(null, file.originalname);
    },

    fileFilter: async (req, file, callback) => {
      try {
          const ext = path.extname(file.originalname);
          if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.gif' && ext !== '.txt' && ext !== '.pdf') {
              return callback(new Error('Only image, pdf and txt files are allowed.'));
          }
          const mime = file.mimetype;
          if(mime !== 'image/jpeg' && mime !== 'text/plain' && mime !== 'image/png' && mime !== 'image/gif' && mime !== 'application/pdf') {
              return callback(new Error('Only image, pdf and text mimetypes are allowed.'));
          }
          callback(null, true);
      } catch (error) {
          return res.status(400).send("Error")
      }
  },
  limits: {
      fileSize: 20 * 1024 * 1024 // 20 MiB
  }
  });

module.exports = function () {
    
const upload = multer({ storage: storage });
return upload;

};