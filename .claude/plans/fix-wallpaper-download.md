# 修复壁纸直接下载

## 问题
点击下载时，浏览器打开原图而非下载到本地。

## 原因
当前 `handleDownload` 获取原图 URL 后直接跳转外部链接，浏览器会显示图片而非下载。

## 解决方案
创建下载代理 API，添加 `Content-Disposition: attachment` 头强制下载。

## 文件变更

### 修改文件

| 文件 | 修改内容 |
|------|----------|
| `app/api/wallhaven/wallpaper/[id]/route.ts` | 添加下载代理功能 |
| `app/[locale]/tools/wallhaven-gallery/page.tsx` | 调用下载 API |

## 实现步骤

### Step 1: 添加下载代理 API
在 `app/api/wallhaven/wallpaper/[id]/route.ts` 中添加 `/download` 路由处理器：
- 接收壁纸 ID
- 获取原图 URL
- 使用 `fetch` 代理请求
- 设置响应头：
  - `Content-Type`: 文件 MIME 类型
  - `Content-Disposition`: `attachment; filename="wallhaven-{id}.{ext}"`
- 返回原图流（使用 `Readable.toWeb()`）

### Step 2: 修改页面下载逻辑
在 `page.tsx` 中修改 `handleDownload`：
- 调用 `/api/wallhaven/wallpaper/${id}/download`
- 创建隐藏 `<a>` 标签触发下载
