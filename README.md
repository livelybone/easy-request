# @livelybone/easy-request
[![NPM Version](http://img.shields.io/npm/v/@livelybone/easy-request.svg?style=flat-square)](https://www.npmjs.com/package/@livelybone/easy-request)
[![Download Month](http://img.shields.io/npm/dm/@livelybone/easy-request.svg?style=flat-square)](https://www.npmjs.com/package/@livelybone/easy-request)
![gzip with dependencies: 8kb](https://img.shields.io/badge/gzip--with--dependencies-kb-brightgreen.svg "gzip with dependencies: 8kb")
![typescript](https://img.shields.io/badge/typescript-supported-blue.svg "typescript")
![pkg.module](https://img.shields.io/badge/pkg.module-supported-blue.svg "pkg.module")

> `pkg.module supported`, which means that you can apply tree-shaking in you project

[中文文档](./README-CN.md)

A easy-to-use http request library to support all javascript runtime environments.

---
Feature list:
1. Initiate request. customize header, responseType, withCredentials, timeout
2. Cancel the request
3. Receive responses
4. Get the upload/receive progress

## repository
https://github.com/livelybone/easy-request.git

## Demo
https://github.com/livelybone/easy-request#readme

## Run Example
Your can see the usage by run the example of the module, here is the step:

1. Clone the library `git clone https://github.com/livelybone/easy-request.git`
2. Go to the directory `cd your-module-directory`
3. Install npm dependencies `npm i`(use taobao registry: `npm i --registry=http://registry.npm.taobao.org`)
4. Open service `npm run dev`
5. See the example(usually is `http://127.0.0.1:3000/examples/test.html`) in your browser

## Installation
```bash
npm i -S @livelybone/easy-request
```

## Global name - The variable the module exported in `umd` bundle
`EasyRequest`

## Interface
See what method or params you can use in [index.d.ts](./index.d.ts)

## Usage
```js
import { Http, EngineName } from '@livelybone/easy-request'

const http = new Http(
  EngineName.XHR,
  {
    baseURL: 'https://api.hostname.com',
    responseType: 'json',
    headers: { 'Content-Type': 'application/json' },
    method: 'GET',
    timeout: 30000,
    withCredentials: false,
  },
)

// interceptors
http.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = token
  return config
})

http.interceptors.response.use(response => {
  return response.data
})

const data = { param: '1' }

http.get('/api1').then(res => {
  // ... do something
})

http.get('/api2', data, { responseType: 'text' }).then(res => {
  // ... do something
})

http.post('/api2', data, {
  responseType: 'text',
  headers: { 'Content-Type': 'multipart/form-data' },
}).then(res => {
  // ... do something
})
// ... other methods: put, delete, downloadFile, uploadFile
```

Use in html, see what your can use in [CDN: unpkg](https://unpkg.com/@livelybone/easy-request/lib/umd/)
```html
<-- use what you want -->
<script src="https://unpkg.com/@livelybone/easy-request/lib/umd/<--module-->.js"></script>
```
