import { Request, Response } from "express";
import jwt from 'jsonwebtoken'

import { userSchema } from "../types";
import userModel from "../models/User";

export const signup = async (req:Request,res:Response) => {
    try{
        const userBody=req.body
        const zodVerifiedUser=userSchema.safeParse(userBody)

        if(!zodVerifiedUser.success)
            return res.status(400).json({
                "message":"Zod verification failed"
            })

        const userInDB=await userModel.findOne({
            username:userBody.username
        })

        if(userInDB) 
            return res.status(409).json({
                "message":"User already exists"
            })

        const newUser=await userModel.create({
            username:userBody.username,
            password:userBody.password
        })

        return res.json({
            "user":newUser
        })
    }
    catch(e){
        return res.json({
            "message":e
        })
    }
}


export const signin = async (req:Request,res:Response) => {
    try{
        const userBody=req.body
        const zodVerifiedUser=userSchema.safeParse(userBody)

        if(!zodVerifiedUser.success)
            return res.status(400).json({
                "message":"Zod verification failed"
            })

                
        const userInDB=await userModel.findOne({
            username:userBody.username,
            password:userBody.password
        })

        if(!userInDB) 
            return res.status(401).json({
                "message":"Credentials wrong"
            })
        
        const token=jwt.sign({
            userID:userInDB._id
        },process.env.JWT_TOKEN as string)
        
        res.json({
            "message":"Signed in successfully",
            "token":token,
            "userID":userInDB._id
        })
    }
    catch(e){
        return res.json({
            "message":e
        })
    }

}

