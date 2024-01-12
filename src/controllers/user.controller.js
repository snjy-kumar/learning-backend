import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"




const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating refresh and access tokens")

    }
}


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
    // console.log("fullName", fullName)
    // console.log("username", username)
    // console.log("password:", password)

    // if(!email || !password || !fullName || !username){
    //     throw new ApiError(400, "Please provide all the required details")
    // }
    // new style to write if condition
    if([fullName, email, username, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "Please provide all the required details")
    }
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "User already exists")
    }

    // console.log("req.files", req.files)

    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    // ^^ this is the same as the following code but in advanced way
    // this is simple and classic way to write the same code as above
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

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

const loginUser = asyncHandler(async (req, res) => {
    // req body - email, password (data)
    // validate email, password
    // check if user exists
    // check if password is correct
    // generate access token and refresh token
    // send cookies with refresh token

    const { email, username, password } = req.body
    // if(!email || !password){ // this checks even if one condition is true but we want to check both conditions 
    // so we can use if(!email && !password) and the below code as well.
    if(!(email || password)){
        throw new ApiError(400, "Please provide email and password")
    }
    const user = await User.findOne({$or: [{email}, {username}]})
    if(!user){
        throw new ApiError(404, "Invalid credentials")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    
    if(!isPasswordValid){
        throw new ApiError(401, "password incorrect invalid credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true, // only https connection can send this cookie
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user: accessToken, loggedInUser, refreshToken
        }, "User logged in successfully")
    )

})

// can use _ if res variable is not used in the function like this async (req, _, next)
const logoutUser = asyncHandler(async (req, res) => {
   await User.findByIdAndUpdate(
    req.user._id, {
        $set: {
            refreshToken: undefined
        }
    },
        {
            new: true
        }
   )

   const options = {
    httpOnly: true,
    secure: true
   }
   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request") 
    }
    try {
        const decodeToken =  jwt.verifty(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        )
    
        const user = await User.findById(decodeToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,{
                    accessToken, refreshToken: newRefreshToken },
                    "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    // put above confirmPassword in req.body
    // can check newPassword and confirmPassword here as well 
    // if(newPassword !== confirmPassword){
    //     throw new ApiError(400, "Password and confirm password does not match")
    const user = User.findById(req.user?._id)
    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave: false})
    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(200, req.user, "User details fetched successfully")
})

const updateAccountDetails = asyncHandler(async (req, res) => {

    const { fullName, email } = req.body
    if(!fullName || !email){
        throw new ApiError(400, "Please provide all the required details")
    }
    User.findByIdAndUpdate(req.user?._id, {
        $set: {
            fullName,
            email: email // both are same 
        }
    }, {new: true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))

})

//Note: suggetion if we want to update file like avatar or coverImage we should make another js file or controller for that let them save the data/image on the updation time, it will make response not to save text response again and again.

const updateUserAvatar = asyncHandler(async(req, res) =>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            },
        },
        {
            new: true
        }

    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar Image updated successfully")
    )
})
const updateUserCoverImage = asyncHandler(async(req, res) =>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400, "Avatar is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading on cover Image")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            },
        },
        {
            new: true
        }

    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "cover Image updated successfully")
    )
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage }