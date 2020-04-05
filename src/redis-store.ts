import { EventEmitter } from "events";
import { promisifyAll } from "bluebird";
import { logger as log } from "./logger";
import { promisify, inspect } from "util";
import { RedisClient, Multi, createClient } from "redis";
import { IStore, HealthEvents, IRedisStoreConfig } from "./interfaces";

const sleep = promisify(setTimeout);

promisifyAll(RedisClient.prototype);
promisifyAll(Multi.prototype);

export class RedisStore extends EventEmitter implements IStore {

    private client: any;

    constructor(private options: any) {
        super();
    }

    public async connect() {
        this.client = await this.connectRetry(this.options).catch((err) => { throw err; });
    }

    public isReady(): Promise<void> {
        this.emit(HealthEvents.Ready, this.client.connected);
        return Promise.resolve();
    }

    public async disconnect() {
        if (this.client) {
            this.client.end(true);
            this.emit(HealthEvents.Ready, false);
        }
    }

    public async remove(key: string) {
        if (!this.client) {
            throw new Error("Client is not initialized");
        }
        return (this.client as any).delAsync(key);
    }

    public async removeAll() {
        if (!this.client) {
            throw new Error("Client is not initialized");
        }
        return (this.client as any).flushdbAsync();
    }

    public async get(keys: string []) {
        if (!this.client) {
            throw new Error("Client is not initialized");
        }

        return (this.client as any).mgetAsync(keys).then((values: any) => {
            const mapping: any = {};
            // There should always be a one to one map
            for (let i = 0; i < keys.length; i++) {
                const value = JSON.parse(values[i] || "{}");
                mapping[keys[i]] =  value;
            }
            return mapping;
        });
    }

    public async set(map: any) {
        if (!this.client) {
            throw new Error("Client is not initialized");
        }

        const writes = [];
        const keys = Object.keys(map);
        if (keys.length === 0) {
            return;
        }

        for (const key of keys) {
            writes.push(key);
            writes.push(JSON.stringify(map[key]));
        }
        return (this.client as any).msetAsync(writes);
    }

    private async connectRetry(opt: IRedisStoreConfig) {
        let attempt = 1;
        const redisOptions: any = { url: opt.url };

        // use password if supplied
        if (opt.password) {
            redisOptions.password = opt.password;
        }

        // set TLS settings if supplied
        if (opt.tls) {
            redisOptions.tls = {};
        }

        if (!opt.retry) {
            opt.retry = {
                secsWaitBetween: 0,
                secsAbortAfter: 0,
            };

            log.warn(`No Redis retry config supplied, using default: ${inspect(opt.retry)}`);
        }

        const timeFailAfter = Date.now() + (opt.retry.secsAbortAfter * 1000);

        for (let i = 0; i >= 0; i++) {
            if (i) { await sleep(opt.retry.secsWaitBetween * 1000); }

            try {
                const client = createClient(redisOptions);

                await new Promise((resolve, reject) => {
                    client
                    .once("ready", resolve)
                    .once("error", (err) => {
                        client.end(true);
                        this.emit(HealthEvents.Ready, false);
                        log.error(`Error event received `, inspect(err));
                        reject(err);
                    })
                    .once("end", (err) => {
                            client.end(true);
                            this.emit(HealthEvents.Ready, false);
                            log.error(`Connection end event received `, inspect(err));
                            reject(err);
                        });
                    });

                log.info("Redis connected");
                this.emit("connected");
                this.emit(HealthEvents.Ready, true);

                return client;
            } catch (err) {
                log.error(`Redis connection failure `, inspect(err));
                log.info(`Redis connection failed (attempt ${attempt}), trying again`);

                this.emit("connectFail", attempt++, (url: string) => {
                    log.info(`connection url ${url}`);
                    redisOptions.url = url;
                });
                this.emit(HealthEvents.Ready, false);

                if (Date.now() >= timeFailAfter) {
                    await this.disconnect();
                    log.error(`Timeout - Redis connection failure `, inspect(err));
                    throw err;
                }
            }
        }
    }
}
