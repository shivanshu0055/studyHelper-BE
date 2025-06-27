import express from 'express'
import cors from 'cors'
import {authRouter} from './routes/auth.routes'
import { userRouter } from './routes/user.routes'

declare global {
  namespace Express {
    interface Request {
      userID?:string
    }
  }
}

const app=express()

app.use(express.json())
app.use(cors())
app.use('/api/v1/auth',authRouter)
app.use('/api/v1/user',userRouter)
export default app