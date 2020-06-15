import { objectToFormData } from 'object-to-formdata'

declare type ResponseType =
  | 'text'
  | 'blob'
  | 'json'
  | 'document'
  | 'arraybuffer'
  | 'JSON'
  | 'base64'

declare enum EngineName {
  /** 微信小程序 api */
  WX = 'wx',
  /** 支付宝小程序 api */
  MY = 'my',
  /** xhr api */
  XHR = 'xhr',
  /** fetch api */
  Fetch = 'fetch',
}

interface ProgressEv {
  total: number
  transmitted: number
  progress: number
}

interface HttpHeaders {
  [key: string]: string
}

declare type RequestData =
  | {
      [key in string | number]: any
    }
  | FormData

interface RequestSharedConfig {
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

interface RequestEngineConfig extends RequestSharedConfig {
  url: string
  data?: RequestData | null

  /** do not work in engine: wx, my, fetch */
  onUploadProgress?(ev: ProgressEv): void

  /** do not work in engine: wx, my, fetch */
  onDownloadProgress?(ev: ProgressEv): void
}

interface RequestConfig extends RequestSharedConfig {
  baseURL: string
}

interface RequestResponse<T = any> {
  /** api url */
  url: string
  data: T
  statusCode: number
  headers: HttpHeaders

  [key: string]: any
}

interface DownloadEngineConfig {
  url: string
  headers: HttpHeaders
  /**
   * 微信小程序配置，支付宝小程序、H5 中设置无效果
   * */
  timeout: RequestSharedConfig['timeout']
  /**
   * 微信小程序配置，H5 中设置表示需要生成临时 url，支付宝小程序中设置无效果
   * */
  filePath: string
  convertFormDataOptions?: RequestSharedConfig['convertFormDataOptions']

  onDownloadProgress?(ev: ProgressEv): void

  [key: string]: any
}

interface DownloadResponse {
  /** api url */
  url: string
  /** base64 url */
  tempFilePath: string
  filePath: string
  statusCode: number
  /** filename that get from server */
  filename: string
  blob?: Blob
  headers?: {
    [k: string]: string
  }

  [key: string]: any
}

interface UploadEngineConfig {
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

interface RequestEngine<Config = RequestEngineConfig, Response = any> {
  name: EngineName
  config: Config
  response: Response | RequestResponse<null>
  requestInstance: any
  requestTask: any

  open(): Promise<Response>

  abort(): void
}

declare type ConfigInterceptor = (config: any) => any
declare type ResponseInterceptor = (response: any) => any
declare type RequestError = Error & {
  $request: RequestEngine<any>
  [key: string]: any
  [key: number]: any
}
declare type ErrorHandler = (e: RequestError) => any

interface HttpInterceptors {
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

declare class BaseEngine<Config, Response> {
  config: Config

  requestInstance: any

  requestTask: any

  response: Response | RequestResponse<null>

  constructor(config: Config)
}

declare class FetchBase<Config, Response> extends BaseEngine<Config, Response> {
  name: EngineName

  constructor(config: Config)

  abort(): void

  getConfig(): any
}

declare class Fetch<T>
  extends FetchBase<RequestEngineConfig, RequestResponse<T>>
  implements RequestEngine<RequestEngineConfig, RequestResponse<T>> {
  open(): Promise<RequestResponse<T>>
}

declare class FetchDownload
  extends FetchBase<DownloadEngineConfig, DownloadResponse>
  implements RequestEngine<DownloadEngineConfig, DownloadResponse> {
  open(): Promise<DownloadResponse>
}

declare class FetchUpload<T>
  extends FetchBase<UploadEngineConfig, RequestResponse<T>>
  implements RequestEngine<UploadEngineConfig, RequestResponse<T>> {
  open<T = any>(): Promise<RequestResponse<T>>

  getConfig(): any
}

declare class MYBase<Config, Response> extends BaseEngine<Config, Response> {
  name: EngineName

  constructor(config: Config)

  abort(): void
}

declare class MY<T> extends MYBase<RequestEngineConfig, RequestResponse<T>>
  implements RequestEngine<RequestEngineConfig, RequestResponse<T>> {
  getConfig(): {
    url: string
    method: string
    data:
      | {
          [x: string]: any
          [x: number]: any
        }
      | FormData
      | null
      | undefined
    headers: HttpHeaders
    header: HttpHeaders
    timeout: number
    dataType: ResponseType
  }

  open(): Promise<RequestResponse<T>>
}

declare class MYDownload extends MYBase<DownloadEngineConfig, DownloadResponse>
  implements RequestEngine<DownloadEngineConfig, DownloadResponse> {
  getConfig(): {
    url: string
    header: HttpHeaders
    headers: HttpHeaders
  }

  open(): Promise<DownloadResponse>
}

declare class MYUpload<T> extends MYBase<UploadEngineConfig, RequestResponse<T>>
  implements RequestEngine<UploadEngineConfig, RequestResponse<T>> {
  getConfig(): {
    url: string
    filePath: string | Blob | File
    fileName: string
    fileType: 'image' | 'video' | 'audio'
    header: HttpHeaders
    headers: HttpHeaders
    formData: RequestData
  }

  open(): Promise<RequestResponse<T>>
}

declare class WXBase<Config, Response> extends BaseEngine<Config, Response> {
  name: EngineName

  constructor(config: Config)

  abort(): void
}

declare class WX<T> extends WXBase<RequestEngineConfig, RequestResponse<T>>
  implements RequestEngine<RequestEngineConfig, RequestResponse<T>> {
  getConfig(): {
    url: string
    data:
      | {
          [x: string]: any
          [x: number]: any
        }
      | FormData
      | null
      | undefined
    method: string
    dataType: ResponseType
    timeout: number
    header: HttpHeaders
    headers: HttpHeaders
  }

  open(): Promise<RequestResponse<T>>
}

declare class WXDownload extends WXBase<DownloadEngineConfig, DownloadResponse>
  implements RequestEngine<DownloadEngineConfig, DownloadResponse> {
  getConfig(): {
    url: string
    timeout: number
    header: HttpHeaders
    headers: HttpHeaders
    filePath: string
  }

  open(): Promise<DownloadResponse>
}

declare class WXUpload<T> extends WXBase<UploadEngineConfig, RequestResponse<T>>
  implements RequestEngine<UploadEngineConfig, RequestResponse<T>> {
  getConfig(): {
    url: string
    timeout: number
    header: HttpHeaders
    headers: HttpHeaders
  }

  open(): Promise<RequestResponse<T>>
}

declare class XhrBase<Config, Response> extends BaseEngine<Config, Response> {
  name: EngineName

  constructor(config: Config)

  abort(): void
}

declare class Xhr<T> extends XhrBase<RequestEngineConfig, RequestResponse<T>>
  implements RequestEngine<RequestEngineConfig, RequestResponse<T>> {
  open(): Promise<RequestResponse<T>>
}

declare class XhrDownload
  extends XhrBase<DownloadEngineConfig, DownloadResponse>
  implements RequestEngine<DownloadEngineConfig, DownloadResponse> {
  open(): Promise<DownloadResponse>
}

declare class XhrUpload<T>
  extends XhrBase<UploadEngineConfig, RequestResponse<T>>
  implements RequestEngine<UploadEngineConfig, RequestResponse<T>> {
  open(): Promise<RequestResponse<T>>
}

declare class Http {
  engineName: EngineName

  config: RequestConfig

  interceptors: HttpInterceptors

  constructor(engineName?: EngineName, config?: Partial<RequestConfig>)

  calcConfig(config?: any): Promise<any>

  getRequestInstance(
    config: RequestEngineConfig,
  ): WX<unknown> | MY<unknown> | Fetch<unknown> | Xhr<unknown>

  getDownloadInstance(
    config: DownloadEngineConfig,
  ): FetchDownload | MYDownload | WXDownload | XhrDownload

  getUploadInstance(
    config: UploadEngineConfig,
  ):
    | WXUpload<unknown>
    | MYUpload<unknown>
    | FetchUpload<unknown>
    | XhrUpload<unknown>

  static createError(object: any, request: RequestEngine<any>): RequestError

  static dealResponse<T extends any>(
    result: T,
    request: any,
  ): T extends {
    [k in string | number]: any
  }
    ? T & {
        $request: any
      }
    : T

  request<T extends any = any>(
    url: string,
    data?: RequestData,
    options?: Partial<RequestConfig>,
  ): Promise<T>

  /**
   * 对应微信/支付宝小程序的 downloadFile
   * */
  downloadFile(
    options: Partial<DownloadEngineConfig> & Pick<DownloadEngineConfig, 'url'>,
  ): Promise<
    DownloadResponse & {
      $request: any
    }
  >

  /**
   * 对应微信/支付宝小程序的 uploadFile
   * */
  uploadFile<T extends any = any>(
    options: Partial<UploadEngineConfig> &
      Pick<UploadEngineConfig, 'url' | 'file' | 'fileKey'>,
  ): Promise<
    RequestResponse<any> & {
      $request: any
    }
  >

  get<T extends any = any>(
    url: string,
    data?: RequestData,
    options?: Partial<
      Pick<RequestConfig, Exclude<keyof RequestConfig, 'method'>>
    >,
  ): Promise<T>

  post<T extends any = any>(
    url: string,
    data?: RequestData,
    options?: Partial<
      Pick<RequestConfig, Exclude<keyof RequestConfig, 'method'>>
    >,
  ): Promise<T>

  put<T extends any = any>(
    url: string,
    data?: RequestData,
    options?: Partial<
      Pick<RequestConfig, Exclude<keyof RequestConfig, 'method'>>
    >,
  ): Promise<T>

  delete<T extends any = any>(
    url: string,
    data?: RequestData,
    options?: Partial<
      Pick<RequestConfig, Exclude<keyof RequestConfig, 'method'>>
    >,
  ): Promise<T>
}

export default Http
export {
  ConfigInterceptor,
  DownloadEngineConfig,
  DownloadResponse,
  EngineName,
  ErrorHandler,
  Http,
  HttpHeaders,
  HttpInterceptors,
  ProgressEv,
  RequestConfig,
  RequestData,
  RequestEngine,
  RequestEngineConfig,
  RequestError,
  RequestResponse,
  RequestSharedConfig,
  ResponseInterceptor,
  ResponseType,
  UploadEngineConfig,
}
