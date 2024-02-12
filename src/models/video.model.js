import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoschema = new Schema (

{
    videoFile:{
        type:String, //cloudinry url
        required:true
    },

    thumbnails:{
        type:String, //cloudinry url
        required:true
    },

    title:{
        type:String, 
        required:true
    },

    discription:{
        type:String,
        required:true
    },
    duration:{
        type:Number,
        required:true

    },

    views:{
        type:Number,
        default:0
    },

    isPublished:{
        type:Boolean,
        default:true
    },

    owner:{
        type:Schema.types.objectId,
        ref:"User"

    }


},
{
    timestamps:true
}


)

videoschema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("video",videoschema)
