import config from "config";
import { ElasticStore } from "../src/elastic-store";
import { HealthEvents, IStore, IElasticStoreConfig } from "../src/interfaces";
import { useFakeTimers, clock, reset, restore } from "sinon";

describe("Elastic Store - CRUD Operations", () => {
    const validElasticOption: IElasticStoreConfig = {
            url: config.get<string>("elastic.url"),
            index: "test",
            type: "test-type",
    };

    const store = new ElasticStore(validElasticOption);

    beforeAll(async (done) => {
        await store.connect();
        done();
    });

    afterEach(async (done) => {
        await store.removeAll();
        done();
    });

    afterAll(async (done) => {
        await store.disconnect();
        done();
    });

    it("No documents - should be empty result on get keys",  (done) => {
        store.get(["test"]).then(
            (result) => {
                // tslint:disable:no-console
                console.log("result ", JSON.stringify(result));
                expect(result).toMatchObject({ test: null });
                done();
            });
    });

    it("Should set remove and get", async (done) => {
        expect(await store.get(["boo"])).toMatchObject({ boo : null });
        await store.set({ boo : {  a : 1 }});
        await store.set({ foo : {  b : 23}, eoo : { c: { d : 45 } }});
        await store.set({});
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
        await store.remove("eoo");
        expect(await store.get(["eoo"])).toMatchObject({ eoo : null});
        await store.set({ boo : {  a : 2 }});
        expect(await store.get(["boo"])).toMatchObject({ boo : { a: 2}});
        done();
    });

});

describe("Elastic - BAD connection", () => {
    const badConnection: IElasticStoreConfig = {
                url: "unknownhost:9200",
                index: "test",
                type: "test-type",
            };

    const badStore = new ElasticStore(badConnection);

    it("Should fail on bad connection",  (done) => {

        badStore.connect()
            .then(() => done(new Error("Should not be ok")))
            .catch((err) => {
                expect(err).toBeDefined();
                done();
            });
    });

    afterAll(async (done) => {
        await badStore.disconnect();
        done();
    });
});

describe("ElasticDB isReady and emit event" , () => {

    const validElasticOption: IElasticStoreConfig = {
            url: config.get<string>("elastic.url"),
            index: "test",
            type: "test-type",
    };

    const store = new ElasticStore(validElasticOption);

    beforeAll((done) => {
        useFakeTimers();
        done();
    });

    afterEach(async (done) => {
        restore();
        reset();
        await store.disconnect();
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
        store.on(HealthEvents.Ready, (status: boolean) => { isReady = status; });
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

describe("Elastic connection retry", () => {
    let store: IStore;

    beforeAll(() => {
        useFakeTimers();
        store = new ElasticStore({
                url: "some-rubbish-host-name:59999",
                index: "test",
                type: "test-type",
                driver: {
                    auto_reconnect: false,
                },
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
                    setUrl(config.get<string>("elastic.url")); // now swap for real URL
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
        await store.disconnect();
        done();
    });
});

describe("ElasticDB should check client initialization before any operation" , () => {
    const validElasticOption: IElasticStoreConfig = {
            url: config.get<string>("elastic.url"),
            index: "test",
            type: "test-type",
    };

    const store = new ElasticStore(validElasticOption);

    afterAll(async (done) => {
        await store.disconnect();
        done();
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
