import { Router } from 'express';
import { asyncHandler } from '../asyncHandlers';
import { createNote, deleteNote, editNote, getContextFromSimilarEmbeddings, getNote, getNotes, getPlainResponse, getResponseWithContext, readPDF, searchNotes } from '../controllers/user.controller';
import { userMiddleware } from '../middlewares/auth';
import { upload } from '../middlewares/multer';

export const userRouter=Router()

userRouter.post("/createNote",userMiddleware,asyncHandler(createNote));
userRouter.get("/getNotes",userMiddleware,asyncHandler(getNotes));
userRouter.post("/getNote",userMiddleware,asyncHandler(getNote));
userRouter.post("/editNote",userMiddleware,asyncHandler(editNote));
userRouter.post("/deleteNote",userMiddleware,asyncHandler(deleteNote));
userRouter.post("/readPDF",userMiddleware,upload.single("pdf"),asyncHandler(readPDF));
userRouter.post("/getContextFromSimilarEmbeddings",userMiddleware,asyncHandler(getContextFromSimilarEmbeddings))
userRouter.post("/getPlainResponse",userMiddleware,asyncHandler(getPlainResponse))
userRouter.post("/getResponseWithContext",userMiddleware,asyncHandler(getResponseWithContext))
userRouter.post('/searchNotes',userMiddleware,asyncHandler(searchNotes))