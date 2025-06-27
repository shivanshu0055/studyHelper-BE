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
exports.signin = exports.signup = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const types_1 = require("../types");
const User_1 = __importDefault(require("../models/User"));
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userBody = req.body;
        const zodVerifiedUser = types_1.userSchema.safeParse(userBody);
        if (!zodVerifiedUser.success)
            return res.status(400).json({
                "message": "Zod verification failed"
            });
        const userInDB = yield User_1.default.findOne({
            username: userBody.username
        });
        if (userInDB)
            return res.status(409).json({
                "message": "User already exists"
            });
        const newUser = yield User_1.default.create({
            username: userBody.username,
            password: userBody.password
        });
        return res.json({
            "user": newUser
        });
    }
    catch (e) {
        return res.json({
            "message": e
        });
    }
});
exports.signup = signup;
const signin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userBody = req.body;
        const zodVerifiedUser = types_1.userSchema.safeParse(userBody);
        if (!zodVerifiedUser.success)
            return res.status(400).json({
                "message": "Zod verification failed"
            });
        const userInDB = yield User_1.default.findOne({
            username: userBody.username,
            password: userBody.password
        });
        if (!userInDB)
            return res.status(401).json({
                "message": "Credentials wrong"
            });
        const token = jsonwebtoken_1.default.sign({
            userID: userInDB._id
        }, process.env.JWT_TOKEN);
        res.json({
            "message": "Signed in successfully",
            "token": token,
            "userID": userInDB._id
        });
    }
    catch (e) {
        return res.json({
            "message": e
        });
    }
});
exports.signin = signin;
