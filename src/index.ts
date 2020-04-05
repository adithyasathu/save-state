import { MemoryStore } from "./memory-store";
import { RedisStore } from "./redis-store";
import { MongoStore } from "./mongo-store";
import {
    IStore,
    HealthEvents,
    IHealthCheck,
    IStoreOptions,
    IMongoStoreConfig,
    IRedisStoreConfig,
} from "./interfaces";

enum StoreType {
    Redis = "redis",
    Mongo = "mongo",
    Elastic = "elastic",
}

class Store {

    public static createClient(options?: any): IStore {

        if (!options || Object.keys(options).length === 0) {
            return new MemoryStore();
        }
        // config is supposed to be wrapped with store type i.e, one of - mongo, redis or elastic
        const storeType = Object.keys(options)[0];

        switch (storeType) {
            case StoreType.Mongo:
                return new MongoStore(options[storeType]);
            case StoreType.Redis:
                return new RedisStore(options[storeType]);
            default:
                throw new Error("config options are invalid");
        }
    }

}

export {
    Store,
    StoreType,
    IHealthCheck,
    IMongoStoreConfig,
    HealthEvents,
    IRedisStoreConfig,
    IStoreOptions,
    IStore,
};
