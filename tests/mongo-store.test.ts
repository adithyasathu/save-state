import config from "config";
import { IMongoStoreConfig, MongoStore } from "../src/mongo-store";
import { HealthEvents, IStore } from "../src/interfaces";
import { useFakeTimers, clock, reset, restore } from "sinon";


describe("Mongo Store - CRUD Operations", () => {
    const validMongoOption: IMongoStoreConfig = {
        connection: {
            url: config.get<string>("store.mongo.url"),
            db: "test-db",
            collection: "test-collection",
        },
    };

    const store = new MongoStore(validMongoOption);

    beforeAll(async () => {
        await store.connect();
    });

    afterEach(async  () => {
        await store.removeAll();
    });

    afterAll(async  () => {
        await store.disconnect();
    });

    it("No documents - should be empty result on get keys",  (done) => {
        store.get(["test"]).then(
            (result) => {
                expect(result).toMatchObject({test: {}});
                done();
            });
    });

    it("Should set remove and get", async (done) => {
        expect(await store.get(["boo"])).toMatchObject({ boo : {}});
        await store.set({ boo : {  a : 1}});
        await store.set({ foo : {  b : 23}, eoo : {c: {d : 45 } }});
        await store.set({});
        expect(await store.get(["boo", "foo", "eoo", "woo", "abc"])).toMatchObject({
            boo: {
                _id: "boo",
                a: 1,
            },
            foo: {
                _id: "foo",
                b: 23,
            },
            eoo: {
                _id: "eoo",
                c: {
                    d: 45,
                },
            },
            woo: {},
            abc: {},
        });
        await store.remove("eoo");
        expect(await store.get(["eoo"])).toMatchObject({ eoo : {}});
        await store.set({ boo : {  a : 2, _id :  "boo" }});
        expect(await store.get(["boo"])).toMatchObject({ boo : { a: 2, _id : "boo" }});
        done();
    });

});

describe("Mongo - BAD connection", () => {
    const badConnection: IMongoStoreConfig = {
        connection:
            {
                url: "mongodb://unknownhost:27017",
                db: "test-db",
                collection: "test-collection",
            },
    };

    const badStore = new MongoStore(badConnection);

    it("Should fail on bad connection",  (done) => {

        badStore.connect()
            .then(() => done(new Error("Should not be ok")))
            .catch((err) => {
                expect(err).toBeDefined();
                done();
            });
    });

    afterAll(async () => {
        await badStore.disconnect();
    });
});

describe("MongoDB isReady and emit event" , () => {

    const validMongoOption: IMongoStoreConfig = {
        connection: {
            url: config.get<string>("store.mongo.url"),
            db: "test-db",
            collection: "test-collection",
        },
    };

    const store = new MongoStore(validMongoOption);

    it("Should emit Ready event when DB connected", async () => {
        // given
        let isReady = false;
        store.on(HealthEvents.Ready, (status: boolean) => { isReady = status; });
        // when
        await store.connect();
        await new Promise((resolve) => setTimeout(resolve, 100));
        // then
        expect(isReady).toEqual(true);
    });

    it("Should emit Ready(false) event when DB disconnected", async () => {
        // given
        let isReady = true;
        store.on(HealthEvents.Ready, (status: boolean) => { isReady = status; });
        // when
        await store.connect();
        await store.disconnect();
        await new Promise((resolve) => setTimeout(resolve, 100));
        // then
        expect(isReady).toEqual(false);
    });

    it("Should emit Ready event when DB connected and isReady called", async () => {
        // given
        let isReady = false;
        store.on(HealthEvents.Ready, (status: boolean) => { isReady = status; });
        // when
        await store.connect();
        await store.isReady();
        await new Promise((resolve) => setTimeout(resolve, 100));
        // then
        expect(isReady).toEqual(true);
    });

    it("Should emit Ready(false) event when DB disconnected and isReady called", async () => {
        // given
        let isReady = true;
        store.on(HealthEvents.Ready, (status: boolean) => { isReady = status; });
        // when
        await store.connect();
        await store.disconnect();
        await store.isReady();
        await new Promise((resolve) => setTimeout(resolve, 100));
        // then
        expect(isReady).toEqual(false);
    });

});


describe("Mongo connection retry", () => {
    let store: IStore;

    beforeAll(() => {
        useFakeTimers();
        store = new MongoStore({
            connection: {
                url: "mongodb://some-rubbish-host-name:59999",
                db: "test-db",
                collection: "test-collection",
                driver: {
                    auto_reconnect: false,
                },
                retry: {
                    secsWaitBetween: 2,
                    secsAbortAfter: 15,
                },
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
                    setUrl(config.get<string>("store.mongo.url")); // now swap for real URL
                }
            })
            .on("connected", () => {
                expect(failedTimes).toBe(2);
                done();
            });
    });

    afterAll(async () => {
        restore();
        reset();
        await store.disconnect();
    });
});

describe("MongoDB should check client initialization before any operation" , () => {
    const validMongoOption: IMongoStoreConfig = {
        connection: {
            url: config.get<string>("store.mongo.url"),
            db: "test-db",
            collection: "test-collection",
        },
    };

    const store = new MongoStore(validMongoOption);

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
