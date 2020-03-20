/**
 * fetch api, for browser/RN-App
 * */
import {
  DownloadFileConfig,
  DownloadResult,
  EngineResult,
  HttpEngineConfig,
  ProgressHandler,
  UploadFileConfig,
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
      config.headers,
      config.convertFormDataOptions,
    )
  }
  return options
}

export class FetchBase<T> extends BaseEngine<T> {
  engineName = 'fetch'

  constructor(config: T) {
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

export class Fetch extends FetchBase<HttpEngineConfig> implements HttpEngine {
  open<T = any>() {
    if (!this.requestInstance) {
      return Promise.reject(
        new Error('fetch api does not exist, please check the environment!'),
      )
    }

    const { url, ...config } = this.getConfig()
    return this.requestInstance(url, config).then((response: any) => {
      if (response.ok) {
        const data: EngineResult<T> = {
          data: null as any,
          statusCode: response.status,
          headers: response.headers,
        }
        if (this.config.responseType === 'blob') data.data = response.blob()
        else if (this.config.responseType === 'json')
          data.data = response.json()
        else if (this.config.responseType === 'arraybuffer')
          data.data = response.arrayBuffer()
        else data.data = response.text()
        return data
      }
      return Promise.reject(new Error('Network request failed'))
    }) as Promise<EngineResult<T>>
  }
}

export class FetchDownload extends FetchBase<DownloadFileConfig>
  implements DownloadEngine {
  open(onDownloadProgress?: ProgressHandler) {
    if (!this.requestInstance) {
      return Promise.reject(
        new Error('fetch api does not exist, please check the environment!'),
      )
    }

    if (onDownloadProgress) {
      console.warn(new Error('Download progress does not support yet in fetch'))
    }

    const { url, ...config } = this.getConfig()
    return this.requestInstance(url, config).then((response: any) => {
      if (response.ok) {
        return Promise.resolve(getBlobUrl(response.blob())).then(
          tempFilePath => ({
            tempFilePath,
            filePath: this.config.filePath,
            statusCode: response.status,
          }),
        )
      }
      return Promise.reject(new Error('Network request failed'))
    }) as Promise<DownloadResult>
  }
}

export class FetchUpload extends FetchBase<UploadFileConfig>
  implements UploadEngine {
  open<T = any>(onUploadProgress?: ProgressHandler) {
    if (!this.requestInstance) {
      return Promise.reject(
        new Error('fetch api does not exist, please check the environment!'),
      )
    }

    if (onUploadProgress) {
      console.warn(new Error('Download progress does not support yet in fetch'))
    }

    const { url, ...config } = this.getConfig()
    return this.requestInstance(url, config).then((response: any) => {
      if (response.ok) {
        const data: EngineResult<T> = {
          data: null as any,
          statusCode: response.status,
          headers: response.headers,
        }
        if (this.config.responseType === 'blob') data.data = response.blob()
        else if (this.config.responseType === 'json')
          data.data = response.json()
        else if (this.config.responseType === 'arraybuffer')
          data.data = response.arrayBuffer()
        else data.data = response.text()
        return data
      }
      return Promise.reject(new Error('Network request failed'))
    }) as Promise<EngineResult<T>>
  }
}
