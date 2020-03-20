/**
 * alipay-app
 *
 * 支付宝小程序
 * */
import {
  DownloadFileConfig,
  DownloadResult,
  EngineResult,
  HttpEngineConfig,
  ProgressHandler,
  UploadFileConfig,
} from '../type'
import { strJsonParse } from '../utils'
import { BaseEngine } from './base'

declare const my: any

class MYBase<T> extends BaseEngine<T> {
  engineName = 'my'

  constructor(config: T) {
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

export class MY extends MYBase<HttpEngineConfig> implements HttpEngine {
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

  open<T = any>() {
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

    return new Promise<EngineResult<T>>((resolve, reject) => {
      this.requestTask = this.requestInstance({
        ...this.getConfig(),
        success: (res: any) =>
          resolve({
            ...res,
            data: strJsonParse(res.data),
            statusCode: res.status,
            headers: res.header || res.headers,
          }),
        failed: reject,
      })
    })
  }
}

export class MYDownload extends MYBase<DownloadFileConfig>
  implements DownloadEngine {
  getConfig() {
    return {
      url: this.config.url,
      header: this.config.headers,
      headers: this.config.headers,
    }
  }

  open(onDownloadProgress?: ProgressHandler) {
    if (!this.requestInstance) {
      return Promise.reject(
        new Error(
          '`my.downloadFile` does not exist, please check the environment!',
        ),
      )
    }

    return new Promise<DownloadResult>((resolve, reject) => {
      this.requestTask = this.requestInstance({
        ...this.getConfig(),
        success: (res: any) =>
          resolve({
            ...res,
            tempFilePath: res.tempFilePath,
            filePath: this.config.filePath,
            statusCode: 200,
          }),
        failed: reject,
      })

      if (onDownloadProgress) {
        if (!this.requestTask.onProgressUpdate) {
          console.warn(
            '`my.downloadFile` does not support download progress event in the current version!',
          )
        } else {
          this.requestTask.onProgressUpdate(
            ({
              progress,
              totalBytesWritten,
              totalBytesExpectedToWrite,
            }: any) => {
              onDownloadProgress({
                progress,
                total: totalBytesExpectedToWrite,
                transmitted: totalBytesWritten,
              })
            },
          )
        }
      }
    })
  }
}

export class MYUpload extends MYBase<UploadFileConfig> implements UploadEngine {
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

  open<T = any>(onUploadProgress?: ProgressHandler) {
    if (!this.requestInstance) {
      return Promise.reject(
        new Error(
          '`my.uploadFile` does not exist, please check the environment!',
        ),
      )
    }

    return new Promise<EngineResult<T>>((resolve, reject) => {
      this.requestTask = this.requestInstance({
        ...this.getConfig(),
        success: (res: any) =>
          resolve({
            ...res,
            data: strJsonParse(res.data),
            headers: res.header || res.headers,
          }),
        fail: reject,
      })

      if (onUploadProgress) {
        if (!this.requestTask.onProgressUpdate) {
          console.warn(
            '`my.uploadFile` does not support upload progress event in the current version!',
          )
        } else {
          this.requestTask.onProgressUpdate(
            ({
              progress,
              totalBytesWritten,
              totalBytesExpectedToWrite,
            }: any) => {
              onUploadProgress({
                progress,
                total: totalBytesExpectedToWrite,
                transmitted: totalBytesWritten,
              })
            },
          )
        }
      }
    })
  }
}
