import { objectToFormData } from 'object-to-formdata'

export type ResponseType =
  | 'text'
  | 'blob'
  | 'json'
  | 'document'
  | 'arraybuffer'
  | 'JSON'
  | 'base64'

export type Env = 'weapp' | 'aliapp' | 'h5' | 'fetch'

export type ProgressHandler = (e: ProgressEvent) => void

export interface HttpHeaders {
  [key: string]: string
}

export interface HttpSharedConfig {
  method: string
  /**
   * 对应: responseType、dataType
   * Default: json
   * */
  responseType: ResponseType
  /**
   * 微信 wx 和支付宝 my 中不支持，设置无效果
   * Default: false
   * */
  withCredentials: boolean
  /**
   * Default: 30000
   *
   * fetch 不支持
   * */
  timeout: number
  /**
   * Default: { 'content-type': 'application/x-www-form-urlencoded' }
   * */
  headers: HttpHeaders

  convertFormDataOptions?: Parameters<typeof objectToFormData>[1]

  [key: string]: any

  [key: number]: any
}

export type RequestData = { [key in string | number]: any }

export interface HttpEngineConfig extends HttpSharedConfig {
  url: string
  data?: RequestData | null
}

export interface HttpConfig extends HttpSharedConfig {
  baseURL: string
}

export interface ProgressEvent {
  total: number
  transmitted: number
  progress: number
}

export interface EngineResult<T = any> {
  data: T
  statusCode: number
  headers: HttpHeaders

  [key: string]: any
}

export interface DownloadFileConfig {
  url: string
  headers: HttpHeaders
  /**
   * 微信小程序配置，支付宝小程序、H5 中设置无效果
   * */
  timeout: HttpSharedConfig['timeout']
  /**
   * 微信小程序配置，支付宝小程序、H5 中设置无效果
   * */
  filePath: string

  convertFormDataOptions?: HttpSharedConfig['convertFormDataOptions']

  [key: string]: any
}

export interface DownloadResult {
  tempFilePath: string
  filePath: string
  statusCode: number

  [key: string]: any
}

export interface UploadFileConfig {
  url: string
  timeout: HttpSharedConfig['timeout']
  headers: HttpHeaders
  /**
   * 对应微信、支付宝小程序中的 filePath
   * H5 中只能使用 blob | file 类型
   * */
  file: string | Blob | File
  /**
   * 文件对应的 key
   * 对应微信小程序中的 name
   * 对应支付宝小程序中的 fileName
   * */
  fileKey: string
  /**
   * 文件类型
   * 支付宝小程序中需要
   * */
  fileType?: 'image' | 'video' | 'audio'
  extraData: RequestData

  convertFormDataOptions?: HttpSharedConfig['convertFormDataOptions']

  [key: string]: any
}

declare global {
  // @ts-ignore
  class HttpEngine {
    constructor(config: HttpEngineConfig)

    open<T = any>(): Promise<EngineResult<T>>

    abort(): void
  }

  // @ts-ignore
  class DownloadEngine {
    constructor(config: DownloadFileConfig)

    open(onDownloadProgress?: ProgressHandler): Promise<DownloadResult>

    abort(): void
  }

  // @ts-ignore
  class UploadEngine {
    constructor(config: UploadFileConfig)

    open<T>(onUploadProgress?: ProgressHandler): Promise<EngineResult<T>>

    abort(): void
  }
}

export type ConfigInterceptor = (config: any) => any
export type ResponseInterceptor = (response: any) => any
export type ErrorHandler = (
  e: Error & { $request: HttpEngine | DownloadEngine | UploadEngine },
) => any

export interface HttpInterceptors {
  request: {
    interceptors: ConfigInterceptor[]
    use(resolve: ConfigInterceptor): void
  }
  response: {
    interceptors: {
      resolves: ResponseInterceptor[]
      rejects: ErrorHandler[]
    }
    use(resolve?: ResponseInterceptor, reject?: ErrorHandler): void
  }
}
