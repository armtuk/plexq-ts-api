import { OAuthAPIProvider } from "../OAuthAPIProvider"

export class ZoomOAuthAPIProvider extends OAuthAPIProvider {
  baseUrl = () => "https://zoom.us/oauth"

  authorizeUrl(): string {
    return this.baseUrl() + "/authorize"
  }

  tokenUrl(): string {
    return this.baseUrl() + "/token"
  }


}