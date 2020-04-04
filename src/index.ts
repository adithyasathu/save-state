// TODO implementation that would create the specific DB connection depending on the options/connection details passed

import { MemoryStore } from "./memory-store";
import { RedisStore } from "./redis-store";
import { MongoStore } from "./mongo-store";

module.exports.MemoryStore = MemoryStore;
module.exports.MongoStore = MongoStore;
module.exports.RedisStore = RedisStore;
