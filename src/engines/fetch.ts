/**
 * fetch api, for browser/RN-App
 * */
import {
  DownloadEngineConfig,
  DownloadResponse,
  EngineName,
  RequestEngine,
  RequestEngineConfig,
  RequestResponse,
  UploadEngineConfig,
} from '../type'
import { dealRequestData, getBlobUrl, joinUrl } from '../utils'
import { BaseEngine } from './base'

declare const fetch: any
declare const AbortController: any

function getOptions(config: any, requestTask: any) {
  const options: any = {
    url: config.url,
    method: config.method.toUpperCase(),
    headers: config.headers,
    header: config.headers,
    signal: requestTask && requestTask.signal,
    mode: config.mode || ('cors' as 'cors' | 'no-cors' | 'same-origin'),
    credentials: (config.withCredentials ? 'include' : 'omit') as
      | 'include'
      | 'omit'
      | 'same-origin',
    redirect: config.redirect || ('follow' as 'follow' | 'error'),
    cache: 'default' as
      | 'default'
      | 'no-cache'
      | 'reload'
      | 'force-cache'
      | 'only-if-cached',
    referrer: 'no-referrer' as 'client' | 'no-referrer',
  }
  if (['GET', 'HEAD'].includes(options.method)) {
    delete config.headers['Content-Type']
    options.url = joinUrl('/', config.url, config.data)
  } else {
    const contentType = config.headers['Content-Type']
    options.body = dealRequestData(
      config.data,
      contentType,
      config.convertFormDataOptions,
    )
    if (contentType === 'multipart/form-data' || !options.body) {
      delete config.headers['Content-Type']
    }
  }
  return options
}

export class FetchBase<Config, Response> extends BaseEngine<Config, Response> {
  name = EngineName.Fetch

  constructor(config: Config) {
    super(config)
    if (fetch) this.requestInstance = (...args: any[]) => fetch(...args)
    if (AbortController) this.requestTask = new AbortController()
  }

  abort(): void {
    if (!this.requestTask) {
      throw new Error('AbortController api does not exist!')
    }
    this.requestTask.abort()
  }

  getConfig() {
    return getOptions(this.config, this.requestTask)
  }
}

export class Fetch<T> extends FetchBase<RequestEngineConfig, RequestResponse<T>>
  implements RequestEngine<RequestEngineConfig, RequestResponse<T>> {
  open() {
    if (!this.requestInstance) {
      return Promise.reject(
        new Error('fetch api does not exist, please check the environment!'),
      )
    }

    const { url, ...config } = this.getConfig()
    return this.requestInstance(url, config).then((response: any) => {
      this.response = {
        url: response.url || url,
        statusCode: response.status,
        headers: response.headers,
        data: null,
      }
      const { responseType } = this.config
      return Promise.resolve(
        responseType === 'blob'
          ? response.blob()
          : responseType === 'json'
          ? response.json()
          : responseType === 'arraybuffer'
          ? response.arrayBuffer()
          : response.text(),
      ).then(data => {
        this.response.data = data
        return this.response
      })
    }) as Promise<RequestResponse<T>>
  }
}

export class FetchDownload
  extends FetchBase<DownloadEngineConfig, DownloadResponse>
  implements RequestEngine<DownloadEngineConfig, DownloadResponse> {
  open() {
    if (!this.requestInstance) {
      return Promise.reject(
        new Error('fetch api does not exist, please check the environment!'),
      )
    }

    if (this.config.onDownloadProgress) {
      console.warn(new Error('Download progress does not support yet in fetch'))
    }

    const { url, ...config } = this.getConfig()
    return this.requestInstance(url, config).then((response: any) => {
      const blob = response.blob()
      return Promise.resolve(getBlobUrl(blob)).then(tempFilePath => {
        this.response = {
          url: response.url || url,
          blob,
          tempFilePath,
          filePath: this.config.filePath,
          statusCode: response.status,
        }
        return this.response
      })
    }) as Promise<DownloadResponse>
  }
}

export class FetchUpload<T>
  extends FetchBase<UploadEngineConfig, RequestResponse<T>>
  implements RequestEngine<UploadEngineConfig, RequestResponse<T>> {
  open<T = any>() {
    if (!this.requestInstance) {
      return Promise.reject(
        new Error('fetch api does not exist, please check the environment!'),
      )
    }

    const { url, ...config } = this.getConfig()

    if (this.config.onUploadProgress) {
      console.warn(new Error('Download progress does not support yet in fetch'))
    }

    return this.requestInstance(url, config).then((response: any) => {
      this.response = {
        url: response.url || url,
        data: null,
        statusCode: response.status,
        headers: response.headers,
      }
      const { responseType } = this.config
      return Promise.resolve(
        responseType === 'blob'
          ? response.blob()
          : responseType === 'json'
          ? response.json()
          : responseType === 'arraybuffer'
          ? response.arrayBuffer()
          : response.text(),
      ).then(data => {
        this.response.data = data
        return this.response
      })
    }) as Promise<RequestResponse<T>>
  }
}
