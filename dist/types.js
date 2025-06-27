"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noteSchema = exports.userSchema = void 0;
const zod_1 = require("zod");
exports.userSchema = zod_1.z.object({
    username: zod_1.z.string().min(5).max(20),
    password: zod_1.z.string().min(3).max(10)
});
exports.noteSchema = zod_1.z.object({
    title: zod_1.z.string(),
    content: zod_1.z.string(),
    subject: zod_1.z.string(),
    color: zod_1.z.string(),
    contentJSON: zod_1.z.any()
});
