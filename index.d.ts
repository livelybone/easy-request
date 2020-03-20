import { objectToFormData } from 'object-to-formdata'

declare type ResponseType =
  | 'text'
  | 'blob'
  | 'json'
  | 'document'
  | 'arraybuffer'
  | 'JSON'
  | 'base64'
declare type Env = 'weapp' | 'aliapp' | 'h5' | 'fetch'
declare type ProgressHandler = (e: ProgressEvent) => void

interface HttpHeaders {
  [key: string]: string
}

interface HttpSharedConfig {
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

declare type RequestData = {
  [key in string | number]: any
}

interface HttpEngineConfig extends HttpSharedConfig {
  url: string
  data?: RequestData | null
}

interface HttpConfig extends HttpSharedConfig {
  baseURL: string
}

interface ProgressEvent {
  total: number
  transmitted: number
  progress: number
}

interface EngineResult<T = any> {
  data: T
  statusCode: number
  headers: HttpHeaders

  [key: string]: any
}

interface DownloadFileConfig {
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

interface DownloadResult {
  tempFilePath: string
  filePath: string
  statusCode: number

  [key: string]: any
}

interface UploadFileConfig {
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
  class HttpEngine {
    constructor(config: HttpEngineConfig)

    open<T = any>(): Promise<EngineResult<T>>

    abort(): void
  }

  class DownloadEngine {
    constructor(config: DownloadFileConfig)

    open(onDownloadProgress?: ProgressHandler): Promise<DownloadResult>

    abort(): void
  }

  class UploadEngine {
    constructor(config: UploadFileConfig)

    open<T>(onUploadProgress?: ProgressHandler): Promise<EngineResult<T>>

    abort(): void
  }
}
declare type ConfigInterceptor = (config: any) => any
declare type ResponseInterceptor = (response: any) => any
declare type ErrorHandler = (
  e: Error & {
    $request: HttpEngine | DownloadEngine | UploadEngine
  },
) => any

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

declare class BaseEngine<T> {
  config: T

  requestInstance: any

  requestTask: any

  constructor(config: T)
}

declare class FetchBase<T> extends BaseEngine<T> {
  engineName: string

  constructor(config: T)

  abort(): void

  getConfig(): any
}

declare class Fetch extends FetchBase<HttpEngineConfig> implements HttpEngine {
  open<T = any>(): Promise<EngineResult<T>>
}

declare class FetchDownload extends FetchBase<DownloadFileConfig>
  implements DownloadEngine {
  open(onDownloadProgress?: ProgressHandler): Promise<DownloadResult>
}

declare class FetchUpload extends FetchBase<UploadFileConfig>
  implements UploadEngine {
  open<T = any>(onUploadProgress?: ProgressHandler): Promise<EngineResult<T>>
}

declare class MYBase<T> extends BaseEngine<T> {
  engineName: string

  constructor(config: T)

  abort(): void
}

declare class MY extends MYBase<HttpEngineConfig> implements HttpEngine {
  getConfig(): {
    url: string
    method: string
    data: RequestData | null | undefined
    headers: HttpHeaders
    header: HttpHeaders
    timeout: number
    dataType: ResponseType
  }

  open<T = any>(): Promise<EngineResult<T>>
}

declare class MYDownload extends MYBase<DownloadFileConfig>
  implements DownloadEngine {
  getConfig(): {
    url: string
    header: HttpHeaders
    headers: HttpHeaders
  }

  open(onDownloadProgress?: ProgressHandler): Promise<DownloadResult>
}

declare class MYUpload extends MYBase<UploadFileConfig>
  implements UploadEngine {
  getConfig(): {
    url: string
    filePath: string | Blob | File
    fileName: string
    fileType: 'image' | 'video' | 'audio'
    header: HttpHeaders
    headers: HttpHeaders
    formData: RequestData
  }

  open<T = any>(onUploadProgress?: ProgressHandler): Promise<EngineResult<T>>
}

declare class WXBase<T> extends BaseEngine<T> {
  engineName: string

  constructor(config: T)

  abort(): void
}

declare class WX extends WXBase<HttpEngineConfig> implements HttpEngine {
  getConfig(): {
    url: string
    data: RequestData | null | undefined
    method: string
    dataType: ResponseType
    timeout: number
    header: HttpHeaders
    headers: HttpHeaders
  }

  open<T = any>(): Promise<EngineResult<T>>
}

declare class WXDownload extends WXBase<DownloadFileConfig>
  implements DownloadEngine {
  getConfig(): {
    url: string
    timeout: number
    header: HttpHeaders
    headers: HttpHeaders
    filePath: string
  }

  open(onDownloadProgress?: ProgressHandler): Promise<DownloadResult>
}

declare class WXUpload extends WXBase<UploadFileConfig>
  implements UploadEngine {
  getConfig(): {
    url: string
    timeout: number
    header: HttpHeaders
    headers: HttpHeaders
  }

  open<T = any>(onUploadProgress?: ProgressHandler): Promise<EngineResult<T>>
}

declare class XhrBase<T> extends BaseEngine<T> {
  engineName: string

  constructor(config: T)

  abort(): void
}

declare class Xhr extends XhrBase<HttpEngineConfig> implements HttpEngine {
  open<T = any>(): Promise<EngineResult<T>>
}

declare class XhrUpload extends XhrBase<UploadFileConfig>
  implements UploadEngine {
  open<T = any>(onUploadProgress?: ProgressHandler): Promise<EngineResult<T>>
}

declare class XhrDownload extends XhrBase<DownloadFileConfig>
  implements DownloadEngine {
  open(
    onDownloadProgress?: ProgressHandler,
  ): Promise<{
    tempFilePath: string
    filePath: string
    statusCode: any
  }>
}

declare class Http {
  env: Env

  config: HttpConfig

  interceptors: HttpInterceptors

  constructor(env?: Env, config?: Partial<HttpConfig>)

  calcConfig(config?: any): any

  getRequestInstance(config: HttpEngineConfig): Fetch | MY | WX | Xhr

  getDownloadInstance(
    config: DownloadFileConfig,
  ): FetchDownload | MYDownload | WXDownload | XhrDownload

  getUploadInstance(
    config: UploadFileConfig,
  ): FetchUpload | MYUpload | WXUpload | XhrUpload

  request<T = any>(
    url: string,
    data?: RequestData,
    options?: Partial<HttpConfig>,
  ): Promise<T>

  /**
   * 对应微信/支付宝小程序的 downloadFile
   * */
  downloadFile(
    options: Partial<DownloadFileConfig> &
      Pick<DownloadFileConfig, 'url'> & {
        onDownloadProgress?: ProgressHandler
      },
  ): Promise<{
    $request: FetchDownload | MYDownload | WXDownload | XhrDownload
    tempFilePath: string
    filePath: string
    statusCode: any
  }>

  /**
   * 对应微信/支付宝小程序的 uploadFile
   * */
  uploadFile(
    options: Partial<UploadFileConfig> &
      Pick<UploadFileConfig, 'url' | 'file' | 'fileKey'> & {
        onUploadProgress?: ProgressHandler
      },
  ): Promise<{
    $request: FetchUpload | MYUpload | WXUpload | XhrUpload
    data: any
    statusCode: number
    headers: HttpHeaders
  }>

  get<T = any>(
    url: string,
    data?: RequestData,
    options?: Partial<Pick<HttpConfig, Exclude<keyof HttpConfig, 'method'>>>,
  ): Promise<T>

  post<T = any>(
    url: string,
    data?: RequestData,
    options?: Partial<Pick<HttpConfig, Exclude<keyof HttpConfig, 'method'>>>,
  ): Promise<T>

  put<T = any>(
    url: string,
    data?: RequestData,
    options?: Partial<Pick<HttpConfig, Exclude<keyof HttpConfig, 'method'>>>,
  ): Promise<T>

  delete<T = any>(
    url: string,
    data?: RequestData,
    options?: Partial<Pick<HttpConfig, Exclude<keyof HttpConfig, 'method'>>>,
  ): Promise<T>
}

export default Http
export {
  ConfigInterceptor,
  DownloadFileConfig,
  DownloadResult,
  EngineResult,
  Env,
  ErrorHandler,
  Http,
  HttpConfig,
  HttpEngineConfig,
  HttpHeaders,
  HttpInterceptors,
  HttpSharedConfig,
  ProgressEvent,
  ProgressHandler,
  RequestData,
  ResponseInterceptor,
  ResponseType,
  UploadFileConfig,
}
