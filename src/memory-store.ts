import { validate } from "./validator";
import { EventEmitter } from "events";
import { IStore, HealthEvents } from "./interfaces";

export class MemoryStore extends EventEmitter implements IStore {

    public cache: any = {};

    constructor() { super(); }

    public async connect() {
        this.emit(HealthEvents.Ready, true);
        return Promise.resolve();
    }

    public async disconnect() {
        this.cache = {};
        this.emit(HealthEvents.Ready, false);
        return Promise.resolve();
    }

    public async isReady(): Promise<void> {
        this.emit(HealthEvents.Ready, true);
        return Promise.resolve();
    }

    public async get(keys: string[]) {
        if (!keys || keys.length === 0 || keys.includes("")) {
            throw new Error("invalid keys");
        }
        const foundItems: any = {};
        keys.forEach((k) => {
            foundItems[k] = this.cache[k] || null;
        });
        return foundItems;
    }

    public async set(mappings: any) {
        if (!validate(mappings)) {
            throw new Error("not a valid object to save");
        }
        const keys = Object.keys(mappings);
        keys.forEach((k) => {
            this.cache[k] = mappings[k];
        });
    }

    public async remove(key: string) {
        if (!key) {
            throw new Error("not a valid key");
        }
        delete this.cache[key];
    }

    public async removeAll() {
        this.cache = {};
    }
}
