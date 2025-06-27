import { z } from "zod";

export const userSchema=z.object({
    username:z.string().min(5).max(20),
    password:z.string().min(3).max(10)
})

export const noteSchema=z.object({
    title:z.string(),
    content:z.string(),
    subject:z.string(),
    color:z.string(),
    contentJSON:z.any()
})

export type userType=z.infer<typeof userSchema>
export type noteType=z.infer<typeof noteSchema>