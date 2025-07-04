"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSimilarVectors = exports.createEmbeddings = exports.createChunks = exports.extractTextFromPDF = void 0;
// utils/extractText.ts
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const text_splitter_1 = require("langchain/text_splitter");
const user_controller_1 = require("../controllers/user.controller");
const pinecone_1 = require("../pinecone/pinecone");
const extractTextFromPDF = (buffer) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield (0, pdf_parse_1.default)(buffer);
    return data.text;
});
exports.extractTextFromPDF = extractTextFromPDF;
const createChunks = (text) => __awaiter(void 0, void 0, void 0, function* () {
    const splitter = new text_splitter_1.RecursiveCharacterTextSplitter({
        chunkSize: 800,
        chunkOverlap: 100,
        // separators: ["\n\n", "\n", ".", "!", "?"," "],
    });
    const documents = yield splitter.createDocuments([text]);
    const chunks = documents.map((doc) => doc.pageContent);
    // console.log(chunks);
    return chunks;
});
exports.createChunks = createChunks;
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function getEmbeddingsWithRetry(batch_1, noteID_1) {
    return __awaiter(this, arguments, void 0, function* (batch, noteID, maxRetries = 5) {
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                const response = yield user_controller_1.ai.models.embedContent({
                    model: 'text-embedding-004',
                    contents: batch,
                    config: {
                        taskType: "RETRIEVAL_DOCUMENT"
                    }
                });
                const embeddingsWithMetadata = [];
                if (response.embeddings) {
                    for (let i = 0; i < batch.length; i++) {
                        embeddingsWithMetadata.push({
                            "noteID": noteID,
                            "title": batch[i],
                            "embeddings": response.embeddings[i].values
                        });
                    }
                }
                return embeddingsWithMetadata;
            }
            catch (error) {
                if (error.status === 429) {
                    attempt++;
                    if (attempt >= maxRetries) {
                        console.error("Max retries reached. Failing the process.");
                        throw error;
                    }
                    const delayTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                    console.warn(`Rate limit hit. Retrying attempt ${attempt} in ${delayTime.toFixed(2)}ms...`);
                    yield delay(delayTime);
                }
                else {
                    console.error("An unrecoverable error occurred during embedding:", error);
                    throw error;
                }
            }
        }
        throw new Error("Failed to get embeddings after multiple retries.");
    });
}
const createEmbeddings = (text, noteID) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chunks = yield (0, exports.createChunks)(text);
        // console.log(`Created ${chunks.length} chunks.`);
        const BATCH_SIZE = 100;
        const allEmbeddings = [];
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);
            // console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(chunks.length / BATCH_SIZE)}...`);
            const batchEmbeddings = yield getEmbeddingsWithRetry(batch, noteID);
            allEmbeddings.push(...batchEmbeddings);
            if (i + BATCH_SIZE < chunks.length) {
                yield delay(200);
            }
        }
        // console.log("Successfully created all embeddings.",allEmbeddings);
        return allEmbeddings;
    }
    catch (error) {
        console.error("Failed to process embeddings:", error.message);
        return null;
    }
});
exports.createEmbeddings = createEmbeddings;
const findSimilarVectors = (query) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log("Hello");
    var _a, _b;
    const response = yield user_controller_1.ai.models.embedContent({
        model: 'text-embedding-004',
        contents: [query],
        config: {
            taskType: "RETRIEVAL_QUERY"
        }
    });
    // console.log(response.embeddings);
    // console.log(response.embeddings);
    // console.log(response.embeddings);
    if (!response.embeddings)
        return;
    const queryEmbedding = response.embeddings;
    // Extract the numeric values from the first embedding
    const vector = (_b = (_a = queryEmbedding[0]) === null || _a === void 0 ? void 0 : _a.values) !== null && _b !== void 0 ? _b : [];
    const queryResponse = yield pinecone_1.index.query({
        vector: vector,
        topK: 1,
        includeMetadata: true,
    });
    // console.log(queryResponse);
    // console.log(queryResponse.matches);
    // console.log(queryResponse.matches[0].metadata.title);
    let context = "";
    queryResponse.matches.forEach((chunk) => {
        // if(chunk)
        // @ts-ignore
        if (chunk.score > 0.6)
            // @ts-ignore
            context += `${chunk.metadata.title} `;
    });
    // console.log(context);
    // console.log("************************** ***************************** ****************************** ***************************");
    //@ts-ignore
    return context;
});
exports.findSimilarVectors = findSimilarVectors;
