import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken'

export const userMiddleware=(req:Request,res:Response,next:NextFunction)=>{
    try{
    const header=req.headers['authorization'] as string
    //  console.log(header);
     
    const token=header.split(' ')[1]
    const verifiedPayload=jwt.verify(token,process.env.JWT_TOKEN as string)

    if(!verifiedPayload){
        res.json({
            "message":"Token verification failed"
        })
    } 

    req.userID=(verifiedPayload as JwtPayload).userID 
    next()
    }
    catch(error){
        console.log(error)
    }
}