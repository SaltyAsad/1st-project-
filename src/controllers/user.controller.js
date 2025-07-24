import { asynchandler } from "../utils/asynchandler.js"
import { apierror } from "../utils/apierror.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {apiresponse} from "../utils/apiresponse.js"
import { json } from "express";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async(userid) => {
    try {
        const user = await User.findById(userid)
        const accesstoken = user.generateAccessToken()
        const refreshtoken = user.generateRefToken()

        user.refreshtoken=refreshtoken
        await user.save({ validateBeforeSave: false })

        return {accesstoken,refreshtoken}

    } catch (error) {
        throw new apierror(500,"something went wrong while generating access and refresh tokens")
    }
}
 
const registerUser = asynchandler( async (req,res) => {
    
    const {fullname, email,username, password} = req.body
    console.log("email: ",email);

    if (
        [fullname, email,username, password].some((field) => field?.trim()==="" )
    ) {
        throw new apierror(400,"All fields are required")
    }
    
    const existedUser = await User.findOne({
        $or:[{ username },{ email }]
    })

    if (existedUser) {
        throw new apierror(409,"User already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverLocalPath = req.files?.coverImage[0]?.path;

    let coverLocalPath;
    if (req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0) {
        coverLocalPath = req.files.coverimage[0].path
    }

    if (!avatarLocalPath) {
        throw new apierror(400,"Avatar is required")
    } 

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverimage = await uploadOnCloudinary(coverLocalPath)

    if (!avatar) {
        throw new apierror(400,"Avatar is required")
    } 

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverimage: coverimage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser =await User.findById(user._id).select(
        "-password -refreshtoken"
    )

    if (!createdUser) {
      throw new apierror(500,"Something went wrong while creating the User")

    }

    return res.status(201).json(
        new apiresponse(200, createdUser,"User Registered Successfully")
    )

})

const loginUser = asynchandler(async (req,res) => {
    const {email,username,password} = req.body
    if (!(username || email)) {
        throw new apierror(400,"username or email is required")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if (!user) {
        throw new apierror(404,"User does not exist")
    }

    const ispassswordvalid = await user.ispasswordcorrect(password)

    if (!ispassswordvalid) {
        throw new apierror(401,"Invalid Password")
    }

    const {accesstoken,refreshtoken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshtoken")

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accesstoken",accesstoken,options)
    .cookie("refreshtoken",refreshtoken,options)
    .json(
        new apiresponse(
            200,
            {
                user: loggedInUser,
                accesstoken,
                refreshtoken
            },
            "User Logged In Successfully"
        )   
    )  
})

const logOutUser = asynchandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshtoken: 1
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
    .clearCookie("accesstoken",options)
    .cookie("refreshtoken",options)
    .json(new apiresponse(200,{},"User Logged Out Successfully"))
})

const refreshAccessToken = asynchandler(async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshtoken || req.body.refreshtoken

    if (!incomingRefreshToken) {
        throw new apierror(401,"unauthorized Request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new apierror(401,"invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshtoken) {
            throw new apierror(401,"refresh token is expired")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accesstoken,newrefreshtoken} = await generateAccessAndRefreshTokens(user._id)
        return res
        .status(200)
        .Cookie("accesstoken",accesstoken,options)
        .cookie("refreshtoken",newrefreshtoken,options)
        .json(new apiresponse(200,{accesstoken,refreshtoken: newrefreshtoken},"Access Token Refreshed"))
    } catch (error) {
        throw new apierror(401,error?.message ||" invalid refresh token ")
    }

})

const changeCurrentPassword = asynchandler(async(req,res) => {
    const {oldPass,newPass} = req.body

    const user = await User.findById(req.user?._id)
    const isPassCorrect = await user.ispasswordcorrect(oldPass)

    if(!isPassCorrect){
        throw new apierror(400,"invalid password")
    }

    user.password = newPass
    await user.save({validateBeforeSave: false})

    return res
        .status(200)
        .json(new apiresponse(200,{},"Password Changed Successfully"))
})

const getCurrentUser = asynchandler(async(req,res) => {
    return res
        .status(200)
        .json(new apiresponse(200,req.user,"Current User Fetched Successfully"))
})

const updateAccDetails = asynchandler(async(req,res) =>{
    const {fullname,email} =req.body

    if (!(fullname || email)) {
        throw new apierror(400,"all fields are required")
    }
    
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                fullname,
                email: email
            }
        },
        {new: true}
    ).select("-password")

    return res
        .status(200)
        .json(new apiresponse(200,user,"Account Details Updated Successfully"))

})

const updateUserAvatar = asynchandler(async(req,res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new apierror(400,"Avatar File Is Missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    
    if (!avatar.url) {
        new apierror(400,"Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")
    
    return res
        .status(200)
        .json(new apiresponse(200,user,"Avatar Image Updated Successfully"))
})

const updateUserCoverimage = asynchandler(async(req,res) => {
    const coverLocalPath = req.file?.path
    if (!coverLocalPath) {
        throw new apierror(400,"Cover File Is Missing")
    }

    const coverimage = await uploadOnCloudinary(coverLocalPath)
    
    if (!coverimage.url) {
        new apierror(400,"Error while uploading on coverimage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverimage: coverimage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
        .status(200)
        .json(new apiresponse(200,user,"Cover Image Updated Successfully"))
})

const getUserChannelProfile = asynchandler(async(req,res) =>{
    const {username} = req.params

    if (!username?.trim) {
        throw new apierror(400,"username is missing")
    }

    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscibersCount:{
                    $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond:{
                        if: {$in: [req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullname: 1,
                username: 1,
                subscibersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar:1,
                coverimage:1,
                email: 1,
            }
        }
    ])

    if (!channel?.length) {
        throw new apierror(404,"channel does not exists")
    }
    return res
        .status(200)
        .json(new apiresponse(200,channel[0],"User channel fetched Successfully"))
})

const getWatchHistory = asynchandler(async(req,res) =>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "Video",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname: 1,
                                        username: 1,
                                        avatar:1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]    

            }
        }
    ])
    return res
        .status(200)
        .json(new apiresponse(200,user[0].watchHistory,"Watch History fetched Successfully"))
})

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAvatar,
    updateAccDetails,
    updateUserCoverimage,
    getUserChannelProfile,
    getWatchHistory
}