import config from "config";
import { RedisStore } from "../src/redis-store";
import { HealthEvents, IStore, IRedisStoreConfig } from "../src/interfaces";
import { useFakeTimers, clock, reset, restore } from "sinon";

describe("Redis Store - CRUD Operations", () => {
    const validRedisOption: IRedisStoreConfig = {
            url: config.get<string>("redis.url"),
    };

    const store = new RedisStore(validRedisOption);

    beforeAll(async (done) => {
        await store.connect();
        done();
    });

    afterEach(async (done) => {
        await store.removeAll();
        done();
    });

    afterAll(async (done) => {
        await store.disconnect().catch((err) => { /* do nothing */ });
        done();
    });

    it("No documents - should be empty result on get keys",  (done) => {
        store.get(["test"]).then(
            (result) => {
                expect(result).toMatchObject({test: null});
                done();
            });
    });

    it("Should set remove and get", async (done) => {
        expect(await store.get(["boo"])).toMatchObject({ boo : null });
        // save one document
        await store.set({ boo : {  a : 1 }});
        // save multiple documents
        await store.set({ foo : {  b : 23}, eoo : { c: { d : 45 } }});
        // validate mapping object
        await store.set({}).catch((err) => { expect(err.message).toBe("not a valid object to save"); });
        await store.set(null).catch((err) => { expect(err.message).toBe("not a valid object to save"); });
        // validate get API
        await store.get([]).catch((err) => { expect(err.message).toBe("invalid keys"); });
        await store.get(["", ""]).catch((err) => { expect(err.message).toBe("invalid keys"); });
        // retrieve multiple documents
        expect(await store.get(["boo", "foo", "eoo", "woo", "abc"])).toMatchObject({
            boo: {
                a: 1,
            },
            foo: {
                b: 23,
            },
            eoo: {
                c: {
                    d: 45,
                },
            },
            woo: null,
            abc: null,
        });
        // validate key
        await store.remove("").catch((err) => { expect(err.message).toBe("not a valid key"); });
        // remove a document
        await store.remove("eoo");
        // retrieve removed document
        expect(await store.get(["eoo"])).toMatchObject({ eoo : null});
        // update saved document
        await store.set({ boo : {  a : 2 }});
        // check updated document
        expect(await store.get(["boo"])).toMatchObject({ boo : { a: 2}});
        done();
    });

});

describe("Redis - BAD connection", () => {
    const badConnection: IRedisStoreConfig = {
                url: "redis://unknownhost:6379",
    };

    const badStore = new RedisStore(badConnection);

    it("Should throw error on bad connection",  (done) => {

         badStore.connect()
            .then(() => done(new Error("Should not be ok")))
            .catch((err) => {
                expect(err).toBeDefined();
                done();
            });
    });

    afterAll(async (done) => {
        await badStore.disconnect().catch((err) => { /* do nothing */ });
        done();
    });
});

describe("RedisDB isReady and emit event" , () => {

    const validRedisOption: IRedisStoreConfig = {
            url: config.get<string>("redis.url"),
    };

    const store = new RedisStore(validRedisOption);

    beforeAll((done) => {
        useFakeTimers();
        done();
    });

    afterEach(async (done) => {
        restore();
        reset();
        await store.disconnect().catch((err) => { /* do nothing */ });
        done();
    });

    it("Should emit Ready event when DB connected", async (done) => {
        // given
        let isReady = false;
        store.on(HealthEvents.Ready, (status: boolean) => { isReady = status; });
        // when
        await store.connect();
        clock.tick(100);
        // then
        expect(isReady).toEqual(true);
        done();
    });

    it("Should emit Ready(false) event when DB disconnected", async (done) => {
        // given
        let isReady = true;
        store.on(HealthEvents.Ready, (status: boolean) => {
            isReady = status;
        });
        // when
        await store.connect();
        await store.disconnect();
        clock.tick(100);
        // then
        expect(isReady).toEqual(false);
        done();
    });

    it("Should emit Ready event when DB connected and isReady called", async (done) => {
        // given
        let isReady = false;
        store.on(HealthEvents.Ready, (status: boolean) => { isReady = status; });
        // when
        await store.connect();
        await store.isReady();
        clock.tick(100);
        // then
        expect(isReady).toEqual(true);
        done();
    });

    it("Should emit Ready(false) event when DB disconnected and isReady called", async (done) => {
        // given
        let isReady = true;
        store.on(HealthEvents.Ready, (status: boolean) => { isReady = status; });
        // when
        await store.connect();
        await store.disconnect();
        await store.isReady();
        clock.tick(100);
        // then
        expect(isReady).toEqual(false);
        done();
    });

});

describe("Redis connection retry", () => {
    let store: IStore;

    beforeAll(() => {
        useFakeTimers();
        store = new RedisStore({
                url: "redis://some-rubbish-host-name:59999",
                retry: {
                    secsWaitBetween: 2,
                    secsAbortAfter: 15,
                },
        });
    });

    test("Connect on 4th attempt", (done) => {
        let failedTimes = 0;
        store.connect();

        store.on("connectFail", (tryNumber, setUrl) => {
            clock.tick(100);
            failedTimes++;
            if (2 === tryNumber) {
                setUrl(config.get<string>("redis.url")); // now swap for real URL
            }
        })
            .on("connected", () => {
                expect(failedTimes).toBe(2);
                done();
            });
    });

    afterEach(async (done) => {
        restore();
        reset();
        await store.disconnect().catch((err) => { /* do nothing */ });
        done();
    });
});

describe("RedisDB should check client initialization before any operation" , () => {
    const validRedisOption: IRedisStoreConfig = {
            url: config.get<string>("redis.url"),
    };

    const store = new RedisStore(validRedisOption);

    afterAll(async (done) => {
        await store.disconnect().catch((err) => { /* do nothing */ });
        done();
    });

    it("check client initialization before isReady", async (done) => {
        try {
            await store.isReady();
        } catch (error) {
            expect(error.message).toBe("Client is not initialized");
        } finally {
            done();
        }

    });

    it("check client initialization before get", async (done) => {
        try {
            await store.get(["test"]);
        } catch (error) {
            expect(error.message).toBe("Client is not initialized");
        } finally {
            done();
        }

    });

    it("check client initialization before set", async (done) => {
        try {
            await store.set({ test: { yoo: "world" }});
        } catch (error) {
            expect(error.message).toBe("Client is not initialized");
        } finally {
            done();
        }

    });

    it("check client initialization before remove", async (done) => {
        try {
            await store.remove("test");
        } catch (error) {
            expect(error.message).toBe("Client is not initialized");
        } finally {
            done();
        }

    });

    it("check client initialization before removeALL", async (done) => {
        try {
            await store.removeAll();
        } catch (error) {
            expect(error.message).toBe("Client is not initialized");
        } finally {
            done();
        }
    });
});
