import { blobToBase64 } from 'base64-blob'
import { objectToFormData } from 'object-to-formdata'
import { stringify } from 'qs'
import {
  DownloadResponse,
  HttpHeaders,
  RequestConfig,
  RequestData,
  RequestSharedConfig,
} from './type'

export function joinUrl(
  baseUrl: string,
  url: string,
  data?: RequestData | null,
) {
  const $url = /^https?:\/\//.test(url)
    ? url
    : `${baseUrl}///${url}`.replace(/\/{3,}/g, '/')
  if (!data) return $url
  return `${$url}?&${stringify(data)}`.replace(/\?+&+/, '?')
}

export function getBlobUrl(blob?: Blob) {
  if (!blob) return Promise.resolve('')

  if (URL && URL.createObjectURL) {
    const url = URL.createObjectURL(blob)
    console.warn(
      `ObjectURL \`${url}\` has been created in the app, make sure you will revoke it at the right time in you code by script \`URL.revokeObjectURL(${url})\``,
    )
    return Promise.resolve(url)
  }
  return blobToBase64(blob)
}

export function strJsonParse(str?: string | null) {
  if (!str) return str
  try {
    return JSON.parse(str)
  } catch (e) {
    return str
  }
}

export function dealRequestData(
  data: RequestData | null | undefined,
  contentType?: string,
  convertFormDataOptions?: RequestSharedConfig['convertFormDataOptions'],
) {
  if (!data) return null

  if (data instanceof FormData) return data

  const { customConvertFn, ...restOptions } = convertFormDataOptions || {}
  return contentType === 'multipart/form-data'
    ? customConvertFn
      ? customConvertFn(data)
      : objectToFormData(data, restOptions)
    : contentType === 'application/json'
    ? JSON.stringify(data)
    : stringify(data)
}

export function mergeHeaders(
  tHeaders: HttpHeaders,
  headers?: HttpHeaders,
): HttpHeaders {
  const $headers = headers || tHeaders
  return Object.keys($headers).reduce(
    (pre, k) => {
      if (k.toLowerCase() !== 'content-type') pre[k] = $headers[k]
      else pre['Content-Type'] = $headers[k]
      return pre
    },
    headers ? mergeHeaders(tHeaders) : {},
  )
}

export function mergeConfig<T1 extends RequestConfig, T2 extends any>(
  conf1: T1,
  conf2?: T2,
): any {
  const config = {
    ...conf1,
    ...conf2,
    headers: mergeHeaders(conf1.headers, conf2 && conf2.headers),
  }

  config.method = config.method.toUpperCase()
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
}

export function getMsg(obj: any, defaultMsg = '') {
  if (typeof obj === 'object' && obj !== null) {
    const keys = [
      'message',
      'msg',
      'error',
      'err',
      'errMessage',
      'errMsg',
      'errorMessage',
      'errorMsg',
    ]
    let message = defaultMsg
    keys.some(k => {
      const msg = obj[k] || obj[k.toLowerCase()]
      if (msg) message = msg
      return !!msg
    })
    return message
  }
  return obj || defaultMsg
}

export function getFileName(headers: DownloadResponse['headers']) {
  const disposition = headers && headers['content-disposition']
  if (!disposition) return ''
  const matched = disposition.match(/(file)?name\s*=\s*([^=]+)($|,)/)
  return (matched && matched[2]) || ''
}
