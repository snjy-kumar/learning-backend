import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({
    //     message: "ok"
    // })
    //get user details from frontend
    //validation - not empty, email, password length
    //check if user exists: username, email
    //check for images, check for avatar
    //uplaod them to cloudinary , avatar
    //create user object - create entry in db
    // remove password and refresh tokens from user object
    // check for user creation
    // return response

    const {fullName, email, username, password} = req.body
    console.log("email", email)

    // if(!email || !password || !fullName || !username){
    //     throw new ApiError(400, "Please provide all the required details")
    // }
    // new style to write if condition
    if([fullName, email, username, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "Please provide all the required details")
    }
    const existedUser = User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "User already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Please upload an avatar, is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Error uploading images")
    }

    const user = await User.create({
        fullName,
        email,
        username,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    const createUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createUser){
        throw new ApiError(500, "something went wrong while registering user")
    }
    return res.status(201).json( 
        new ApiResponse(200, createUser, "User created successfully")
    )
})

export { registerUser }