import { HealthEvents } from "../src/interfaces";
import { MemoryStore } from "../src/memory-store";

describe("Memory Store", () => {

    const store = new MemoryStore();

    beforeAll(async (done) => {
        await store.connect();
        done();
    });

    afterAll(async (done) => {
        await store.removeAll();
        await store.disconnect();
        done();
    });

    it("Should emit Ready event when isReady is called", async (done) => {
        // given
        let isReady = false;
        store.on(HealthEvents.Ready, (status: boolean) => { isReady = status; });
        // when
        await store.isReady();
        // then
        expect(isReady).toEqual(true);
        done();
    });

    describe("set get remove", () => {

        beforeAll( async (done) => {
            await store.set({boo: {a: 1}, foo: { abc: "alphabet" }});
            done();
        });

        it("get ", async (done) => {
            // validate mapping object
            await store.set({}).catch((err) => { expect(err.message).toBe("not a valid object to save"); });
            await store.set(null).catch((err) => { expect(err.message).toBe("not a valid object to save"); });
            // validate get API
            await store.get([]).catch((err) => { expect(err.message).toBe("invalid keys"); });
            await store.get(["", ""]).catch((err) => { expect(err.message).toBe("invalid keys"); });
            expect(await store.get(["yoo"])).toMatchObject({yoo: null}); // not set
            expect(await store.get(["boo"])).toMatchObject({boo: {a: 1}}); // get one
            expect(await store.get(["foo"])).toMatchObject({ foo: { abc: "alphabet" } }); // get other
            expect(await store.get(["boo", "foo"])).toMatchObject({boo: {a: 1}, foo: { abc: "alphabet" }}); // get both
            done();
        });

        it("remove ", async (done) => {
            await store.remove("boo");
            // validate key
            await store.remove("").catch((err) => { expect(err.message).toBe("not a valid key"); });
            expect(await store.get(["boo", "foo"])).toMatchObject({foo: { abc: "alphabet" } , boo: null});
            await store.remove("foo");
            expect(await store.get(["boo", "foo"])).toMatchObject({boo: null, foo: null });
            // expect(store.remove("yoo")).toThrowError("yoo not found");
            try {   await store.remove("yoo");  } catch (err) {  expect(err.message).toBe("yoo not found"); }
            done();
        });

    });

});
