import { IStore, HealthEvents, IElasticStoreConfig } from "./interfaces";
import { Client } from "elasticsearch";
import { logger as log } from "./logger";
import { inspect } from "util";
import { EventEmitter } from "events";

export class ElasticStore extends EventEmitter implements IStore {
    public client: Client;

    constructor(private options: any) {
        super();
    }

    public async connect() {
        this.client = await this.connectRetry(this.options);
    }

    public isReady(): Promise<void> {
        if (!this.client) {
            throw new Error("Client is not initialized");
        }
        return this.client.ping({requestTimeout: 1000}).then((ping) => {
          log.debug("Elastic ping", ping);
          this.emit(HealthEvents.Ready, true);
        }).catch(() =>  {
            this.emit(HealthEvents.Ready, false);
            return;
        });
    }

    public async disconnect() {
        if (!this.client) {  return; }
        this.emit(HealthEvents.Ready, false);
        return this.client.close();
    }

    public async get(keys: string []) {
        if (!this.client) {
            throw new Error("Client is not initialized");
        }
        if (!keys || keys.length === 0) {
            return "nothing to query";
        }
        return this.client.mget({
                index: this.options.index,
                type : this.options.type,
                body : { ids : keys },
            })
            .then((results: any) => {
                const mapping: any = {};
                // There should always be a one to one map
                for (const result of results.docs) {
                    mapping[result._id] = null; // set null if not present
                    if (result.found) {
                        mapping[result._id] = result._source;
                    }
                }
                return mapping;
        }).catch((err: any) => {
            log.error(`Error with get ${err}`);
        });
    }

    public async remove(key: string) {
        if (!this.client) {
            throw new Error("Client is not initialized");
        }

        await this.client.delete({
            index: this.options.index,
            type : this.options.type,
            id: key,
        });

    }

    public async removeAll() {
        if (!this.client) {
            throw new Error("Client is not initialized");
        }

        await this.client.deleteByQuery({
          index: this.options.index,
          ignoreUnavailable: true,
          body: {
                query: {
                match_all: {},
             },
          },
        });

    }

    public async set(mappings: any) {
        if (!this.client) {
            throw new Error("Client is not initialized");
        }

        const keys = Object.keys(mappings);
        if (keys.length === 0) {
            return;
        }
        let body = "";
        const indexName = this.options.index;
        const typeName = this.options.type;
        keys.forEach((key) => {
            const value = mappings[key];
            body += JSON.stringify({
                index : { _index : indexName, _type : typeName, _id : key },
            });
            body += "\n";
            body += JSON.stringify(value);
            body += "\n";
        });

        const response = await this.client.bulk({ body });
        if (!response.errors) { return response; }
        log.error("Failed bulk operation on Elastic", inspect(response));
        throw Error("Failed bulk operation on Elastic");
    }

    private async connectRetry(opt: IElasticStoreConfig) {
        let attempt = 1;

        if (!opt.retry) {
            opt.retry = {
                secsWaitBetween: 0,
                secsAbortAfter: 0,
            };

            log.warn("No Elastic retry config supplied, using default: %j", {retry: opt.retry});
        }

        const timeFailAfter = Date.now() + (opt.retry.secsAbortAfter * 1000);

        while (true) {
            try {
                const client = new Client({
                    host: opt.url,
                    log: "info",
                    maxSockets: 64,
                    apiVersion: opt.apiVersion,
                });

                await client.ping({ requestTimeout: opt.retry.secsWaitBetween * 1000 });
                log.info("Elastic connected");
                this.emit("connected");
                this.emit(HealthEvents.Ready, true);

                return client;
            } catch (err) {
                log.info(`Elastic connection failed (attempt ${attempt}), trying again`);
                this.emit(HealthEvents.Ready, false);

                this.emit("connectFail", attempt++, (url: string) => {
                    opt.url = url;
                });

                if (Date.now() >= timeFailAfter) { throw err; }
            }
        }
    }
}
