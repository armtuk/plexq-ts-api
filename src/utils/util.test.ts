import { sum, isBlank, setFromStringPath, setListFromStringPath, olderDate, scrubLogObject } from "./util";

test('test a present string for blank should not be blank', () => {
    expect(isBlank("foo")).toEqual(false);
})

test('test an undefined string for blank should be blank', () => {
    expect(isBlank(undefined)).toEqual(true);
})

test('test an empty string for blank should be blank', () => {
    expect(isBlank("")).toEqual(true);
})

test('test an string with only whitespace for blank should be blank', () => {
    expect(isBlank("  ")).toEqual(true);
})

test("test setting a property from a simple path", () => {
    expect(setFromStringPath({}, "name", "value")).toEqual({"name": "value"})
})

test("test setting a property from a compound path", () => {
    expect(setFromStringPath({}, "name.thing", "value")).toEqual({"name": {"thing": "value"}})
})

test("test setting a property from a compound path on a pre-existing path", () => {
    expect(setFromStringPath({"name": {"foo": "bar"}}, "name.thing", "value")).toEqual({"name": {"foo": "bar", "thing": "value"}})
})

test("test setting a multi-property from a simple path", () => {
    const obj = {}

    expect(setListFromStringPath(obj, "name", "value")).toEqual({"name": ["value"]})

    expect(setListFromStringPath(obj, "name", "value")).toEqual({"name": ["value", "value"]})

    expect(setListFromStringPath(obj, "name", "value")).toEqual({"name": ["value", "value", "value"]})
})

test("test setting a property from an array path", () => {
    expect(setFromStringPath({}, "name.0", "value")).toEqual({"name": ["value"]})
})

test("test sum of empty array should produce 0", () => {
    expect(sum([])).toEqual(0)
})

test("test sum of numeric array should produce value", () => {
    expect(sum([1, 2, 3])).toEqual(6)
})

test("test sum of undefined should product 0", () => {
    expect(sum(undefined)).toEqual(0)
})

test("test an older date for two dates should return the older", () => {
    expect(olderDate(new Date("2000-01-01"), new Date("2001-02-02"))).toEqual(new Date("2000-01-01"))
})

test("test an older date for one dates and one undefined should return the defined", () => {
    expect(olderDate(new Date("2000-01-01"), undefined)).toEqual(new Date("2000-01-01"))
    expect(olderDate(undefined, new Date("2000-01-01") )).toEqual(new Date("2000-01-01"))
})

test("test an older date for two undefined should return the undefined", () => {
    expect(olderDate(undefined, undefined)).toEqual(undefined)
})

/*
test("scrub log entires object should scrub password from an object", () => {
    expect(scrubLogObject({"password":"foo"})).toEqual({"password":"*********"})
    expect(scrubLogObject({data:{"password":"foo"}})).toEqual({data:{"password":"*********"}})
    expect(scrubLogObject({data:{deep:{"password":"foo"}}})).toEqual({data:{deep:{"password":"*********"}}})
})

 */
