const multer = require('multer');
const uuid = require('uuid');

const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg'
};

const fileUpload = multer({
  limits: {fileSize:50*1024*1024},
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/images/');
    },
    filename: (req, file, cb) => {
      const ext = MIME_TYPE_MAP[file.mimetype];
      cb(null, Date.now() + '.' + ext);
    }
  }),
  fileFilter: (req, file, cb) => {
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    let error = isValid ? null : new Error('Invalid mime type!');
    console.log(error)
    cb(error, isValid);
  }
});

module.exports = fileUpload;
