# @livelybone/easy-request
[![NPM Version](http://img.shields.io/npm/v/@livelybone/easy-request.svg?style=flat-square)](https://www.npmjs.com/package/@livelybone/easy-request)
[![Download Month](http://img.shields.io/npm/dm/@livelybone/easy-request.svg?style=flat-square)](https://www.npmjs.com/package/@livelybone/easy-request)
![gzip with dependencies: 8kb](https://img.shields.io/badge/gzip--with--dependencies-kb-brightgreen.svg "gzip with dependencies: 8kb")
![typescript](https://img.shields.io/badge/typescript-supported-blue.svg "typescript")
![pkg.module](https://img.shields.io/badge/pkg.module-supported-blue.svg "pkg.module")

> `pkg.module supported`, 天然支持 tree-shaking, 使用 es module 引用即可

[English Document](./README.md)

一个以支持所有JavaScript运行环境为目的、简单易用的http请求库。

---
功能清单：
1. 发起请求，自定义 header，responseType，withCredentials，timeout
2. 取消请求
3. 接收响应
4. 获取上传/接收进度

## repository
https://github.com/livelybone/easy-request.git

## Demo
https://github.com/livelybone/easy-request#readme

## Run Example
你可以通过运行项目的 example 来了解这个组件的使用，以下是启动步骤：

1. 克隆项目到本地 `git clone https://github.com/livelybone/easy-request.git`
2. 进入本地克隆目录 `cd your-module-directory`
3. 安装项目依赖 `npm i`(使用 taobao 源: `npm i --registry=http://registry.npm.taobao.org`)
4. 启动服务 `npm run dev`
5. 在你的浏览器看 example (地址通常是 `http://127.0.0.1:3000/examples/test.html`)

## Installation
```bash
npm i -S @livelybone/easy-request
```

## Global name - The variable the module exported in `umd` bundle
`EasyRequest`

## Interface
去 [index.d.ts](./index.d.ts) 查看可用方法和参数

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

在 HTML 文件中直接引用，你可以在 [CDN: unpkg](https://unpkg.com/@livelybone/easy-request/lib/umd/) 看到你能用到的所有 js 脚本
```html
<-- 然后使用你需要的 -->
<script src="https://unpkg.com/@livelybone/easy-request/lib/umd/<--module-->.js"></script>
```
