import { Pinecone } from "@pinecone-database/pinecone";

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY as string,
});

export const pineconeIndexName = 'study-helper';

export const index=pinecone.Index(pineconeIndexName)

export const ns=index.namespace('__default__')
