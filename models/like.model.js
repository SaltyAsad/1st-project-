import mongoose,{Schema} from "mongoose";

const likeSchema =new Schema(
    {
        Video:{
            type: Schema.Types.ObjectId,
            ref: "Video",
        },
        comment:{
            type: Schema.Types.ObjectId,
            ref: "Comment",
        },
        tweet:{
            type: Schema.Types.ObjectId,
            ref: "Tweet",
        },
        likedby:{
            type: Schema.Types.ObjectId,
            ref: "User",
        },

    },{timestamps: true}
)

likeSchema.plugin(mongooseAggregatePaginate)

export const Like = mongoose.model("Like",likeSchema)