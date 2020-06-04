import { objectToFormData } from 'object-to-formdata'

export type ResponseType =
  | 'text'
  | 'blob'
  | 'json'
  | 'document'
  | 'arraybuffer'
  | 'JSON'
  | 'base64'

export enum EngineName {
  /** 微信小程序 api */
  WX = 'wx',
  /** 支付宝小程序 api */
  MY = 'my',
  /** xhr api */
  XHR = 'xhr',
  /** fetch api */
  Fetch = 'fetch',
}

export interface ProgressEv {
  total: number
  transmitted: number
  progress: number
}

export interface HttpHeaders {
  [key: string]: string
}

export type RequestData = { [key in string | number]: any } | FormData

export interface RequestSharedConfig {
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
   * Default: { 'Content-Type': 'application/x-www-form-urlencoded' }
   * */
  headers: HttpHeaders

  convertFormDataOptions?: Parameters<typeof objectToFormData>[1] & {
    customConvertFn?(data: Exclude<RequestData, FormData>): FormData
  }

  [key: string]: any

  [key: number]: any
}

export interface RequestEngineConfig extends RequestSharedConfig {
  url: string
  data?: RequestData | null

  /** do not work in engine: wx, my, fetch */
  onUploadProgress?(ev: ProgressEv): void
  /** do not work in engine: wx, my, fetch */
  onDownloadProgress?(ev: ProgressEv): void
}

export interface RequestConfig extends RequestSharedConfig {
  baseURL: string
}

export interface RequestResponse<T = any> {
  /** api url */
  url: string
  data: T
  statusCode: number
  headers: HttpHeaders

  [key: string]: any
}

export interface DownloadEngineConfig {
  url: string
  headers: HttpHeaders
  /**
   * 微信小程序配置，支付宝小程序、H5 中设置无效果
   * */
  timeout: RequestSharedConfig['timeout']
  /**
   * 微信小程序配置，支付宝小程序、H5 中设置无效果
   * */
  filePath: string

  convertFormDataOptions?: RequestSharedConfig['convertFormDataOptions']

  onDownloadProgress?(ev: ProgressEv): void

  [key: string]: any
}

export interface DownloadResponse {
  /** api url */
  url: string
  /** base64 url */
  tempFilePath: string
  filePath: string
  statusCode: number
  blob?: Blob

  [key: string]: any
}

export interface UploadEngineConfig {
  url: string
  timeout: RequestSharedConfig['timeout']
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

  convertFormDataOptions?: RequestSharedConfig['convertFormDataOptions']

  onUploadProgress?(ev: ProgressEv): void

  [key: string]: any
}

export interface RequestEngine<Config = RequestEngineConfig, Response = any> {
  name: EngineName
  config: Config
  response: Response | RequestResponse<null>
  requestInstance: any
  requestTask: any

  open(): Promise<Response>

  abort(): void
}

export type ConfigInterceptor = (config: any) => any
export type ResponseInterceptor = (response: any) => any
export type RequestError = Error & {
  $request: RequestEngine<any>
  [key: string]: any
  [key: number]: any
}
export type ErrorHandler = (e: RequestError) => any

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
