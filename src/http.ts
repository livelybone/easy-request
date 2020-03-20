import { Fetch, FetchDownload, FetchUpload } from './engines/fetch'
import { MY, MYDownload, MYUpload } from './engines/my'
import { WX, WXDownload, WXUpload } from './engines/wx'
import { Xhr, XhrDownload, XhrUpload } from './engines/xhr'
import {
  DownloadFileConfig,
  Env,
  HttpConfig,
  HttpEngineConfig,
  HttpInterceptors,
  ProgressHandler,
  RequestData,
  UploadFileConfig,
} from './type'
import { joinUrl } from './utils'

function mergeConfig<T1 extends HttpConfig, T2 extends any>(
  conf1: T1,
  conf2?: T2,
): any {
  const config = !conf2
    ? conf1
    : {
        ...conf1,
        ...conf2,
        headers: {
          ...conf1.headers,
          ...conf2.headers,
        },
      }
  config.method = config.method.toUpperCase()
  return config
}

export class Http {
  env: Env = 'h5'

  config: HttpConfig = {
    baseURL: '',
    method: 'GET',
    timeout: 30000,
    responseType: 'json',
    withCredentials: false,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
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
        this.interceptors.response.interceptors.resolves.push(resCb)
        this.interceptors.response.interceptors.rejects.push(errCb)
      },
    },
  }

  constructor(env: Env = 'h5', config?: Partial<HttpConfig>) {
    this.env = env
    this.config = mergeConfig(this.config, config)
  }

  calcConfig(config?: any) {
    const $config = mergeConfig(this.config, config)
    const $url = joinUrl($config.baseURL, config.url)
    return this.interceptors.request.interceptors.reduce((pre, cb) => cb(pre), {
      ...$config,
      url: $url,
    })
  }

  getRequestInstance(config: HttpEngineConfig) {
    return this.env === 'weapp'
      ? new WX(config)
      : this.env === 'aliapp'
      ? new MY(config)
      : this.env === 'fetch'
      ? new Fetch(config)
      : new Xhr(config)
  }

  getDownloadInstance(config: DownloadFileConfig) {
    return this.env === 'weapp'
      ? new WXDownload(config)
      : this.env === 'aliapp'
      ? new MYDownload(config)
      : this.env === 'fetch'
      ? new FetchDownload(config)
      : new XhrDownload(config)
  }

  getUploadInstance(config: UploadFileConfig) {
    return this.env === 'weapp'
      ? new WXUpload(config)
      : this.env === 'aliapp'
      ? new MYUpload(config)
      : this.env === 'fetch'
      ? new FetchUpload(config)
      : new XhrUpload(config)
  }

  request<T = any>(
    url: string,
    data?: RequestData,
    options?: Partial<HttpConfig>,
  ) {
    const { interceptors } = this.interceptors.response
    const config = this.calcConfig({ ...options, url, data })

    return new Promise<T>((res, rej) => {
      const request = this.getRequestInstance(config)
      const resolve = (response: any) =>
        res(
          interceptors.resolves.reduce(
            (pre, cb) =>
              pre.then(result => {
                if (typeof result === 'object') {
                  return cb({ ...result, $request: request })
                }
                return cb(result)
              }),
            Promise.resolve({ ...response, $request: request }),
          ),
        )
      const reject = (e: any) => {
        // @ts-ignore
        e.$request = request
        return rej(
          interceptors.rejects.reduce(
            (pre, cb) =>
              pre.then(result => {
                if (typeof result === 'object') {
                  // @ts-ignore
                  result.$request = request
                }
                return cb(result as any)
              }),
            Promise.resolve(e),
          ),
        )
      }
      request
        .open()
        .then(resolve)
        .catch(reject)
    })
  }

  /**
   * 对应微信/支付宝小程序的 downloadFile
   * */
  downloadFile(
    options: Partial<DownloadFileConfig> &
      Pick<DownloadFileConfig, 'url'> & {
        onDownloadProgress?: ProgressHandler
      },
  ) {
    const config = this.calcConfig(options)
    const request = this.getDownloadInstance(config)
    return request
      .open(options.onDownloadProgress)
      .then(res => ({ ...res, $request: request }))
      .catch(e => {
        e.$request = request
        return Promise.reject(e)
      })
  }

  /**
   * 对应微信/支付宝小程序的 uploadFile
   * */
  uploadFile(
    options: Partial<UploadFileConfig> &
      Pick<UploadFileConfig, 'url' | 'file' | 'fileKey'> & {
        onUploadProgress?: ProgressHandler
      },
  ) {
    const config = this.calcConfig(options)
    const request = this.getUploadInstance(config)
    return request
      .open(options.onUploadProgress)
      .then(res => ({ ...res, $request: request }))
      .catch(e => {
        e.$request = request
        return Promise.reject(e)
      })
  }

  get<T>(
    url: string,
    data?: RequestData,
    options?: Partial<Pick<HttpConfig, Exclude<keyof HttpConfig, 'method'>>>,
  ) {
    return this.request<T>(url, data, { ...options, method: 'get' })
  }

  post<T>(
    url: string,
    data?: RequestData,
    options?: Partial<Pick<HttpConfig, Exclude<keyof HttpConfig, 'method'>>>,
  ) {
    return this.request<T>(url, data, { ...options, method: 'post' })
  }

  put<T>(
    url: string,
    data?: RequestData,
    options?: Partial<Pick<HttpConfig, Exclude<keyof HttpConfig, 'method'>>>,
  ) {
    return this.request<T>(url, data, { ...options, method: 'put' })
  }

  delete<T>(
    url: string,
    data?: RequestData,
    options?: Partial<Pick<HttpConfig, Exclude<keyof HttpConfig, 'method'>>>,
  ) {
    return this.request<T>(url, data, { ...options, method: 'delete' })
  }
}
