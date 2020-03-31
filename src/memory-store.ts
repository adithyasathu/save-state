import { EventEmitter } from "events";
import { IStore, HealthEvents } from "./interfaces";

export class MemoryStore extends EventEmitter implements IStore {

    public cache: any = {};

    constructor() { super(); }

    public connect() {
        this.emit(HealthEvents.Ready, true);
        return Promise.resolve();
    }

    public disconnect() {
        return Promise.resolve();
    }

    public isReady(): Promise<void> {
        this.emit(HealthEvents.Ready, true);
        return Promise.resolve();
    }

    public get(keys: string[]) {
        const foundItems: any = {};
        keys.forEach((k) => {
            foundItems[k] = this.cache[k];
        });
        return foundItems;
    }

    public set(map: any) {
        const keys = Object.keys(map);
        keys.forEach((k) => {
            this.cache[k] = map[k];
        });
    }

    public remove(key: string) {
      if (!this.cache.hasOwnProperty(key)) { throw new Error(`${key} not found`); }
      delete this.cache[key];
    }

    public removeAll() {
        this.cache = {};
    }
}
