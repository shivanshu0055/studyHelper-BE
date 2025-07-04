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
exports.searchNotes = exports.getContextFromSimilarEmbeddings = exports.getPlainResponse = exports.getResponseWithContext = exports.readPDF = exports.deleteNote = exports.editNote = exports.getNote = exports.getNotesByMonth = exports.getNotes = exports.createNote = exports.ai = void 0;
const types_1 = require("../types");
const Note_1 = __importDefault(require("../models/Note"));
const utils_1 = require("../utils/utils");
const uuid_1 = require("uuid");
const genai_1 = require("@google/genai");
const pinecone_1 = require("../pinecone/pinecone");
exports.ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const createNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const noteBody = req.body;
    const userID = req.userID;
    // console.log(req.body);
    const zodVerifiedNote = types_1.noteSchema.safeParse(noteBody);
    if (!zodVerifiedNote.success) {
        return res.status(400).json({
            "message": "Zod verification failed"
        });
    }
    const newNote = yield Note_1.default.create({
        title: noteBody.title,
        content: noteBody.content,
        userID: userID,
        color: noteBody.color,
        contentJSON: noteBody.contentJSON,
        subject: noteBody.subject,
        fav: noteBody.fav
    });
    const noteID = newNote._id.toString();
    const embeddings = yield (0, utils_1.createEmbeddings)(noteBody.content, noteID);
    // ({
    //     "noteID":noteID,
    //     "title":batch[i],
    //     "embeddings":response.embeddings[i].values
    // })
    // console.log(embeddings);
    //@ts-ignore
    const vectorData = embeddings === null || embeddings === void 0 ? void 0 : embeddings.map((embed) => ({
        id: (0, uuid_1.v4)(),
        values: embed.embeddings,
        metadata: {
            noteID: embed.noteID,
            title: embed.title
        }
    }));
    yield pinecone_1.index.upsert(vectorData);
    // const ns=index.namespace('__default__')
    // await ns.upsert(vectorData)
    return res.json({
        "note": newNote
    });
});
exports.createNote = createNote;
const getNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userID = req.userID;
    const notes = yield Note_1.default.find({
        userID: userID
    });
    return res.json({
        "notes": notes
    });
});
exports.getNotes = getNotes;
const getNotesByMonth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { month } = req.query;
        if (!month)
            return res.status(400).json({ error: 'Month is required' });
        // console.log(month);
        const startDate = new Date(`${month}-01T00:00:00.000Z`);
        const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));
        // console.log(typeof startDate);
        // console.log(endDate);
        // console.log(req.userID);
        const notes = yield Note_1.default.find({
            createdAt: { $gte: startDate, $lt: endDate },
            userID: req.userID // or however you track the user
        });
        res.status(200).json({
            "notes": notes
        });
        // console.log(notes);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.getNotesByMonth = getNotesByMonth;
const getNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const noteID = req.body.noteID;
    const note = yield Note_1.default.findById(noteID);
    return res.json({
        "note": note
    });
});
exports.getNote = getNote;
const editNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const noteBody = req.body;
    // console.log(noteBody);
    const userID = req.userID;
    const note = yield Note_1.default.findOne({
        _id: noteBody.noteID,
        userID: userID
    });
    // console.log(note)
    if (!note) {
        return res.json({
            "message": "The note doesn't exists"
        });
    }
    if (noteBody.title)
        note.title = noteBody.title;
    if (noteBody.content)
        note.content = noteBody.content;
    if (noteBody.color)
        note.color = noteBody.color;
    if (noteBody.contentJSON)
        note.contentJSON = noteBody.contentJSON;
    if (noteBody.fav !== undefined)
        note.fav = noteBody.fav;
    yield note.save();
    yield pinecone_1.ns.deleteMany({
        noteID: { $eq: note._id },
    });
    const noteID = note._id.toString();
    const embeddings = yield (0, utils_1.createEmbeddings)(note.content, noteID);
    //@ts-ignore
    const vectorData = embeddings === null || embeddings === void 0 ? void 0 : embeddings.map((embed) => ({
        id: (0, uuid_1.v4)(),
        values: embed.embeddings,
        metadata: {
            noteID: embed.noteID,
            title: embed.title
        }
    }));
    yield pinecone_1.index.upsert(vectorData);
    return res.json({
        "note": note
    });
});
exports.editNote = editNote;
const deleteNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const noteBody = req.body;
    const userID = req.userID;
    const note = yield Note_1.default.findOne({
        _id: noteBody.noteID,
        userID: userID
    });
    if (!note) {
        return res.json({
            "message": "The note doesn't exists"
        });
    }
    const noteID = noteBody.noteID;
    yield note.deleteOne();
    // const ns = index.namespace('__default__')
    yield pinecone_1.ns.deleteMany({
        noteID: { $eq: noteID },
    });
    res.json({
        "message": "Note has been deleted"
    });
});
exports.deleteNote = deleteNote;
const readPDF = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = req.file;
    if (!file)
        return res.status(400).json({ message: "No file uploaded" });
    const text = yield (0, utils_1.extractTextFromPDF)(file.buffer);
    return res.json({
        "content": text
    });
});
exports.readPDF = readPDF;
// Direct questions
const getResponseWithContext = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const query = req.body.query;
    // const context=await findSimilarVectors(query)
    const context = req.body.context;
    const response = yield exports.ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: "Please give extensive answer to this prompt : " + query + context,
    });
    // if(!response.candidates) return 
    res.json({
        //@ts-ignore
        "response": (_a = response.candidates[0].content) === null || _a === void 0 ? void 0 : _a.parts[0].text
        // "response":response.candidates
    });
});
exports.getResponseWithContext = getResponseWithContext;
const getPlainResponse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const query = req.body.query;
    const response = yield exports.ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: query
    });
    res.json({
        //@ts-ignore
        "response": (_a = response.candidates[0].content) === null || _a === void 0 ? void 0 : _a.parts[0].text
    });
});
exports.getPlainResponse = getPlainResponse;
const getContextFromSimilarEmbeddings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.body.query;
    // console.log(query);
    if (typeof query != "string")
        return null;
    const context = yield (0, utils_1.findSimilarVectors)(query);
    // console.log(context);
    // console.log();
    res.json({
        "Context": context
    });
});
exports.getContextFromSimilarEmbeddings = getContextFromSimilarEmbeddings;
const searchNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const chat = exports.ai.chats.create({
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
    const response1 = yield chat.sendMessage({
        message: "I have 2 dogs in my house.",
    });
    console.log("Chat response 1:", response1.text);
    const response2 = yield chat.sendMessage({
        message: "How many paws are in my house?",
    });
    console.log("Chat response 2:", response2.text);
});
exports.searchNotes = searchNotes;
