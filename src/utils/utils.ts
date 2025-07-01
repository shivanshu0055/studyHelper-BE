// utils/extractText.ts
import pdfParse from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ai } from "../controllers/user.controller";
import { index, ns } from "../pinecone/pinecone";
import { ContentEmbedding } from "@google/genai";

export const extractTextFromPDF = async (buffer: Buffer): Promise<string> => {
  const data = await pdfParse(buffer);
  return data.text;
};

export const createChunks = async (text:string) =>{

  const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 100,
  // separators: ["\n\n", "\n", ".", "!", "?"," "],
  });

  const documents = await splitter.createDocuments([text]);
  const chunks=documents.map((doc) => doc.pageContent)
  // console.log(chunks);
  return chunks

}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getEmbeddingsWithRetry(batch: string[],noteID:string, maxRetries = 5) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const response = await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: batch,
        config: {
          taskType: "RETRIEVAL_DOCUMENT"
        }
      });
      
      const embeddingsWithMetadata=[]

      if(response.embeddings){
        for(let i=0;i<batch.length;i++){
            embeddingsWithMetadata.push({
                "noteID":noteID,
                "title":batch[i],
                "embeddings":response.embeddings[i].values
            })
        }
        }

        return embeddingsWithMetadata

    } catch (error: any) {
      if (error.status === 429) { 
        attempt++;
        if (attempt >= maxRetries) {
          console.error("Max retries reached. Failing the process.");
          throw error;
        }
        const delayTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000; 
        console.warn(`Rate limit hit. Retrying attempt ${attempt} in ${delayTime.toFixed(2)}ms...`);
        await delay(delayTime);
      } else {

        console.error("An unrecoverable error occurred during embedding:", error);
        throw error;

      }
    }
  }
  throw new Error("Failed to get embeddings after multiple retries.");
}


export const createEmbeddings = async (text:string,noteID:string) => {
  try {

    const chunks = await createChunks(text);
    // console.log(`Created ${chunks.length} chunks.`);

    const BATCH_SIZE = 100; 
    const allEmbeddings = [];

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      // console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(chunks.length / BATCH_SIZE)}...`);
      
      const batchEmbeddings = await getEmbeddingsWithRetry(batch,noteID);

      allEmbeddings.push(...batchEmbeddings);
      
      if (i + BATCH_SIZE < chunks.length) {
          await delay(200); 
      }
    }

    // console.log("Successfully created all embeddings.",allEmbeddings);

    return allEmbeddings

  } catch (error: any) {
    console.error("Failed to process embeddings:", error.message);
    return null
  }
};


export const findSimilarVectors=async (query:string) => {
  // console.log("Hello");
  
  const response=await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: [query],
        config: {
          taskType: "RETRIEVAL_QUERY"
        }
      });
    // console.log(response.embeddings);
      console.log(response.embeddings);
      
    // console.log(response.embeddings);
    if(!response.embeddings) return

    
    const queryEmbedding: ContentEmbedding[] = response.embeddings;

    // Extract the numeric values from the first embedding
    const vector: number[] = queryEmbedding[0]?.values ?? [];
    

    const queryResponse = await index.query({
      vector: vector,
      topK: 7,
      includeMetadata: true,
    });

    console.log(queryResponse);
    

    // console.log(queryResponse.matches);
    
    // console.log(queryResponse.matches[0].metadata.title);

    let context=""
    queryResponse.matches.forEach((chunk)=>{
      // @ts-ignore
      context+=`${chunk.metadata.title} `
    })

    // console.log(context);
    // console.log("************************** ***************************** ****************************** ***************************");
    
    //@ts-ignore
    return context
}