/* tslint:disable:no-console */

const { Store, HealthEvents } = require("../lib");

const client = Store.createClient();

// register listener
client.on(HealthEvents.Ready, (status) => {
    console.log(`Client connection ${status ? "ready" : "failure"}`);
});

// client connection request
client.connect();

// save document
client.set({ boo : {  a : 1}});

// save multiple documents
client.set({ foo : {  b : 23}, eoo : { c: {d : 45 } }});

// get multiple documents
console.log(`Documents retrieved ${JSON.stringify(client.get(["boo", "foo", "eoo", "yoo"]))}`);

// remove document by key
client.remove("boo");

// check documents after removing one document
console.log(`Documents retrieved after "boo" removed - ${JSON.stringify(client.get(["boo", "foo", "eoo", "yoo"]))}`);

// remove all documents
client.removeAll();

// check documents after removing all documents
console.log(`Documents retrieved after removeAll - ${JSON.stringify(client.get(["boo", "foo", "eoo", "yoo"]))}`);

// client disconnect request
client.disconnect();
