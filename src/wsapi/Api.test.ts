import { api, APIFailedResponse, APIProvider, APIRequest, Get, Post, withValidator } from "./Api";
import {jsonEndpoint, makeUrlParams} from './Api';
import { z, ZodError } from "zod"

test('Make a single param', () => {
    expect(makeUrlParams({"key": "value"})).toEqual("key=value");
})

test('Make multiple params', () => {
    expect(makeUrlParams({"key1": "value1", "key2": "value2"})).toEqual("key1=value1&key2=value2");
})

test('Encode params', () => {
    expect(makeUrlParams({"key": "value/bar"})).toEqual("key=value%2Fbar");
})

const jsonRequest = (method: string, url: string): APIRequest => ({
    url: url,
    init: {
        method: method
    },
    headers: new Headers(),
    contentType: "application/json",
    settings: {parseDates: true}
})

const jsonPost = (url: string): APIRequest => jsonRequest('post', url)
const jsonGet = (url: string): APIRequest => jsonRequest('get', url)

test('perform get with no params should function and return a response', async () => {
    await jsonEndpoint<any>(jsonGet(
            "https://httpbingo.org/get")).then(x => {
            expect(x.url).toBe("https://httpbingo.org/get");
        });
})

class BingoProvider extends APIProvider {
    baseUrl = () => "https://httpbingo.org/"

    authHeaders = (): Headers => new Headers()
    baseParams = () => ({})
}

class BingoParamsProvider extends APIProvider {
    baseUrl = () => "https://httpbingo.org/"

    authHeaders = (): Headers => new Headers()
    baseParams = () => ({foo: "bar"})
}

test('perform post with params to bingo should echo them back', async () => {
    await api<any>(Post(new BingoProvider(), "post"), {"key": "value"}).then(x => {
            expect(x.url).toBe("https://httpbingo.org/post");
            expect(x.data).toStrictEqual({"key":"value"})
        });
})
test('perform post with params using a validator should echo them back and validate', async () => {

    const def = Post(new BingoProvider(), "post", z.object({
        "key": z.string()
    }))

    await api<any>(def, {"key": "value"}).then(x => {
            //expect(x.data.url).toBe("https://httpbingo.org/post?");
            expect(x.data).toEqual({"key":"value"})
        });
})

test('perform post with params adding a validator withValdiator should echo them back and validate', async () => {

    let def = Post(new BingoProvider(), "post")

    def = withValidator(def, z.object({
        "key": z.string()
    }))

    await api<any>(def, {"key": "value"}).then(x => {
        //expect(x.data.url).toBe("https://httpbingo.org/post?");
        expect(x.data).toEqual({"key":"value"})
    });
})

test('perform post with params using a validator that fails should return an error', async () => {

    const def = Post(new BingoProvider(), "post", z.object({
        "key": z.string(),
        "other": z.string()
    }).strict())

    await api<any>(def, {"key": "value"}).then(x => {
        //expect(x.data.url).toBe("https://httpbingo.org/post?");
        throw new Error("Should fail validation, but didn't")
    }).catch(err => {
        expect(err.error).toBeInstanceOf(ZodError)
        expect((err.error as ZodError).issues[0].code).toBe("invalid_type")
    });
})

/* This doesn't work because the API caller assumes the input will always be an object
test("perform a post with params using an array validator that succeeds", async () => {
    const def = Post(new BingoProvider(), "post", z.object({"key": z.string(), "other": z.string()}).array())

    await api<any>(def, [{"key": "value"}]).then(x => {
        expect(x.data[0]).toEqual({"key":"value"})
    }).catch(err => {
        throw new Error("Failed " + err.toString())
    })
})

 */

test("perform get with params as data and have them echo back", async () => {
    const def = Get(new BingoProvider(), "get")

    await api<any>(def, {"key": ["value"]}).then(x => {
        expect(x.data.args).toEqual({"key":["value"]})
        expect(x.successful).toBeTruthy()
    }).catch(err => {
        throw new Error("Failed " + err)
    })
})

test("perform a get with an auth provider that has params", async() => {
    const def = Get(new BingoParamsProvider(), "get")

    await api<any>(def, {}).then(x => {
        expect(x.data.args).toEqual({"foo":["bar"]})
        expect(x.successful).toBeTruthy()
    }).catch(err => {
        throw new Error("Failed " + err)
    })
})
test("perform a post with an auth provider that has params", async() => {
    const def = Post(new BingoParamsProvider(), "post")

    await api<any>(def, {}).then(x => {
        expect(x.data).toEqual({"foo": "bar"})
        expect(x.successful).toBeTruthy()
    }).catch(err => {
        throw new Error("Failed " + err)
    })
})

test("preform a request getting a 204 show work", async () => {
    await api<any>(Post(new BingoProvider(), "status/204")).then(x => {
        expect(x.data).toStrictEqual({})
        expect(x.successful).toBeTruthy()
    }).catch((err: APIFailedResponse<any>) => {
        expect(err).toBeUndefined()
    })
})

/*
test("preform a request getting a 201 show work", async () => {
    await api<any>(Post(new BingoProvider(), "status/201"), {"key": "value"}).then(x => {
        expect(x.data).toStrictEqual({})
    }).catch((err: APIFailedResponse<any>) => {
        expect(err).toBeUndefined()
    })
})

 */

test('perform a request getting a 500 should fail', async () => {
    await api<any>(Post(new BingoProvider(), "status/500"), {"key": "value"}).then(x => {
        throw new Error("Should have failed")
    }).catch((err: APIFailedResponse<any>) => {
        expect(err.method).toBe("POST")
        expect(err.httpStatus).toBe(500)
        expect(err.successful).toBeFalsy()
        expect(err.errorMessage).toBe("Internal Server Error")
    });
})

test('perform a request getting a 403 should fail', async () => {
    await api<any>(Post(new BingoProvider(), "status/403"), {"key": "value"}).then(x => {
        throw new Error("Should have failed")
    }).catch((err: APIFailedResponse<any>) => {
        expect(err.method).toBe("POST")
        expect(err.httpStatus).toBe(403)
        expect(err.errorMessage).toBe("Forbidden for this user")
        expect(err.successful).toBeFalsy()
    });
})

test('perform a request getting a 401 should fail', async () => {
    await api<any>(Post(new BingoProvider(), "status/401"), {"key": "value"}).then(x => {
        throw new Error("Should have failed")
    }).catch((err: APIFailedResponse<any>) => {
        expect(err.method).toBe("POST")
        expect(err.httpStatus).toBe(401)
        expect(err.errorMessage).toBe("Unauthorized for this user")
        expect(err.successful).toBeFalsy()
    });
})
test('perform a request getting a 400 should fail', async () => {
    await api<any>(Get(new BingoProvider(), "status/400")).then(x => {
        throw new Error("Should have failed")
    }).catch((err: APIFailedResponse<any>) => {
        expect(err.method).toBe("GET")
        expect(err.httpStatus).toBe(400)
        expect(err.errorMessage).toStrictEqual("Bad Request")
        expect(err.successful).toBeFalsy()
    });
})
test('perform a request getting a 400 should fail with body', async () => {
    await api<any>(Post(new BingoProvider(), "status/400"), {"foo":"bar"}).then(x => {
        throw new Error("Should have failed")
    }).catch((err: APIFailedResponse<any>) => {
        expect(err.method).toBe("POST")
        expect(err.httpStatus).toBe(400)
        expect(err.errorMessage).toStrictEqual("Bad Request")
        expect(err.successful).toBeFalsy()
    });
})
