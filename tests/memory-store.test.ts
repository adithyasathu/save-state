import { HealthEvents } from "../src/interfaces";
import { MemoryStore} from "../src/memory-store";

describe("Memory Store", () => {

    const store = new MemoryStore();

    beforeAll(async () => {
        await store.connect();
    });

    afterAll(async () => {
        store.removeAll();
        await store.disconnect();
    });

    it("Should emit Ready event when isReady is called", async () => {
        // given
        let isReady = false;
        store.on(HealthEvents.Ready, (status: boolean) => { isReady = status; });
        // when
        await store.isReady();
        // then
        expect(isReady).toEqual(true);
    });

    describe("set get remove", () => {

        beforeAll(() => {
            store.set({boo: {a: 1}, foo: "abc"});
        });

        it("get ", () => {
            expect(store.get(["yoo"])).toMatchObject({}); // not set
            expect(store.get(["boo"])).toMatchObject({boo: {a: 1}}); // get one
            expect(store.get(["foo"])).toMatchObject({foo: "abc"}); // get other
            expect(store.get(["boo", "foo"])).toMatchObject({boo: {a: 1}, foo: "abc"}); // get both

        });

        it("remove ", () => {
            store.remove("boo");
            expect(store.get(["boo", "foo"])).toMatchObject({foo: "abc"});
            store.remove("foo");
            expect(store.get(["boo", "foo"])).toMatchObject({});
            // expect(store.remove("yoo")).toThrowError("yoo not found");
            try {   store.remove("yoo");  } catch (err) {  expect(err.message).toBe("yoo not found"); }
        });

    });

});
