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
    options.url = joinUrl(config.baseURL, config.url, config.data)
  } else {
    options.body = dealRequestData(
      config.data,
      config.headers['Content-Type'],
      config.convertFormDataOptions,
    )
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
      if (response.ok) {
        if (this.config.responseType === 'blob')
          this.response.data = response.blob()
        else if (this.config.responseType === 'json')
          this.response.data = response.json()
        else if (this.config.responseType === 'arraybuffer')
          this.response.data = response.arrayBuffer()
        else this.response.data = response.text()
        return this.response
      }
      return Promise.reject(new Error('Network request failed'))
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
      if (response.ok) {
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
      }
      return Promise.reject(new Error('Network request failed'))
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
      if (response.ok) {
        if (this.config.responseType === 'blob')
          this.response.data = response.blob()
        else if (this.config.responseType === 'json')
          this.response.data = response.json()
        else if (this.config.responseType === 'arraybuffer')
          this.response.data = response.arrayBuffer()
        else this.response.data = response.text()
        return this.response
      }
      return Promise.reject(new Error('Network request failed'))
    }) as Promise<RequestResponse<T>>
  }
}
