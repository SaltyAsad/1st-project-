import { apierror } from "../utils/apierror.js"
import { asynchandler } from "../utils/asynchandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
import { urlencoded } from "express"

export const verifyJWT =asynchandler(async(req,_,next) => {
    try {
        const token = req.cookies?.accesstoken || req.header("Authorization")?.replace("Bearer ","" )
    
        if (!token) {
            throw new apierror(401,"Unauthorized Request")
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshtoken")
    
        if (!user) {
            throw new apierror(401,"Invalid Access Token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new apierror(401,error?.message || "Invalid Access Token")
    }

})
