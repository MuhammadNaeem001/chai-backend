import {asyncHandler} from "../utils//asyncHandler.js"
import {ApiError} from "../utils//ApiError.js"
import { user } from "../models/user.models.js"
import {cloudinary} from"../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"}


const registerUser= asyncHandler (async(req,res)=>{
    // get user details from frontend

    const{fulname,email,username,password}=req.body
    console.log("email:",email);

    if(
        [fulname,email,username,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"All field are required")
    }

  const existedUser=user.findOne({
    $or:[{ username },{ password }]
  })
  if (existedUser){
    throw new ApiError(409,"user with email or username already exists")
  }

   const avatarLocalPath=req.files?.avatar[0]?.path
   const coverImageLocalPath=req.files?.avatar[0]?.path

   if (!avatarLocalPath){
    throw new ApiError(400,"avatr files is required")}

   const avatar = uploadOnClodinary(avatarLocalPath)
   const coverImage= uploadOnClodinary(coverImageLocalPath)

   if (!avatar){
    throw new ApiError(400,"avatr files is required")
   }

    const user= await user.create({
    fulname,
    avatar:avatar.url.,
    coverImage: coverImage?.url|| "",
    email,
    password,
    username: username.toLowerCase()
   })

   const createdUser= await user.findById(user._Id).select(
    "-password-refreshToken"
   )

   if(!createdUser){
    throw new ApiError(500,"something went wrong while register the user")

   }

   return res.status(201).json(
    new ApiResponse(200,createdUser,"user registerd successfully")
   )

   
})

export {registerUser}