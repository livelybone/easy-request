/**
 * wechat-app
 *
 * 微信小程序
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

declare const wx: any

class WXBase<T> extends BaseEngine<T> {
  engineName = 'wx'

  constructor(config: T) {
    super(config)
    if (wx && wx.request) {
      this.requestInstance = wx.request
    }
  }

  abort(): void {
    if (!this.requestTask) {
      throw new Error('Please call abort after request opened')
    }
    this.requestTask.abort()
  }
}

export class WX extends WXBase<HttpEngineConfig> implements HttpEngine {
  getConfig() {
    return {
      url: this.config.url,
      data: this.config.data,
      method: this.config.method,
      dataType: this.config.responseType,
      timeout: this.config.timeout,
      header: this.config.headers,
      headers: this.config.headers,
    }
  }

  open<T = any>() {
    if (!this.requestInstance) {
      return Promise.reject(
        new Error('`wx.request` does not exist, please check the environment!'),
      )
    }

    if (this.config.responseType !== 'json') {
      return Promise.reject(
        new Error(
          `The dataType \`${this.config.responseType}\` is not supported in wx`,
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
        failed: reject,
      })
    })
  }
}

export class WXDownload extends WXBase<DownloadFileConfig>
  implements DownloadEngine {
  getConfig() {
    return {
      url: this.config.url,
      timeout: this.config.timeout,
      header: this.config.headers,
      headers: this.config.headers,
      filePath: this.config.filePath,
    }
  }

  open(onDownloadProgress?: ProgressHandler) {
    if (!this.requestInstance) {
      return Promise.reject(
        new Error(
          '`wx.downloadFile` does not exist, please check the environment!',
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
            '`wx.downloadFile` does not support download progress event in the current version!',
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
              if (totalBytesWritten - totalBytesExpectedToWrite >= 0) {
                this.requestTask.offProgressUpdate()
              }
            },
          )
        }
      }
    })
  }
}

export class WXUpload extends WXBase<UploadFileConfig> implements UploadEngine {
  getConfig() {
    return {
      url: this.config.url,
      timeout: this.config.timeout,
      header: this.config.headers,
      headers: this.config.headers,
    }
  }

  open<T = any>(onUploadProgress?: ProgressHandler) {
    if (!this.requestInstance) {
      return Promise.reject(
        new Error('`wx.request` does not exist, please check the environment!'),
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
        failed: reject,
      })

      if (onUploadProgress) {
        if (!this.requestTask.onProgressUpdate) {
          console.warn(
            '`wx.uploadFile` does not support upload progress event in the current version!',
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
              if (totalBytesWritten - totalBytesExpectedToWrite >= 0) {
                this.requestTask.offProgressUpdate()
              }
            },
          )
        }
      }
    })
  }
}
