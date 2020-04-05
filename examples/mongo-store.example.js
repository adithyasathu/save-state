/* tslint:disable:no-console */

const { Store, HealthEvents } = require("../lib");

const client = Store.createClient(
    {
        mongo: {
            collection: "example-collection",
            db: "example",
            url: "mongodb://localhost:27017",
        },
    });

(async () => {

// register listener
client.on(HealthEvents.Ready, (status) => {
    console.log(`Client connection ${status ? "ready" : "failure"}`);
});

// client connection request
await client.connect();

// save document
await client.set({ boo : {  a : 1}});

// save multiple documents
await client.set({ foo : {  b : 23}, eoo : { c: {d : 45 } }});

// cant save wrong format
await client.set({ yoo: "no document fail"}).catch((err) => {
    console.log(`Error while setting the wrong document format ${err}`);
});

// get multiple documents
await client.get(["boo", "foo", "eoo", "yoo"]).then((result) => {
    console.log(`Documents retrieved ${result}`);
}).catch((err) => {
    console.log(`Error while retrieving documents ${err}`);
});

// remove document by key
await client.remove("boo");

console.log(`Documents after "boo" removed - ${JSON.stringify(await client.get(["boo", "foo", "eoo", "yoo"]))}`);

// remove all documents
await client.removeAll();

console.log(`Documents after removeAll - ${JSON.stringify(await client.get(["boo", "foo", "eoo", "yoo"]))}`);

// client disconnect request
await client.disconnect();

})();
