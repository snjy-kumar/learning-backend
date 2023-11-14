import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)
      // cb(null, Date.now() + "-" + file.originalname)
      // change the name of the file to be the original name of the file
    }
  })
  
export const upload = multer({ 
    storage, 
})