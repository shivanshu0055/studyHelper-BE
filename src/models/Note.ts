import mongoose, { model } from 'mongoose'
import { Schema } from 'mongoose'

const noteSchema=new Schema(
    {
    title:{type:String},
    content:{type:String,required:true},
    contentJSON:{type:Object,required:true},
    userID:{type:mongoose.Schema.ObjectId,ref:'User'},
    subject:{type:String,required:true},
    color:{type:String,enum:["green","blue","orange","green","yellow","purple"]}
},
{
    timestamps:true
})

const noteModel=model('Note',noteSchema)

export default noteModel

