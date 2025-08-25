import { APIProvider } from "../Api"
import { undefined } from "zod"


export abstract class OAuthAPIProvider extends APIProvider {

  abstract authorizeUrl(): string
  abstract tokenUrl(): string

  authHeaders(): Headers {
    return new Headers()
  }

  baseParams(): any {
  }

  baseUrl(): string {
    return ""
  }

}