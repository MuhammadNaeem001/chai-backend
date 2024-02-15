import mongoose,{Schema} from "mongoose";


const subscriptonsSchema=new Schema({

    subscriber:{
        typeof:Schema.types.objectId, //one who is subscribing
        ref:"User"
    },

    channel:{
        typeof:Schema.types.objectId, //one whom subscriber is subscribing
        ref:"User"
    }
},{timestamps:true})


export const Subscription= mongoose.model("Subscription",subscriptonsSchema)