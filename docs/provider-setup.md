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

当前真实 Provider 只负责一次 Chat Completions 请求并产出 `model.message`；文件读取、写入、Shell 和 GitHub 操作仍由后续 Harness 工具层负责。

