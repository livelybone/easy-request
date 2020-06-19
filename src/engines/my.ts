/**
 * alipay-app
 *
 * 支付宝小程序
 * */
import {
  DownloadEngineConfig,
  DownloadResponse,
  EngineName,
  ProgressEv,
  RequestEngine,
  RequestEngineConfig,
  RequestResponse,
  UploadEngineConfig,
} from '../type'
import { strJsonParse } from '../utils'
import { BaseEngine } from './base'

declare const my: any

class MYBase<Config, Response> extends BaseEngine<Config, Response> {
  name = EngineName.MY

  constructor(config: Config) {
    super(config)
    if (my && (my.request || my.httpRequest)) {
      this.requestInstance = my.request || my.httpRequest
    }
  }

  abort(): void {
    if (!this.requestTask) {
      throw new Error('Please call abort after request opened')
    }
    this.requestTask.abort()
  }
}

export class MY<T> extends MYBase<RequestEngineConfig, RequestResponse<T>>
  implements RequestEngine<RequestEngineConfig, RequestResponse<T>> {
  getConfig() {
    return {
      url: this.config.url,
      method: this.config.method.toUpperCase(),
      data: this.config.data,
      headers: this.config.headers,
      header: this.config.headers,
      timeout: this.config.timeout,
      dataType: this.config.responseType,
    }
  }

  open() {
    if (!this.requestInstance) {
      return Promise.reject(
        new Error(
          '`my.request` and `my.httpRequest` does not exist, please check the environment!',
        ),
      )
    }

    if (['blob', 'document'].includes(this.config.responseType)) {
      return Promise.reject(
        new Error(
          `The dataType \`${this.config.responseType}\` is not supported in my`,
        ),
      )
    }

    return new Promise<RequestResponse<T>>((resolve, reject) => {
      this.requestTask = this.requestInstance({
        ...this.getConfig(),
        success: (res: any) => {
          this.response = {
            ...res,
            url: res.url || this.config.url,
            data: strJsonParse(res.data),
            statusCode: res.statusCode || res.status || 200,
            headers: res.header || res.headers,
          }
          resolve(this.response as RequestResponse<T>)
        },
        failed: reject,
      })
    })
  }
}

function bindProgress(task: any, onProgress: (ev: ProgressEv) => void) {
  task.onProgressUpdate(
    ({ progress, totalBytesWritten, totalBytesExpectedToWrite }: any) => {
      onProgress({
        progress,
        total: totalBytesExpectedToWrite,
        transmitted: totalBytesWritten,
      })
    },
  )
}

export class MYDownload extends MYBase<DownloadEngineConfig, DownloadResponse>
  implements RequestEngine<DownloadEngineConfig, DownloadResponse> {
  getConfig() {
    return {
      url: this.config.url,
      header: this.config.headers,
      headers: this.config.headers,
    }
  }

  open() {
    if (!this.requestInstance) {
      return Promise.reject(
        new Error(
          '`my.downloadFile` does not exist, please check the environment!',
        ),
      )
    }

    return new Promise<DownloadResponse>((resolve, reject) => {
      this.requestTask = this.requestInstance({
        ...this.getConfig(),
        success: (res: any) => {
          this.response = {
            ...res,
            url: res.url || this.config.url,
            tempFilePath: res.tempFilePath,
            filePath: this.config.filePath,
            statusCode: res.statusCode || res.status || 200,
          } as DownloadResponse
          resolve(this.response)
        },
        failed: reject,
      })

      const { onDownloadProgress } = this.config
      if (onDownloadProgress) {
        if (!this.requestTask.onProgressUpdate) {
          console.warn(
            '`my.downloadFile` does not support download progress event in the current version!',
          )
        } else bindProgress(this.requestTask, onDownloadProgress)
      }
    })
  }
}

export class MYUpload<T> extends MYBase<UploadEngineConfig, RequestResponse<T>>
  implements RequestEngine<UploadEngineConfig, RequestResponse<T>> {
  getConfig() {
    return {
      url: this.config.url,
      filePath: this.config.file,
      fileName: this.config.fileKey,
      fileType: this.config.fileType || 'image',
      header: this.config.headers,
      headers: this.config.headers,
      formData: this.config.extraData,
    }
  }

  open() {
    if (!this.requestInstance) {
      return Promise.reject(
        new Error(
          '`my.uploadFile` does not exist, please check the environment!',
        ),
      )
    }

    return new Promise<RequestResponse<T>>((resolve, reject) => {
      this.requestTask = this.requestInstance({
        ...this.getConfig(),
        success: (res: any) => {
          this.response = {
            ...res,
            url: res.url || this.config.url,
            data: strJsonParse(res.data),
            headers: res.header || res.headers,
            statusCode: res.statusCode || res.status || 200,
          } as RequestResponse<T>
          resolve(this.response)
        },
        fail: reject,
      })

      const { onUploadProgress } = this.config
      if (onUploadProgress) {
        if (!this.requestTask.onProgressUpdate) {
          console.warn(
            '`my.uploadFile` does not support upload progress event in the current version!',
          )
        } else bindProgress(this.requestTask, onUploadProgress)
      }
    })
  }
}
