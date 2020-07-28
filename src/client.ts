import Axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'

export class MediumHttpClient {
  private http: AxiosInstance
  private url: string;

  constructor() {
    const config: AxiosRequestConfig = {}
    this.http = Axios.create(config)
  }

  public formatUrl(page: string) {
    return `${page}${page.indexOf('?') === -1 ? '?' : '&'}format=json`;
  }

  private cleanData(data: any) {
    return JSON.parse(data.substring(data.indexOf('{')))
  }

  private handleError(err: AxiosError) {
    throw new Error(err.message)
  }

  public async getMediaResource(url: string) {
    return this.http.get(url)
      .then(response => {
        return this.cleanData(response.data)
      }).catch(err => this.handleError(err))
  }

  public async getTweetEmbed(url: string) {
    return this.http.get(url)
      .then(response => {
        console.log(this.cleanData(response.data))
        return { html: ''}
      }).catch(err => this.handleError(err))
  }

  public async getArticle(url: string) {
    try {
      const response = await this.http.get(this.formatUrl(url))
      return this.cleanData(response.data)
    }
    catch (err) {
      return this.handleError(err)
    }
  }
}