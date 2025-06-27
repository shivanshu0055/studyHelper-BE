"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ns = exports.index = exports.pineconeIndexName = exports.pinecone = void 0;
const pinecone_1 = require("@pinecone-database/pinecone");
exports.pinecone = new pinecone_1.Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});
exports.pineconeIndexName = 'study-helper';
exports.index = exports.pinecone.Index(exports.pineconeIndexName);
exports.ns = exports.index.namespace('__default__');
