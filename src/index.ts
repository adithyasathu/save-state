import config from "config";
import { MemoryStore } from "./memory-store";
import { RedisStore } from "./redis-store";
import { MongoStore } from "./mongo-store";
import {
    IStore,
    HealthEvents,
    IHealthCheck,
    IMongoStoreConfig,
    IRedisStoreConfig,
    IStoreOptions,
} from "./interfaces";
import { logger as log } from "./logger";
import { ElasticStore } from "./elastic-store";

enum StoreType {
    Redis = "redis",
    Mongo = "mongo",
    Elastic = "elastic",
}

// tslint:disable:max-line-length
const copyDefault = (options: IStoreOptions, storeType: string): IStoreOptions => Object.assign(options, config.get(storeType));

class Store {

    public static createClient(options?: any): IStore {

        if (!options || Object.keys(options).length === 0) {
            return new MemoryStore();
        }
        // config is supposed to be wrapped with store type i.e, one of - mongo, redis or elastic
        const storeType = Object.keys(options)[0];
        log.debug("store options ", config.get(storeType));
        const opts: IStoreOptions = copyDefault(options[storeType], storeType);
        switch (storeType) {
            case StoreType.Mongo:
                return new MongoStore(opts);
            case StoreType.Redis:
                return new RedisStore(opts);
            case StoreType.Elastic:
                return new ElasticStore(opts);
            default:
                throw new Error("config options are invalid");
        }
    }

}

export {
    Store,
    IStore,
    StoreType,
    IHealthCheck,
    HealthEvents,
    IStoreOptions,
    IMongoStoreConfig,
    IRedisStoreConfig,
};
