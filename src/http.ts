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
  DownloadResponse,
} from './type'
import { getMsg, joinUrl, mergeConfig, RequestPromise } from './utils'

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
    let $config = mergeConfig(this.config, config)
    const $url = joinUrl($config.baseURL, config.url)
    let abort: () => void = () => {}
    const conf = new Promise<any>((res, rej) => {
      this.interceptors.request.interceptors
        .reduce((pre, cb) => {
          return pre.then(it => {
            $config = it
            return Promise.resolve(cb(it))
          })
        }, Promise.resolve({ ...$config, url: $url }))
        .then(res)
      abort = () =>
        rej(
          Http.createError(
            {
              $request: {
                config: $config,
                name: this.engineName,
                requestInstance: null,
                requestTask: null,
                response: null,
                aborted: true,
              },
              data: null,
              statusCode: 0,
              url: $url,
              headers: {},
            },
            undefined,
            'Request aborted while processing configuration',
          ),
        )
    })
    return { config: conf, abort }
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

  static createError(
    object: any,
    request?: RequestEngine<any>,
    msg?: string,
  ): $RequestError {
    // eslint-disable-next-line no-shadow
    function RequestError() {}

    let message = getMsg(object)
    if (!message) {
      message = getMsg(
        object.data,
        msg ||
          (request && request.aborted
            ? 'Request aborted'
            : 'Network request error: unknown message!'),
      )
    }

    RequestError.prototype = new Error(message)

    // @ts-ignore
    const obj = new RequestError()
    if (typeof object === 'object') {
      Object.keys(object).forEach(k => {
        obj[k] = object[k]
      })
    }
    if (request) obj.$request = request
    return obj
  }

  static dealResponse<T extends any>(
    result: T,
    request: any,
  ): T extends { [k in string | number]: any } ? T & { $request: any } : T {
    if (typeof result === 'object' && result !== null) {
      ;(result as any).$request = request
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
  ) {
    const { interceptors } = this.interceptors.response

    const { config: conf, abort } = this.calcConfig({ ...options, url, data })
    let $res: any
    let $rej: any
    const req: RequestPromise<T> = new RequestPromise((res, rej) => {
      $res = res
      $rej = rej
    }) as any
    req.abort = abort

    conf
      .then(config => {
        const request = this.getRequestInstance(config)
        req.abort = () => {
          request.abort()
          request.aborted = true
        }

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
        request
          .open()
          .then(resolve)
          .then($res)
          .catch(reject)
          .catch($rej)
      })
      .catch($rej)
    return req
  }

  /**
   * 对应微信/支付宝小程序的 downloadFile
   * */
  downloadFile(
    options: Partial<DownloadEngineConfig> & Pick<DownloadEngineConfig, 'url'>,
  ) {
    const { config: conf, abort } = this.calcConfig(options)
    let $res: any
    let $rej: any
    const req: RequestPromise<DownloadResponse & {
      $request: any
    }> = new RequestPromise((res, rej) => {
      $res = res
      $rej = rej
    }) as any
    req.abort = abort

    conf
      .then(config => {
        const request = this.getDownloadInstance(config)
        req.abort = () => {
          request.abort()
          request.aborted = true
        }

        request
          .open()
          .then(res => this.checkStatus(Http.dealResponse(res, request)))
          .then($res)
          .catch(e => {
            e.$request = request
            return Promise.reject(e)
          })
          .catch($rej)
      })
      .catch($rej)
    return req
  }

  /**
   * 对应微信/支付宝小程序的 uploadFile
   * */
  uploadFile<T extends any = any>(
    options: Partial<UploadEngineConfig> &
      Pick<UploadEngineConfig, 'url' | 'file' | 'fileKey'>,
  ) {
    const { config: conf, abort } = this.calcConfig(options)
    let $res: any
    let $rej: any
    const req: RequestPromise<RequestResponse<T> & {
      $request: any
    }> = new RequestPromise((res, rej) => {
      $res = res
      $rej = rej
    }) as any
    req.abort = abort

    conf
      .then(config => {
        const request = this.getUploadInstance<T>(config)
        req.abort = () => {
          request.abort()
          request.aborted = true
        }
        ;(request.open() as Promise<RequestResponse<T>>)
          .then(res => this.checkStatus(Http.dealResponse(res, request)))
          .then($res)
          .catch(e => {
            e.$request = request
            return Promise.reject(e)
          })
          .catch($rej)
      })
      .catch($rej)
    return req
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
