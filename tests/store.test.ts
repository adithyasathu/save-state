import { Store } from "../src";
import { MemoryStore } from "../src/memory-store";
import { MongoStore } from "../src/mongo-store";
import { RedisStore } from "../src/redis-store";
import { ElasticStore } from "../src/elastic-store";
import { HealthEvents, IStore } from "../src/interfaces";

describe("Store - Client Creation", () => {

    let client: IStore;

    it("Should not create store when wrong config supplied", async (done) => {

        try {
           client =  Store.createClient({ wrong: { config: "here"}});
        } catch (e) {
            expect(e.message).toBe(`Configuration property "wrong" is not defined`);
        } finally {
            expect(client).toBeUndefined();
            done();
        }

    });

    it("Should fail to create mongo store when invalid mongo config supplied", async (done) => {
        try {
           client = Store.createClient({ mongo: { wrong: "config" }});
           await client.connect();
        } catch (e) {
            expect(e.message).toBeDefined();
        }  finally {
            await client.disconnect();
            done();
        }

    });

    it("Should fail to create redis store when invalid redis config supplied", async (done) => {
        try {
            client = Store.createClient({ redis: { wrong: "config" }});
            await client.connect();
        } catch (e) {
            expect(e.message).toBeDefined();
        }  finally {
            await client.disconnect();
            done();
        }

    });

    it("Should fail to create elastic store when invalid elastic config supplied", async (done) => {
        try {
            client = Store.createClient({ elastic: { wrong: "config" }});
            await client.connect();
        } catch (e) {
            expect(e.message).toBeDefined();
        }  finally {
            await client.disconnect();
            done();
        }

    });

    it("Should create In-memory store when no config supplied", async () => {
        client = Store.createClient();
        expect(client instanceof MemoryStore).toEqual(true);
    });

    it("Should create In-memory store when null config supplied", async () => {
        client = Store.createClient(null);
        expect(client instanceof MemoryStore).toEqual(true);
    });

    it("Should create In-memory store when empty config supplied", async () => {
        client = Store.createClient({});
        expect(client instanceof MemoryStore).toEqual(true);
    });

    it("Should emit Ready event when connect is called", async (done) => {
        client = Store.createClient();
        // given
        let isReady = false;
        client.on(HealthEvents.Ready, (status: boolean) => { isReady = status; });
        // when
        await client.connect();
        // then
        expect(isReady).toEqual(true);
        // cleanup
        await client.disconnect();
        done();
    });

    it("Should create mongo client when mongo config supplied", async (done) => {
        client = Store.createClient({
            mongo: {
                collection: "example-collection",
                db: "example",
                url: "mongodb://localhost:27017",
            },
        });
        // given
        let isReady = false;
        client.on(HealthEvents.Ready, (status: boolean) => { isReady = status; });
        // when
        await client.connect();
        // then
        expect(isReady).toEqual(true);
        expect(client instanceof MongoStore).toEqual(true);
        // cleanup
        await client.disconnect();
        done();
    });


    it("Should create redis client when redis config supplied", async (done) => {
        client = Store.createClient(
            {
                redis: {
                    url: "redis://localhost:6379/0",
                },
            });
        // given
        let isReady = false;
        client.on(HealthEvents.Ready, (status: boolean) => { isReady = status; });
        // when
        await client.connect();
        // then
        expect(isReady).toEqual(true);
        expect(client instanceof RedisStore).toEqual(true);
        // cleanup
        await client.disconnect();
        done();
    });

    it("Should create elastic client when elastic config supplied", async (done) => {
        client = Store.createClient(
            {
                elastic: {
                    url: "localhost:9200",
                },
            });
        // given
        let isReady = false;
        client.on(HealthEvents.Ready, (status: boolean) => { isReady = status; });
        // when
        await client.connect();
        // then
        expect(isReady).toEqual(true);
        expect(client instanceof ElasticStore).toEqual(true);
        // cleanup
        await client.disconnect();
        done();
    });

});
