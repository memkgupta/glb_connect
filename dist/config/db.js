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
const mongoose_1 = __importDefault(require("mongoose"));
const connect = () => __awaiter(void 0, void 0, void 0, function* () {
    const connectionState = mongoose_1.default.connection.readyState;
    if (connectionState === 1) {
        console.log("Already connected");
        return;
    }
    if (connectionState === 2) {
        console.log("Connecting...");
        return;
    }
    try {
        mongoose_1.default.connect(process.env.DB_URI);
    }
    catch (err) {
        console.error(err);
        throw new Error(err);
    }
});
exports.default = connect;
