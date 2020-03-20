import { blobToBase64 } from 'base64-blob'
import flat from 'flat'
import { stringify } from 'qs'
import { HttpHeaders, RequestData } from './type'

export function flatObj(obj: any) {
  // const entries: { key: string; value: string | number | null | boolean | undefined | File | Blob | Function }[] = []
  return flat<
    any,
    {
      [key: string]:
        | string
        | number
        | null
        | boolean
        | undefined
        | File
        | Blob
        | Function
    }
  >(obj)
}

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

export function convertToFormData(data: any) {
  const formData = new FormData()
  const $data = flatObj(data)
  Object.keys($data).forEach(k => {
    const value = $data[k]
    if (typeof value === 'string' || value instanceof Blob) {
      formData.append(k, value)
    }
  })
  return formData
}

export function getBlobUrl(blob: Blob) {
  if (URL && URL.createObjectURL) {
    const url = URL.createObjectURL(blob)
    console.warn(
      `ObjectURL \`${url}\` has been created in the app, make sure you will revoke it at the right time in you code by script \`URL.revokeObjectURL(${url})\``,
    )
    return url
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
  headers: HttpHeaders,
) {
  if (!data) return null

  const contentType =
    headers[
      Object.keys(headers).find(
        k => k.toLowerCase().replace(/-+/g, '') === 'contenttype',
      )!
    ]
  return contentType === 'multipart/form-data'
    ? convertToFormData(data)
    : contentType === 'application/json'
    ? JSON.stringify(data)
    : stringify(data)
}
