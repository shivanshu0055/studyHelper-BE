"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const asyncHandlers_1 = require("../asyncHandlers");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/signup", (0, asyncHandlers_1.asyncHandler)(auth_controller_1.signup));
exports.authRouter.post("/signin", (0, asyncHandlers_1.asyncHandler)(auth_controller_1.signin));
