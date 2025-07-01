"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userMiddleware = (req, res, next) => {
    try {
        const header = req.headers['authorization'];
        //  console.log(header);
        const token = header.split(' ')[1];
        const verifiedPayload = jsonwebtoken_1.default.verify(token, process.env.JWT_TOKEN);
        if (!verifiedPayload) {
            res.json({
                "message": "Token verification failed"
            });
        }
        req.userID = verifiedPayload.userID;
        next();
    }
    catch (error) {
        console.log(error);
    }
};
exports.userMiddleware = userMiddleware;
