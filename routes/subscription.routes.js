import { Router } from "express";
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT);

router
    .route("/c/:subscriberId")
    .get(getSubscribedChannels)
    .post(toggleSubscription);

router.route("/u/:channelId").get(getUserChannelSubscribers);

export default router