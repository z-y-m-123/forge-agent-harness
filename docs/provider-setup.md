# Provider 配置

## 用户自带 Key（BYOK）

正式网站建议使用网页里的“模型连接”入口，让每位用户自己提供 Key。连接配置只在当前 React 会话内存中保存，随一次运行请求通过 HTTPS 发给 API；不会写入 `localStorage`、URL、事件轨迹或服务端日志，关闭页面即失效。

网页连接支持 OpenAI-compatible（OpenAI、DeepSeek、通义、智谱等）、Anthropic 和无需 Key 的 Mock 演示。后端 `POST /api/agent/runs` 接受临时 `connection` 字段：

```json
{"taskId":"task-1","message":"解释这个重试问题","approved":true,"connection":{"provider":"openai-compatible","apiKey":"用户本次输入的 Key","baseUrl":"https://api.deepseek.com/v1","model":"deepseek-chat"}}
```

外部 `baseUrl` 必须使用 HTTPS；本机 `localhost`/`127.0.0.1` 可用于开发。服务端收到请求后只创建一次 Provider，不把连接配置注册到全局 Provider Registry。

## 可选云端 API 部署

本项目推荐本地运行 Web 与 API。若需要让其他用户访问，可通过仓库根目录的 `render.yaml` 部署到 Render，或部署到任何支持 Node 22 和 HTTPS 的服务。API 必须配置：

```text
FORGE_ALLOWED_ORIGINS=http://localhost:5173
FORGE_PROVIDER=mock
HOST=0.0.0.0
```

部署成功后，把 Web 开发服务器或自己的前端部署配置为 `VITE_API_BASE_URL=https://your-api.example.com`。不会把模型 Key 写入前端构建产物。

`GET /healthz` 会返回 `{ "status": "ok" }`，可用于 Render、Railway 或反向代理健康检查。API 对浏览器请求只允许 `FORGE_ALLOWED_ORIGINS` 中的确切来源，并拒绝其他来源的跨域预检。

Forge API 默认使用不会访问网络的 `mock` Provider。要接入 DeepSeek 或其他 OpenAI-compatible 厂商，在运行 API 服务的终端设置服务端环境变量：

```powershell
$env:FORGE_PROVIDER = "deepseek"
$env:FORGE_MODEL_API_KEY = "你的服务端 API Key"
$env:FORGE_MODEL_BASE_URL = "https://api.deepseek.com/v1"
$env:FORGE_MODEL_NAME = "deepseek-chat"
pnpm api:dev
```

OpenAI 可使用：

```powershell
$env:FORGE_PROVIDER = "openai"
$env:FORGE_MODEL_BASE_URL = "https://api.openai.com/v1"
$env:FORGE_MODEL_NAME = "gpt-4o-mini"
```

其他兼容厂商只需要替换 Provider 名称、Base URL 和模型名。Key 只由 `apps/api` 读取，不会进入浏览器请求、事件轨迹或 Git 提交。

Anthropic 使用原生 Messages API：

```powershell
$env:FORGE_PROVIDER = "anthropic"
$env:FORGE_MODEL_API_KEY = "你的服务端 API Key"
$env:FORGE_MODEL_BASE_URL = "https://api.anthropic.com"
$env:FORGE_MODEL_NAME = "claude-3-5-sonnet-latest"
pnpm api:dev
```

当前真实 Provider 只负责一次模型请求并产出 `model.message`；文件读取、写入、Shell 和 GitHub 操作仍由后续 Harness 工具层负责。

## GitHub 只读上下文

API 已提供 `POST /api/github/context`，请求体为：

```json
{"repository":"owner/name"}
```

公开仓库可以不配置 Token；访问私有仓库或提高速率限制时，在 API 服务端设置：

```powershell
$env:GITHUB_TOKEN = "你的服务端 GitHub Token"
$env:GITHUB_API_BASE_URL = "https://api.github.com"
```

当前只读取仓库元数据、README、文件树和开放 Issue，不创建分支、不写文件、不创建 PR。
