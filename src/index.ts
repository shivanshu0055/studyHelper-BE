import dotenv from 'dotenv'
dotenv.config()

import app from "./app"; 
import mongoose from "mongoose";


async function connectDB(){
    await mongoose.connect(process.env.MONGO_URL as string)
    app.listen(process.env.PORT,()=>{
        console.log("Server running on port",process.env.PORT)
    })
}

connectDB()