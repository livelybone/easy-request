/**
 * XMLHttpRequest api
 * */
import {
  DownloadFileConfig,
  EngineResult,
  HttpEngineConfig,
  ProgressHandler,
  UploadFileConfig,
} from '../type'
import { dealRequestData, getBlobUrl, joinUrl } from '../utils'
import { BaseEngine } from './base'

declare const XMLHttpRequest: any
declare const ActiveXObject: any

function createXhr() {
  if (XMLHttpRequest) {
    // code for all new browsers
    return new XMLHttpRequest()
  }
  if (ActiveXObject) {
    // code for IE5 and I E6
    return new ActiveXObject('Microsoft.XMLHTTP')
  }
  return null
}

function openXhr<T extends any, RT extends any>(
  xhr: any,
  config: HttpEngineConfig & {
    onUploadProgress?: ProgressHandler
    onDownloadProgress?: ProgressHandler
  },
  responseMap: (res: T) => RT,
) {
  if (!xhr)
    return Promise.reject(new Error('The environment does not support XHR'))

  return new Promise<RT extends Promise<infer E> ? E : RT>(
    (resolve, reject) => {
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          // 4 = "loaded"
          if (xhr.status === 200) {
            // 200 = OK
            resolve(responseMap(xhr.response) as any)
          } else {
            reject(new Error('Network request failed'))
          }
        }
      }

      if (config.responseType)
        xhr.responseType = config.responseType.toLowerCase()

      if (config.withCredentials) xhr.withCredentials = config.withCredentials

      if (config.timeout) xhr.timeout = config.timeout
      xhr.ontimeout = () => reject(new Error('Request time out'))

      if (config.onDownloadProgress)
        xhr.onprogress = ({ total, loaded }: any) =>
          config.onDownloadProgress!({
            total,
            transmitted: loaded,
            progress: loaded / total,
          })

      if (config.onUploadProgress) {
        xhr.upload.onprogress = ({ total, loaded }: any) =>
          config.onUploadProgress!({
            total,
            transmitted: loaded,
            progress: loaded / total,
          })
      }

      const url =
        config.method !== 'GET'
          ? config.url
          : joinUrl('', config.url, config.data)
      xhr.open(config.method, url, true)

      if (config.headers) {
        Object.keys(config.headers).forEach(k => {
          xhr.setRequestHeader(k, config.headers![k])
        })
      }

      const data = dealRequestData(
        config.data,
        config.headers,
        config.convertFormDataOptions,
      )
      xhr.send(data || null)
    },
  )
}

function dealHeadersStr(headers: string) {
  return headers
    .split(/[\n\r]+/g)
    .filter(Boolean)
    .reduce((pre, header: string) => {
      const [k, value] = header.split(': ')
      return { ...pre, [k]: value }
    }, {} as { [key: string]: string })
}

class XhrBase<T> extends BaseEngine<T> {
  engineName = 'xhr'

  constructor(config: T) {
    super(config)
    this.requestInstance = createXhr()
    this.requestTask = this.requestInstance
  }

  abort(): void {
    this.requestTask.abort()
  }
}

export class Xhr extends XhrBase<HttpEngineConfig> implements HttpEngine {
  open<T = any>() {
    return openXhr(
      this.requestInstance,
      this.config,
      (res: T) =>
        ({
          data: res,
          statusCode: this.requestInstance.status,
          headers: dealHeadersStr(this.requestInstance.getAllResponseHeaders()),
        } as EngineResult<T>),
    )
  }
}

export class XhrUpload extends XhrBase<UploadFileConfig>
  implements UploadEngine {
  open<T = any>(onUploadProgress?: ProgressHandler) {
    return openXhr(
      this.requestInstance,
      {
        ...this.config,
        data: {
          ...this.config.extraData,
          [this.config.fileKey]: this.config.file,
        },
        method: 'GET',
        responseType: 'json',
        withCredentials: true,
        headers: {
          ...this.config.headers,
          'content-type': 'multipart/form-data',
        },
        onUploadProgress,
      },
      (res: T) =>
        ({
          data: res,
          statusCode: this.requestInstance.status,
          headers: dealHeadersStr(this.requestInstance.getAllResponseHeaders()),
        } as EngineResult<T>),
    )
  }
}

export class XhrDownload extends XhrBase<DownloadFileConfig>
  implements DownloadEngine {
  open(onDownloadProgress?: ProgressHandler) {
    return openXhr(
      this.requestInstance,
      {
        ...this.config,
        method: 'POST',
        responseType: 'blob',
        withCredentials: true,
        onDownloadProgress,
      },
      (res: any) =>
        Promise.resolve(getBlobUrl(res)).then(tempFilePath => ({
          tempFilePath,
          filePath: this.config.filePath,
          statusCode: this.requestInstance.status,
        })),
    )
  }
}
