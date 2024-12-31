"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RufasClient = void 0;
// src/client.ts
const engine_1 = require("./engine");
class RufasClient {
    constructor(dirHandle, schema) {
        this.engine = new engine_1.RufasEngine(dirHandle, schema);
    }
    model(name) {
        return {
            findMany: (options) => this.engine.findMany(name, options),
            create: (data) => this.engine.create(name, data),
            update: (id, data) => this.engine.update(name, id, data),
            delete: (id) => this.engine.delete(name, id),
        };
    }
}
exports.RufasClient = RufasClient;
