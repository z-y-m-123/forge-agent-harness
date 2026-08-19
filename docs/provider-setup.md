# Provider 配置

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
