import { api, APIProvider, BearerJWTAPIProvider, JWTAuthParams, Post } from "../Api"

export class Auth0APIProvider extends BearerJWTAPIProvider {
  constructor(authParams: JWTAuthParams | undefined, private auth0Client: string, private tenant: string) {
    super(authParams)
  }

  baseUrl(): string {
    return `https://${this.auth0Client}-${this.tenant}.us.auth0.com/`
  }
}

const Auth0API = (auth0Client: string, tenant: string) => Post(new Auth0APIProvider(undefined, auth0Client, tenant), "oauth/token")

/*
export const auth0ServerAuth = (audience: string, client_id: string, client_secret: string) =>
  api<any>(Auth0API("alpha"), {
      audience,
      client_id,
      client_secret,
      "grant_type": "client_credentials"
    })

 */