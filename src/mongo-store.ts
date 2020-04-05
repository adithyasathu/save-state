import { EventEmitter } from "events";
import { logger as log } from "./logger";
import { MongoClient, Db } from "mongodb";
import { promisify, inspect } from "util";
import { IStore, HealthEvents, IMongoStoreConfig } from "./interfaces";

const sleep = promisify(setTimeout);

export class MongoStore extends EventEmitter implements IStore {
    private client: any;
    private db: Db;
    private collection: any;

    public constructor(private options: IMongoStoreConfig) {
        super();
    }

    public async connect() {
        this.client = await this.connectRetry(this.options);
        this.db = this.client.db(this.options.db);

        this.db.once("error", (err) => {
            this.emit(HealthEvents.Ready, false);
            if (err) {
                log.error("Error connecting ", inspect(err));
            }
        });

        this.db.once("close", (closeEvent) => {
            this.emit(HealthEvents.Ready, false);
            if (closeEvent) {
                log.info("closeEvent received ", inspect(closeEvent));
            }

        });

        this.collection = this.db.collection(this.options.collection);
        this.emit(HealthEvents.Ready, true);
    }

    public isReady(): Promise<void> {
        return this.db.stats().then(() => {
            this.emit(HealthEvents.Ready, true);
        }).catch((err) =>  {
            log.error("Error while checking the health ", inspect(err));
            this.emit(HealthEvents.Ready, false);
        });
    }

    public async disconnect() {
        if (this.client) {
            return this.client.close();
        }
    }

    public async removeAll() {
        if (!this.client) {
            throw new Error("Client is not initialized");
        }
        return this.collection.deleteMany({});
    }

    public async remove(key: string) {
        if (!this.client) {
            throw new Error("Client is not initialized");
        }
        return this.collection.deleteOne({_id: key});
    }

    public async get(keys: string[]) {
        if (!this.client) {
            throw new Error("Client is not initialized");
        }
        const docs = await this.collection.find({_id : { $in : keys }}).toArray();
        const mapping: any = {};
        keys.forEach((k) => mapping[k] = {});
        // There should always be a one to one map
        for (const result of docs) {
            mapping[result._id] = result;
        }
        return mapping;
    }

    public async set(mappings: any) {
        if (!this.client) {
            throw new Error("Client is not initialized");
        }
        const keys = Object.keys(mappings);
        if (keys.length === 0) {
            return;
        }
        const operations: any []  = [];
        keys.forEach((key) => {
            const value = mappings[key];
            if (value._id) {
                operations.push({
                    replaceOne: {
                        filter : { _id : key },
                        replacement : value,
                    },
                });
                return;
            }
            value._id = key;
            operations.push({
                insertOne: {
                    document: value,
                },
            });
        });
        return this.collection.bulkWrite(operations);
    }

    private async connectRetry(opt: IMongoStoreConfig) {
        let attempt = 1;

        if (!opt.retry) {
            opt.retry = {
                secsWaitBetween: 0,
                secsAbortAfter: 0,
            };

            log.warn("No Mongo retry config supplied, using default: ", opt.retry);
        }

        const timeFailAfter = Date.now() + (opt.retry.secsAbortAfter * 1000);

        for (let i = 0; i >= 0; i++) {
            if (i) {
                log.info(`wait for ${opt.retry.secsWaitBetween} sec before retry`);
                await sleep(opt.retry.secsWaitBetween * 1000);
            }

            try {
                log.info(`connection url ${opt.url} `);
                const client = await MongoClient.connect(opt.url, opt.driver);
                log.info("Mongo connection requested");
                this.emit("connected");

                return client;
            } catch (err) {
                log.error(`Mongo connection failed with ${inspect(err)}`);
                log.info(`trying again - attempt ${attempt}`);

                this.emit("connectFail", attempt++, (url: string) => {
                    log.info(`connection url ${url}`);
                    opt.url = url;
                });

                if (Date.now() >= timeFailAfter) { throw err; }
            }
        }
    }
}
