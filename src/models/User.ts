import mongoose, { model, Schema } from "mongoose";

const userSchema=new Schema({
    username:{type:String,required:true},
    password:{type:String,required:true}
})

const userModel=model('User',userSchema)

export default userModel