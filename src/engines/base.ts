export class BaseEngine<T> {
  config: T

  requestInstance: any

  requestTask: any

  constructor(config: T) {
    this.config = config
  }
}
