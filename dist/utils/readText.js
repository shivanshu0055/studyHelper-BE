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
exports.createChunks = exports.extractTextFromPDF = void 0;
// utils/extractText.ts
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const text_splitter_1 = require("langchain/text_splitter");
const extractTextFromPDF = (buffer) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield (0, pdf_parse_1.default)(buffer);
    return data.text;
});
exports.extractTextFromPDF = extractTextFromPDF;
const createChunks = (text) => __awaiter(void 0, void 0, void 0, function* () {
    const splitter = new text_splitter_1.RecursiveCharacterTextSplitter({
        chunkSize: 800,
        chunkOverlap: 100,
        separators: ["\n\n", "\n", ".", "!", "?", " "],
    });
    const documents = yield splitter.createDocuments([text]);
    const chunks = documents.map((doc) => doc.pageContent);
    // console.log(chunks);
    return chunks;
});
exports.createChunks = createChunks;
