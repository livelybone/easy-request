import { Fetch, FetchDownload, FetchUpload } from './engines/fetch'
import { MY, MYDownload, MYUpload } from './engines/my'
import { WX, WXDownload, WXUpload } from './engines/wx'
import { Xhr, XhrDownload, XhrUpload } from './engines/xhr'
import {
  DownloadEngineConfig,
  EngineName,
  HttpInterceptors,
  RequestConfig,
  RequestData,
  RequestEngine,
  RequestEngineConfig,
  RequestError as $RequestError,
  RequestResponse,
  UploadEngineConfig,
} from './type'
import { getMsg, joinUrl, mergeConfig } from './utils'

export class Http {
  engineName = EngineName.XHR

  config: RequestConfig = {
    baseURL: '',
    method: 'GET',
    timeout: 30000,
    responseType: 'json',
    withCredentials: false,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  }

  interceptors: HttpInterceptors = {
    request: {
      interceptors: [],
      use: cb => {
        this.interceptors.request.interceptors.push(cb)
      },
    },
    response: {
      interceptors: { resolves: [], rejects: [] },
      use: (resCb, errCb) => {
        if (resCb) this.interceptors.response.interceptors.resolves.push(resCb)
        if (errCb) this.interceptors.response.interceptors.rejects.push(errCb)
      },
    },
  }

  constructor(engineName = EngineName.XHR, config?: Partial<RequestConfig>) {
    this.engineName = engineName
    this.config = mergeConfig(this.config, config)
  }

  calcConfig(config?: any) {
    const $config = mergeConfig(this.config, config)
    const $url = joinUrl($config.baseURL, config.url)
    return this.interceptors.request.interceptors.reduce(
      (pre, cb) => pre.then(it => Promise.resolve(cb(it))),
      Promise.resolve({ ...$config, url: $url }),
    )
  }

  getRequestInstance(config: RequestEngineConfig) {
    return this.engineName === EngineName.WX
      ? new WX(config)
      : this.engineName === EngineName.MY
      ? new MY(config)
      : this.engineName === EngineName.Fetch
      ? new Fetch(config)
      : new Xhr(config)
  }

  getDownloadInstance(config: DownloadEngineConfig) {
    return this.engineName === EngineName.WX
      ? new WXDownload(config)
      : this.engineName === EngineName.MY
      ? new MYDownload(config)
      : this.engineName === EngineName.Fetch
      ? new FetchDownload(config)
      : new XhrDownload(config)
  }

  getUploadInstance<T>(config: UploadEngineConfig) {
    return this.engineName === EngineName.WX
      ? new WXUpload<T>(config)
      : this.engineName === EngineName.MY
      ? new MYUpload<T>(config)
      : this.engineName === EngineName.Fetch
      ? new FetchUpload<T>(config)
      : new XhrUpload<T>(config)
  }

  static createError(object: any, request: RequestEngine<any>): $RequestError {
    // eslint-disable-next-line no-shadow
    function RequestError() {}

    let message = getMsg(object)
    if (!message) {
      message = getMsg(object.data, 'Network request error: unknown message!')
    }

    RequestError.prototype = new Error(message)

    // @ts-ignore
    const obj = new RequestError()
    if (typeof object === 'object') {
      Object.keys(object).forEach(k => {
        obj[k] = object[k]
      })
    }
    obj.$request = request
    return obj
  }

  static dealResponse<T extends any>(
    result: T,
    request: any,
  ): T extends { [k in string | number]: any } ? T & { $request: any } : T {
    if (typeof result === 'object' && result !== null) {
      result.$request = request
    }
    return result as any
  }

  checkStatus<T extends { statusCode: number }>(res: T) {
    if (!this.config.statusValidator!(res.statusCode)) {
      return Promise.reject(res)
    }
    return Promise.resolve(res)
  }

  request<T extends any = any>(
    url: string,
    data?: RequestData,
    options?: Partial<RequestConfig>,
  ): Promise<T> {
    const { interceptors } = this.interceptors.response

    return this.calcConfig({ ...options, url, data }).then(config => {
      const request = this.getRequestInstance(config)
      const resolve = (response: any) => {
        return interceptors.resolves.reduce(
          (pre, cb) =>
            pre.then(cb).then(res => Http.dealResponse(res, request)),
          Promise.resolve(
            this.checkStatus(Http.dealResponse(response, request)),
          ),
        )
      }
      const reject = (e: any) => {
        return interceptors.rejects
          .reduce(
            (pre, cb) =>
              pre
                .then(res => Promise.reject(res))
                .catch(result => cb(Http.createError(result, request))),
            Promise.resolve(Http.createError(e, request)),
          )
          .then(res => Promise.reject(res))
      }
      return request
        .open()
        .then(resolve)
        .catch(reject) as any
    })
  }

  /**
   * 对应微信/支付宝小程序的 downloadFile
   * */
  downloadFile(
    options: Partial<DownloadEngineConfig> & Pick<DownloadEngineConfig, 'url'>,
  ) {
    return this.calcConfig(options).then(config => {
      const request = this.getDownloadInstance(config)
      return request
        .open()
        .then(res => this.checkStatus(Http.dealResponse(res, request)))
        .catch(e => {
          e.$request = request
          return Promise.reject(e)
        })
    })
  }

  /**
   * 对应微信/支付宝小程序的 uploadFile
   * */
  uploadFile<T extends any = any>(
    options: Partial<UploadEngineConfig> &
      Pick<UploadEngineConfig, 'url' | 'file' | 'fileKey'>,
  ) {
    return this.calcConfig(options).then(config => {
      const request = this.getUploadInstance<T>(config)
      return (request.open() as Promise<RequestResponse<T>>)
        .then(res => this.checkStatus(Http.dealResponse(res, request)))
        .catch(e => {
          e.$request = request
          return Promise.reject(e)
        })
    })
  }

  get<T extends any = any>(
    url: string,
    data?: RequestData,
    options?: Partial<
      Pick<RequestConfig, Exclude<keyof RequestConfig, 'method'>>
    >,
  ) {
    return this.request<T>(url, data, { ...options, method: 'get' })
  }

  post<T extends any = any>(
    url: string,
    data?: RequestData,
    options?: Partial<
      Pick<RequestConfig, Exclude<keyof RequestConfig, 'method'>>
    >,
  ) {
    return this.request<T>(url, data, { ...options, method: 'post' })
  }

  put<T extends any = any>(
    url: string,
    data?: RequestData,
    options?: Partial<
      Pick<RequestConfig, Exclude<keyof RequestConfig, 'method'>>
    >,
  ) {
    return this.request<T>(url, data, { ...options, method: 'put' })
  }

  delete<T extends any = any>(
    url: string,
    data?: RequestData,
    options?: Partial<
      Pick<RequestConfig, Exclude<keyof RequestConfig, 'method'>>
    >,
  ) {
    return this.request<T>(url, data, { ...options, method: 'delete' })
  }
}
