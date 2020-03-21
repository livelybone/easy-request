/**
 * wechat-app
 *
 * 微信小程序
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

declare const wx: any

class WXBase<Config, Response> extends BaseEngine<Config, Response> {
  name = EngineName.WX

  constructor(config: Config) {
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

export class WX<T> extends WXBase<RequestEngineConfig, RequestResponse<T>>
  implements RequestEngine<RequestEngineConfig, RequestResponse<T>> {
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

  open() {
    if (!this.requestInstance) {
      return Promise.reject(
        new Error('`wx.request` does not exist, please check the environment!'),
      )
    }

    if (
      this.config.responseType &&
      !['json', 'text'].includes(this.config.responseType)
    ) {
      console.warn(
        new Error(
          `The dataType \`${this.config.responseType}\` is not supported in wx`,
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
            statusCode: res.statusCode || 200,
          } as RequestResponse<T>
          resolve(this.response)
        },
        failed: reject,
      })
    })
  }
}

function bindProgress(task: any, onProgress: (ev: ProgressEv) => void) {
  const handler = ({
    progress,
    totalBytesWritten,
    totalBytesExpectedToWrite,
  }: any) => {
    onProgress({
      progress,
      total: totalBytesExpectedToWrite,
      transmitted: totalBytesWritten,
    })
    if (totalBytesWritten - totalBytesExpectedToWrite >= 0) {
      task.offProgressUpdate(handler)
    }
  }
  task.onProgressUpdate(handler)
}

export class WXDownload extends WXBase<DownloadEngineConfig, DownloadResponse>
  implements RequestEngine<DownloadEngineConfig, DownloadResponse> {
  getConfig() {
    return {
      url: this.config.url,
      timeout: this.config.timeout,
      header: this.config.headers,
      headers: this.config.headers,
      filePath: this.config.filePath,
    }
  }

  open() {
    if (!this.requestInstance) {
      return Promise.reject(
        new Error(
          '`wx.downloadFile` does not exist, please check the environment!',
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
            statusCode: res.statusCode || 200,
          } as DownloadResponse
          resolve(this.response)
        },
        failed: reject,
      })

      const { onDownloadProgress } = this.config
      if (onDownloadProgress) {
        if (!this.requestTask.onProgressUpdate) {
          console.warn(
            '`wx.downloadFile` does not support download progress event in the current version!',
          )
        } else bindProgress(this.requestTask, onDownloadProgress)
      }
    })
  }
}

export class WXUpload<T> extends WXBase<UploadEngineConfig, RequestResponse<T>>
  implements RequestEngine<UploadEngineConfig, RequestResponse<T>> {
  getConfig() {
    return {
      url: this.config.url,
      timeout: this.config.timeout,
      header: this.config.headers,
      headers: this.config.headers,
    }
  }

  open() {
    if (!this.requestInstance) {
      return Promise.reject(
        new Error('`wx.request` does not exist, please check the environment!'),
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
            statusCode: res.statusCode || 200,
          } as RequestResponse<T>
          resolve(this.response)
        },
        failed: reject,
      })

      const { onUploadProgress } = this.config
      if (onUploadProgress) {
        if (!this.requestTask.onProgressUpdate) {
          console.warn(
            '`wx.uploadFile` does not support upload progress event in the current version!',
          )
        } else bindProgress(this.requestTask, onUploadProgress)
      }
    })
  }
}
