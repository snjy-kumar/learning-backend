import { v2 as cloudinary} from "cloudinary"
import { response } from "express";
import  fs  from "fs"

          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })
        //file has been uploaded on cloudinary successfully
        // console.log("file is uploaded on cloudinary", response.url);
        fs.unlinkSync(localFilePath) //remove the locally saved file to save space
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally saved file to save space as the upload failed
        return null
    }
}

export { uploadOnCloudinary }