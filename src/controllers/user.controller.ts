import { Request, Response } from "express";
import { noteSchema } from "../types";
import noteModel from "../models/Note";
import { createChunks, createEmbeddings, extractTextFromPDF, findSimilarVectors } from "../utils/utils";
import { v4 as uuidv4 } from 'uuid';
import { PineconeRecord } from "@pinecone-database/pinecone";
import { ContentEmbedding, GoogleGenAI } from "@google/genai";
import { index, ns } from "../pinecone/pinecone";
import userModel from "../models/User";

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const createNote=async (req:Request,res:Response)=>{
    const noteBody=req.body
    const userID=req.userID

    const zodVerifiedNote=noteSchema.safeParse(noteBody)

    if(!zodVerifiedNote.success){
        return res.status(400).json({
                "message":"Zod verification failed"
            })
    }

    const newNote=await noteModel.create({
        title:noteBody.title,
        content:noteBody.content,
        userID:userID,
        color:noteBody.color,
        contentJSON:noteBody.contentJSON,
        subject:noteBody.subject
    })

    const noteID=newNote._id.toString()

    const embeddings=await createEmbeddings(noteBody.content,noteID)

        // ({
        //     "noteID":noteID,
        //     "title":batch[i],
        //     "embeddings":response.embeddings[i].values
        // })

      // console.log(embeddings);
      
    //@ts-ignore
    const vectorData:PineconeRecord[]=embeddings?.map((embed)=>({
      id:uuidv4(),
      values:embed.embeddings,
      metadata:{
          noteID:embed.noteID,
          title:embed.title
      }
    }))
    // await index.upsert(vectorData)

    const ns=index.namespace('__default__')
    await ns.upsert(vectorData)
    
    return res.json({
        "note":newNote
    })
} 

export const getNotes=async (req:Request,res:Response)=>{
  const userID=req.userID
  const notes=await noteModel.find({
    userID:userID
  })
  return res.json({
    "notes":notes
  })
  }


  
export const getNote=async (req:Request,res:Response)=>{
  
  const noteID=req.body.noteID
  const note=await noteModel.findById(noteID)
  return res.json({
    "note":note
  })
  }


export const editNote=async (req:Request,res:Response) => {
  
    const noteBody=req.body
    const userID=req.userID

    const note=await noteModel.findOne({
        _id:noteBody.noteID,
        userID:userID
    })

    if(!note){
        return res.json({
            "message":"The note doesn't exists"
        })
    }

    if(noteBody.title) note.title=noteBody.title
    if(noteBody.content) note.content=noteBody.content
    if(noteBody.color) note.color=noteBody.color
    if(noteBody.contentJSON) note.contentJSON=noteBody.contentJSON

    await note.save()

    return res.json({
        "note":note
    })
}

export const deleteNote=async (req:Request,res:Response) => {
    const noteBody=req.body
    const userID=req.userID

    const note=await noteModel.findOne({
        _id:noteBody.noteID,
        userID:userID
    })
    
    if(!note){
        return res.json({
            "message":"The note doesn't exists"
        })
    }

    const noteID=noteBody.noteID
    await note.deleteOne()
    console.log(noteID);
    
    const ns = index.namespace('__default__')

    await ns.deleteMany({
      noteID: { $eq: noteID },
    })

    res.json({
        "message":"Note has been deleted"
    })

}

export const readPDF=async (req:Request,res:Response) =>{
    const file=req.file
    
    if (!file) return res.status(400).json({ message: "No file uploaded" });
    const text = await extractTextFromPDF(file.buffer);

    return res.json({
        "content":text
    })
}


// Direct questions

export const getResponseWithContext= async (req:Request,res:Response) =>{

        const query=req.body.query
        // const context=await findSimilarVectors(query)
        const context=req.body.context

        const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: query+" Answer according to the following context "+context,
        });

        // if(!response.candidates) return 

        res.json({
          //@ts-ignore
            "response":response.candidates[0].content?.parts[0].text
            // "response":response.candidates
        })   
}

export const getPlainResponse=async (req:Request,res:Response) =>{

        const query=req.body.query
        // console.log(query);
        
        // const context=await findSimilarVectors(query)
        // const context=req.body.context
        const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: query
        });

        // if(!response.candidates) return 

        res.json({
          //@ts-ignore
            "response":response.candidates[0].content?.parts[0].text
        })   
}

export const getContextFromSimilarEmbeddings=async (req:Request,res:Response)=>{
    const query=req.body.query
    // console.log(query);
    
    if(typeof query!="string") return null 

    const context=await findSimilarVectors(query)
    console.log(context);
    
    res.json({
        "Context":context
    })
}

export const searchNotes=async (req:Request,res:Response)=>{
    const chat = ai.chats.create({
    model: "gemini-2.0-flash-lite",
    history: [
      {
        role: "user",
        parts: [{ text: "Hello" }],
      },
      {
        role: "model",
        parts: [{ text: "Great to meet you. What would you like to know?" }],
      },
    ],
  });

  const response1 = await chat.sendMessage({
    message: "I have 2 dogs in my house.",
  });
  console.log("Chat response 1:", response1.text);

  const response2 = await chat.sendMessage({
    message: "How many paws are in my house?",
  });
  console.log("Chat response 2:", response2.text);
}

