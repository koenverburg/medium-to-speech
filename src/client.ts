import Axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'


export class MediumHttpClient {
  private http: AxiosInstance
  private url: string;

  constructor() {
    const config: AxiosRequestConfig = {}
    this.http = Axios.create(config)
  }

  public formatUrl(page: string) {
    if (page.charAt(0) !== '/') {
      page = '/' + page;
    }

    return `${page}${page.indexOf('?') === -1 ? '?' : '&'}format=json`;
  }

  private cleanData(data: any) {
    const substringed = data.substring(data.indexOf('{'))

    return JSON.parse(substringed)
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

  public getArticle(url: string ) {
    this.http.get(url)
      .then(response => {
        console.log(JSON.stringify(this.cleanData(response.data), null, 2));
     }).catch(err => this.handleError(err))
  }

}