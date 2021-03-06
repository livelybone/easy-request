/**
 * XMLHttpRequest api
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
import { dealRequestData, getBlobUrl, getFileName, joinUrl } from '../utils'
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
  config: RequestEngineConfig,
  responseMap: (res: T) => RT,
) {
  if (!xhr) {
    return Promise.reject(new Error('The environment does not support XHR'))
  }

  return new Promise<RT extends Promise<infer E> ? E : RT>(
    (resolve, reject) => {
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          // 4 = "loaded"
          resolve(responseMap(xhr.response) as any)
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

      let { url } = config
      let data = null
      if (config.method === 'GET') {
        delete config.headers['Content-Type']
        url = joinUrl('', config.url, config.data)
      } else {
        data = dealRequestData(
          config.data,
          config.headers['Content-Type'],
          config.convertFormDataOptions,
        )
        if (config.headers['Content-Type'] === 'multipart/form-data' || !data)
          delete config.headers['Content-Type']
      }

      xhr.open(config.method, url, true)

      Object.keys(config.headers).forEach(k => {
        xhr.setRequestHeader(k, config.headers[k])
      })

      xhr.send(data)
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

class XhrBase<Config, Response> extends BaseEngine<Config, Response> {
  name = EngineName.XHR

  constructor(config: Config) {
    super(config)
    this.requestInstance = createXhr()
    this.requestTask = this.requestInstance
  }

  abort(): void {
    this.requestTask.abort()
  }
}

export class Xhr<T> extends XhrBase<RequestEngineConfig, RequestResponse<T>>
  implements RequestEngine<RequestEngineConfig, RequestResponse<T>> {
  open() {
    return openXhr(this.requestInstance, this.config, (res: T) => {
      this.response = {
        url: this.config.url,
        data: res,
        statusCode: this.requestInstance.status,
        headers: dealHeadersStr(this.requestInstance.getAllResponseHeaders()),
      } as RequestResponse<T>
      return this.response
    })
  }
}

export class XhrDownload extends XhrBase<DownloadEngineConfig, DownloadResponse>
  implements RequestEngine<DownloadEngineConfig, DownloadResponse> {
  open() {
    return openXhr(
      this.requestInstance,
      {
        ...this.config,
        method: 'GET',
        responseType: 'blob',
        withCredentials: this.config.withCredentials || false,
      },
      (blob?: Blob) =>
        getBlobUrl(blob, !!this.config.filePath).then(tempFilePath => {
          const headers = dealHeadersStr(
            this.requestInstance.getAllResponseHeaders(),
          )
          const filename = getFileName(headers)
          if (blob) (blob as any).name = filename
          this.response = {
            url: this.config.url,
            tempFilePath,
            filePath: this.config.filePath,
            statusCode: this.requestInstance.status,
            blob,
            headers: dealHeadersStr(
              this.requestInstance.getAllResponseHeaders(),
            ),
            filename,
          }
          return this.response
        }) as Promise<DownloadResponse>,
    )
  }
}

export class XhrUpload<T>
  extends XhrBase<UploadEngineConfig, RequestResponse<T>>
  implements RequestEngine<UploadEngineConfig, RequestResponse<T>> {
  open() {
    return openXhr(
      this.requestInstance,
      {
        ...this.config,
        data: {
          ...this.config.extraData,
          [this.config.fileKey]: this.config.file,
        },
        method: 'POST',
        responseType: 'json',
        withCredentials: this.config.withCredentials || false,
        headers: {
          ...this.config.headers,
          'Content-Type': 'multipart/form-data',
        },
      },
      (res: T) => {
        this.response = {
          url: this.config.url,
          data: res,
          statusCode: this.requestInstance.status || 200,
          headers: dealHeadersStr(this.requestInstance.getAllResponseHeaders()),
        } as RequestResponse<T>
        return this.response
      },
    )
  }
}
