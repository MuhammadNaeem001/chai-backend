import {asyncHandler} from "../utils//asyncHandler.js"
import {ApiError} from "../utils//ApiError.js"
import { User } from "../models/user.models.js"
import {uploadOnCloudinary} from"../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { response } from "express"

const generateAccessAndRefereshToken= async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken= user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
       await user.save({valdateBeforeSave:false})

       return {accessToken,refreshToken}

    } catch (error) {
        console.log(error)
        throw new ApiError (500,"something went wromg while generating the referesh and acess token")
        
    }
}


const registerUser = asyncHandler( async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res


  const {fullName, email, username, password } = req.body
  console.log("email: ", email);
  console.log(username)

  if (
      [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
      throw new ApiError(400, "All fields are required")
  }

  const existedUser = await User.findOne({
      $or: [{ username }, { email }]
  })
  console.log({existedUser})

  if (existedUser) {
      throw new ApiError(409, "User with email or username already exists")
  }
  //console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path
  }
  

  if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!avatar) {
      throw new ApiError(400, "Avatar file is required")
  }
 

  const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email, 
      password,
      username: username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
  )

  if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res.status(201).json(
      new ApiResponse(200, createdUser, "User registered Successfully")
  )

} )

const loginUser=asyncHandler(async(req,res)=>{
//req body => data

const {email,username,password}=req.body
if(!username || !email){
    console.log({username,email})
    throw new ApiError(400, "username or email is required")
}

const user=await User.findOne({
    $or: [{username},{email}]
})

if (!user){
    throw new ApiError(404,"user does not exist")
}

const isPasswordValid=await user.isPasswordCorrect(password)
if(!isPasswordValid)
{
    throw new ApiError(401,"invalid user cradentials")
}

const {accessToken,refreshToken} =await generateAccessAndRefereshToken(user._id)

const loggedInUser= await User.findById(user._id).
select("-password-refreshtoken")

const options={
    httOnly:true,
    secure:true
}

return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken", refreshToken,options)
.json((
    new ApiResponse(200,
        {
            user:loggedInUser,accessToken,refreshToken
        },
        "user logged in successfully")
))

})

const logoutUser= asyncHandler(async(req,res)=>{

   await User.findByIdAndUpdate(
        req.user._id,{
            $set:{
                refreshToken:undefined
            }

        },
        {
            new:true
        }
    
    )
    const options={
        httOnly:true,
        secure:true
    }
    return res.status(200)
    .cookie("accessToken","",options)
    .cookie("refreshToken","",options)
    .json(new ApiResponse(200,{},"user logged out"))

})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.
    refreshToken|| req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"unathorized request")
    }

    try {
        const decodedToken =jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRTET
        )
    
        const user= await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"invalid refresh token")
        }
        if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401,"refresh token is expired or used")
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
        const {accessToken,newRefreshToken}=await generateAccessAndRefereshToken(user._id)
    
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new response(200,
                {accessToken,refreshToken:
                    newRefreshToken},
                "access Token  refreshed"
                )
        )
    } catch (error) {
        throw new ApiError(401,error?.message||
            "invalid refresh token")
        
    }

})

const changeCurrentPassword= asyncHandler(async(rew,res)=>{
    const {oldPassword,newPassword}= req.body

    const user= await User.findById(req.user?._id)
    const isPasswordCorrect= await user.
    isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"invalid old password")
    }
    user.password=newPassword
    user.save({validationBefoeSave:false})

    return res.
    status(200)
    .json(new ApiResponse(200,{},"password change succeccfuly"))
})

const getCurrentUser= asyncHandler(async(req,res)=>{
    return res.
    status(200)
    .json(200,req.user,"current user fetched successfully")
})

const updateAcountDetails= asyncHandler(async(req,res)=>{
    const {fullName,email}= req.body

    if(! fullName ||!email){
        throw new ApiError(400,"All fields are required")
    }

    const user= User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                fullName,
                email: email
            }
        },
        {
            new:true
        }).select("-password")

        return res
        .status(200)
        .json(200,user,"account details updated successfuly")
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.files?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar files is missing")
    }

     const avatar =await uploadOnCloudinary(avatarLocalPath)

     if(!avatar.url){
        throw new ApiError(400,"error while uploading on avatar")
     }

     const user=await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }

        },
        
        {new:true}
         ).select("-password")
         return res
         .status(200)
         .json(
            new ApiResponse(200,user,"avatar Image updated successfully")
         )
         
         

})


const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath =req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"cover image  file is missing")
    }

     const coverImage =await uploadOnCloudinary(coverImageLocalPath)

     if(!coverImage.url){
        throw new ApiError(400,"error while uploading on avatar")
     }

      const user=await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }

        },
        
        {new:true}
         ).select("-password")

         return res
         .status(200)
         .json(
            new ApiResponse(200,user,"coverImage updated successfully")
         )
         

})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAcountDetails,
    updateUserAvatar,
    updateUserCoverImage
         
}