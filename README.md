### save-state (WIP)

Abstraction for data store with In-Memory cache, MongoDB, Redis and Elastic without worrying about the internal implementations


[![Build Status](https://travis-ci.com/adithyasathu/save-state.svg?branch=master)](https://travis-ci.com/adithyasathu/save-state)
[![codecov](https://codecov.io/gh/adithyasathu/save-state/branch/master/graph/badge.svg)](https://codecov.io/gh/adithyasathu/save-state)

## Installation

```bash
npm install save-store
```

## Usage

#### Example

```js
const Store = require("save-store");
const client = Store.createClient();

// register listener
client.on(HealthEvents.Ready, (status) => {
    console.log(`Store connection ${status ? "ready" : "failure"}`);
});

client.connect();

```

**createClient** takes optional data store config, with no config passed returns In-Memory Store Client

Example below shows Mongo Client creation with mongo store config


```js
const client = Store.createClient(
    {
        mongo: {
            collection: "example-collection",
            db: "example",
            url: "mongodb://localhost:27017",
        },
    });
```


##### set API

**set** takes JSON document whose key is string and value is a document. Can pass more than one document to be saved at once.

```js

// save document
client.set({ boo : {  a : 1}});

// save multiple documents
client.set({
    foo : { b : 23 },
    eoo : { c : { d : 45 } },
});

// save multiple documents
client.set({
             "key-1" : {  ...document-1 },
             "key-2" : {  ...document-2 },
             // ..
             "key-n" : {  ...document-n },
});

```


```js

client.set({ yoo: "not a document"}) // throws error

```


##### get API

**get** takes array of strings (keys) to fetch documents from data store.

```js

// retrieve document
client.get(["key-1"]);

// save retrieve documents
client.get(["key-1", "key-2"]);

```

##### remove API

**remove** takes a string (key) to delete document from data store.

```js

// delete document
client.remove("key-1");

```



##### removeAll API

**removeAll**  deletes all document from data store.

```js

// delete document
client.removeAll();

```



* Developer notes on [local setup](./docs/local-setup.md)
