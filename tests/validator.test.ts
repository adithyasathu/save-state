import { validate } from "../src/validator";

describe("Validate the documents before saving them to store", () => {

    it("Should be falsy on null", (done) => {

        expect(validate(null)).toBeFalsy();
        done();
    });

    it("Should be falsy on undefined", (done) => {

        expect(validate(undefined)).toBeFalsy();
        done();
    });

    it("Should be falsy on empty object", (done) => {

        expect(validate({})).toBeFalsy();
        done();
    });

    it("Should be falsy on invalid document", (done) => {

        expect(validate({ key: "value" })).toBeFalsy();
        done();
    });

    it("Should be falsy on document with invalid key", (done) => {

        expect(validate({ 2: "value" })).toBeFalsy();
        done();
    });

    it("Should be falsy on document with empty key", (done) => {

        expect(validate({ "": "value" })).toBeFalsy();
        done();
    });

    it("Should be falsy on document with null key", (done) => {

        expect(validate({ null: "value" })).toBeFalsy();
        done();
    });

    it("Should be falsy on document with undefined key", (done) => {

        expect(validate({ undefined: "value" })).toBeFalsy();
        done();
    });

    it("Should be falsy on document with undefined key", (done) => {

        expect(validate({ "   ": "value" })).toBeFalsy();
        done();
    });

    it("Should be truthy on valid document", (done) => {

        expect(validate({ key1: { "doc-1": "value" }} )).toBeTruthy();
        done();
    });

    it("Should be truthy on valid single document", (done) => {

        expect(validate({ key1: { "doc-1": { a: 1 }}} )).toBeTruthy();
        done();
    });

    it("Should be truthy on valid multiple document", (done) => {

        expect(validate({ key1: { "doc-1": { a: 1 }} , key2: { "doc-2": { b: 1, c: 2 } } })).toBeTruthy();
        done();
    });

});
