import { Router } from "express";
import { 
    changeCurrentPassword,
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistory, 
    loginUser, 
    logOutUser,
    refreshAccessToken, 
    registerUser, 
    updateAccDetails, 
    updateUserAvatar,
    updateUserCoverimage
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverimage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT,logOutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT,changeCurrentPassword)

router.route("/current_user").get(verifyJWT,getCurrentUser)

router.route("/update-account").patch(verifyJWT,updateAccDetails)

router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)

router.route("/cover-image").patch(verifyJWT,upload.single("coverimage"),updateUserCoverimage)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)

router.route("/history").get(verifyJWT,getWatchHistory)

export default router