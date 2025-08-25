import { AnyZodObject, ZodArray, ZodError } from "zod";

export class API {
  static debug = false
}

export type APIContentType = "application/json" | "application/x-www-form-urlencoded" | "multipart/form-data"

export type EmptyObject = {}

export type JWTAuthParams = {
  jwtToken?: string
}

export type APIValidator = AnyZodObject | ZodArray<AnyZodObject>
export enum BodyMethod { post = "POST", put = "PUT", delete = "DELETE", get = "GET", patch = "PATCH" }

export type APISettings = {
  parseDates: boolean
}

export interface APIRequest {
  url: string
  init: {
    method: string,
    body?: string
  },
  headers: Headers,
  contentType: string
  validator?: APIValidator | undefined,
  settings: APISettings
}

export abstract class APIProvider {
  abstract baseUrl(): string
  abstract baseParams(): any
  abstract authHeaders(): Headers
  settings: APISettings = {parseDates: true}
}

export abstract class BearerJWTAPIProvider extends APIProvider {
  userAuthParams: JWTAuthParams | undefined
  constructor(userAuthParams: JWTAuthParams | undefined) {
    super()
    this.userAuthParams = userAuthParams
  }
  //@ts-ignore
  baseParams = () => ({});
  authHeaders = () => this.userAuthParams ? new Headers({Authorization: "Bearer " + this.userAuthParams?.jwtToken})
    : new Headers()
}


export interface APIValidatedDefinition {
  provider: APIProvider
  location: string
  method: BodyMethod
  validator: APIValidator
}

export interface APIDefinition {
  provider: APIProvider
  location: string
  method: BodyMethod
  validator?: APIValidator
}


export interface APISuccessResponse<T> {
  successful: true
  method: string
  httpStatus: number
  url: string
  headers?: Headers
  data: T
}

export interface APIFailedResponse<T> {
  successful: false
  errorMessage: string
  error: any | undefined
  method: string
  httpStatus: number
  url: string
  headers?: Headers
}

export type  APIResponse<T> = APISuccessResponse<T> | APIFailedResponse<T>;

type QueryParameters = Record<string, string>

type APICall = (provider: APIProvider, location: string, validator?: APIValidator, secure?: boolean) => APIDefinition

export const withValidator = (def: APIDefinition, validator: APIValidator) => ({...def, validator: validator} as APIValidatedDefinition)

export const Get: APICall = (provider: APIProvider, location: string, validator?: APIValidator, secure?: boolean) => ({provider, location, method: BodyMethod.get, validator, secureContent: !!secure} as APIDefinition)
export const Put: APICall = (provider: APIProvider, location: string, validator?: APIValidator, secure?: boolean) => ({provider, location, method: BodyMethod.put, validator, secureContent: !!secure} as APIDefinition)
export const Post: APICall = (provider: APIProvider, location: string, validator?: APIValidator, secure?: boolean) => ({provider, location, method: BodyMethod.post, validator, secureContent: !!secure} as APIDefinition)
export const Delete: APICall = (provider: APIProvider, location: string, validator?: APIValidator, secure?: boolean) => ({provider, location, method: BodyMethod.delete, validator, secureContent: !!secure} as APIDefinition)
export const Patch: APICall = (provider: APIProvider, location: string, validator?: APIValidator, secure?: boolean) => ({provider, location, method: BodyMethod.patch, validator, secureContent: !!secure} as APIDefinition)

export const makeUrlParams = (data: QueryParameters) => Object.keys(data).reduce((acc: string, e: string) =>
    acc + "&" + encodeURIComponent(e) + "=" + encodeURIComponent(data[e] as string)
  , "").substr(1);


export const jsonPostEndpoint = <T>(req: APIRequest, body: string): Promise<APIResponse<T>> =>
  jsonEndpoint({
    ...req,
    init: {
      ...req.init,
      body: body
    }
  })

// This is APISuccessResponse because a failure throws the promise to reject()
export function jsonEndpoint<T>(req: APIRequest): Promise<APISuccessResponse<T>> {
  //debug && console.log("jsonEndpoint", req)
  try {
    console.log("Fetching from", req)

    const headers = new Headers({"Content-Type": req.contentType, ...Object.fromEntries(req.headers.entries())})

    const j: Promise<APISuccessResponse<T>> = fetch(req.url, {
        ...req.init,
        headers
      }
    ).then<APISuccessResponse<T>>(resp => {
      API.debug && console.log(resp)

      if (resp.status === 204) {
        return Promise.resolve(apiSuccess(req.init.method, req.url, {} as T, resp.headers, resp.status))
      }

      if (resp.ok) {
        const k = resp.json().then<APISuccessResponse<T>>((x: any) => {

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const result: any = apiResultParse(req.settings, x)

          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const dataBlock = result.json || result.data || result.Data || result

          if (req.validator) {
            try {
              return apiSuccess<T>(req.init.method, req.url, req.validator.parse(dataBlock) as T, resp.headers, resp.status)
            }
            catch (err) {
               if (err instanceof ZodError) {
                 API.debug && console.log("Validation failed for " + req.url, err)
                 return apiFailed(req, resp, "Validation failed", err)
               }
               else {
                 throw err
               }
            }
          }
          else {
            return apiSuccess<T>(req.init.method, req.url, dataBlock as T, resp.headers, resp.status)
          }
        }).catch(x => {
          API.debug && console.log("Api Call failed, failed to handle response" , x)
          return apiFailed<T>(req, resp, "Failed to handle API Response", x)
        })

        return k
      } else {
        switch (resp.status) {
          case 400:
            return handleError<T>(req, resp, "Bad Request")
          case 401:
            return handleError<T>(req,resp, "Unauthorized for this user")
          case 403:
              return handleError<T>(req, resp, "Forbidden for this user")
          case 500:
              return handleError<T>(req, resp, "Internal Server Error")
          case 404:
              return handleError<T>(req, resp, "Not Found")
          default:
            console.log("Failed call with response", resp.status)
            return apiFailed<T>(req, resp, "Failed call with response " + resp.status, {})
        }
      }
    }).catch(err => {
      if (err.httpStatus) {
        return new Promise<APISuccessResponse<T>>((resolve, reject) => reject(err))
      }
      API.debug && console.log("With request", req)
      return apiFailed(req, undefined, "API Call failed", err)
    })

    return j
  } catch (e) {
    if (API.debug) {
      console.log("Whilst calling", req)
      console.log("Api Failed", e)
    }
    return apiFailed<T>(req, undefined, "Exception thrown during jsonEndpoint call", e)
  }
}

const handleError = <T,>(req: APIRequest, resp: Response, msg: string): Promise<APISuccessResponse<T>> => {
  if (resp.headers.get("content-type") === "application/json") {
    return handleJsonError<T>(req, resp, msg)
  }
  else {
    return handleTextError<T>(req, resp, msg)
  }
}

const handleJsonError = <T,>(req: APIRequest, resp: Response, msg: string) => {
  return resp.json().then((err: any) => {
    console.log(msg, err)
    return apiFailed<T>(req, resp, msg, err)
  }).catch(err => {
    console.log("Forbidden for this user")
    return apiFailed<T>(req, resp, msg, {})
  })

}

const handleTextError = <T,>(req: APIRequest, resp: Response, msg: string) => {
  return resp.text().then(err => {
    console.log(msg, err)
    return apiFailed<T>(req, resp, msg, err)
  }).catch(err => {
    console.log(msg)
    return apiFailed<T>(req, resp, msg, {})
  })
}

const apiFailed = <T>(req: APIRequest, resp: Response | undefined, errorMessage: string, err: any): Promise<APISuccessResponse<T>> => {
  API.debug && console.log(`API Result Failed for ${req.url || 'unknown'}`, err);
  if (err.hasOwnProperty("successful")) return new Promise<APISuccessResponse<T>>((resolve, reject) => reject(err))

  return new Promise<APISuccessResponse<T>>((resolve, reject) => reject({
    successful: false,
    method: req.init.method,
    httpStatus: resp?.status || 0,
    url: req.url,
    errorMessage: errorMessage,
    error: err,
    headers: req.headers
  }))
}

// any field with "date" or "time" will be treated as a Date() object, unless it's plurazized or booleanish with a "use" prefix.
// pretty hacky - but good enough
export const isDateTimeFieldName = (key: string) =>
  ((key.toLowerCase().includes("date") || (key.toLocaleLowerCase().includes("time") && !key.toLocaleLowerCase().includes("timezone")))
    && !key.startsWith("use") && !key.endsWith("s"))
  || key.toLowerCase().endsWith("start")
  || key.toLowerCase().endsWith("end")
  || key.toLowerCase().endsWith("_at")

export const isBooleanField = (key: string) =>
  (key.toLowerCase().startsWith("use") || key.toLowerCase().endsWith("flag"))

export const apiResultParse = (settings: APISettings, data: any): any => {
  if (Array.isArray(data)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data.map(x => apiResultParse(settings, x))
  } else if (typeof (data) === "object" && data !== null && data !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return (Array.from(Object.entries(data)).map(e => {
      const key = e[0]
      const value = e[1]

      if (typeof (value) === "object" && value !== null && value !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return [key, apiResultParse(settings, value)]
      } else if (isDateTimeFieldName(key) && typeof(value) === "string" && settings.parseDates) {
        const dateValue = Date.parse(value)
        if (!isNaN(dateValue))
          return [key, new Date(dateValue)]
        else
          return [key, undefined]
      } else return [key, value]
    }).reduce((a, b) => ({...a, [b[0]]: b[1]}), {}))
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data;
  }
}

const apiSuccess: <T>(method: string, url: string, data: T, headers: Headers, httpStatus: number) => APISuccessResponse<T> = <T>(method: string, url: string, data: T, headers: Headers, httpStatus: number) =>
  ({successful: true, method, httpStatus, url, data, headers})

export const api = <T>(apiDef: APIDefinition, data?: any, contentType?: APIContentType | undefined): Promise<APISuccessResponse<T>>  => {
  const adds = (apiDef.location.includes("?") ? "&" : "?")

  // Some APIs like to mix body data and API config params like outputtype and auth
  const enhancedData = {...data, ...apiDef.provider.baseParams()}

  const mkUrl = () => {
    const base = (apiDef.location.indexOf("http") === -1 ? apiDef.provider.baseUrl() : "") + encodeURI(apiDef.location)

    // If the method is a get, use data to construct URL params
    if (apiDef.method === BodyMethod.get) {
      return base + adds + makeUrlParams(enhancedData)
    }
    else {
      return base
    }
  }

  const url = mkUrl()
  //debug && console.log("Requesting API", apiDef, url, userAuthParams)


  const mkInit = (contentType: APIContentType | undefined) => {
    if (contentType === "application/x-www-form-urlencoded" || contentType === "multipart/form-data") {
      return {
        method: apiDef.method,
        ...(apiDef.method !== BodyMethod.get ? {body: enhancedData} : {})
      }
    }
    else {
      return {
        method: apiDef.method,
        ...(apiDef.method !== BodyMethod.get ? {body: JSON.stringify(enhancedData)} : {})
      }
    }
  }

  return jsonEndpoint<T>({
    url: url,
    init: mkInit(contentType),
    validator: apiDef.validator,
    headers: apiDef.provider.authHeaders(),
    contentType: contentType || "application/json",
    settings: apiDef.provider.settings
  })
}