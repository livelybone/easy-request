import { RequestResponse } from '../type'

export class BaseEngine<Config, Response> {
  config: Config

  requestInstance: any

  requestTask: any

  response: Response | RequestResponse<null> = {
    url: '',
    data: null,
    statusCode: 0,
    headers: {},
  }

  aborted = false

  constructor(config: Config) {
    this.config = config
  }
}
