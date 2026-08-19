# Forge Agent

中文优先、项目感知的 Coding Agent Web 应用。它先读取 GitHub 仓库的可验证上下文，再把用户的自然语言目标整理为可审阅的任务说明（Task Spec），并在用户批准后运行 Agent。

当前版本的重点是把“理解项目”“明确责任边界”“基于证据交付”做成一个可见的工作流，而不是让模型直接获得不受约束的代码写入权限。

> English UI is available from the header. Product copy and documentation are currently Chinese-first.

## 当前能力

- 三种入口：自由对话、代码工作台、Issue 任务
- GitHub 只读上下文：仓库信息、README、文件树、开放 Issue
- 单文件和批量读取：最多选择 100 个文件，解码后总量限制 10 MB
- 项目摘要：文件数、字节数、行数与 512 KB 上下文分块数，不会自动将全文塞进模型上下文
- 读取证据链：记录 `repository / path / SHA / readAt`，在 Task Spec 与 Agent trajectory 中展示
- Task Spec 批准门控：未经用户批准，Agent 不应进入执行阶段
- Provider：Mock、OpenAI-compatible、Anthropic
- BYOK（Bring Your Own Key）：用户在页面中填写自己的模型 Key、Base URL 和模型名

## 重要边界

目前是**只读探索版本**。它不会：

- 写入本地或 GitHub 文件
- 创建分支、Pull Request、Issue 或自动合并
- 执行 Shell、测试命令或部署命令
- 将批量读取的文件正文自动交给模型

这些限制是有意的。后续接入写代码、运行测试和创建 PR 时，应为每一种高风险工具加上明确的权限、执行沙箱、可审阅 diff 和验证回执，而不是简单放开 Agent 权限。

## 架构

```text
Browser (React + Vite)
  |  POST /api/*
  v
Forge API (Node HTTP server)
  |-- GitHub read-only client
  |-- Provider adapter
  |     |-- OpenAI-compatible /chat/completions
  |     `-- Anthropic /v1/messages
  `-- Agent loop -> NDJSON event stream
```

前端和 API 必须分开部署：GitHub Pages 只能承载静态前端，不能运行当前 Node API，也不应把厂商 API Key 写进前端构建产物。

## GitHub Pages

推送到 `main` 会通过 GitHub Actions 自动构建并部署 `apps/web` 到 GitHub Pages。页面地址为：

`https://z-y-m-123.github.io/forge-agent-harness/`

该静态站默认是 Mock 演示：不配置 API 时，模型连接面板只允许 Mock，避免用户的真实 Key 被发送到不存在的同源 `/api`。要启用真实 BYOK 和 GitHub 只读上下文，需要部署独立的 Forge API，并在 Pages 构建时提供 `VITE_API_BASE_URL=https://your-api.example.com`；该 API 必须启用 HTTPS 和 CORS 白名单。

仓库提供 `render.yaml` 作为 API 部署起点。部署后在 GitHub Actions 的 Repository Variable 中设置 `FORGE_API_BASE_URL`，并推送一次 `main` 触发 Pages 重建。API 使用 `FORGE_ALLOWED_ORIGINS` 白名单（默认已填 Pages 域名）和 `/healthz` 健康检查。详细步骤见 [docs/provider-setup.md](docs/provider-setup.md)。

## 技术栈

- Frontend: React 18, TypeScript, Vite, Lucide
- Backend: Node.js HTTP server, TypeScript
- Testing: Vitest, Testing Library, Playwright
- Package manager: pnpm 11

## 本地运行

### 前置条件

- Node.js `22.22.2+`、`24.15.0+` 或 `26+`
- pnpm `11.7.0`

### 安装与启动

```powershell
pnpm install

# 终端 1：API（默认 http://127.0.0.1:8787）
pnpm api:dev

# 终端 2：Web（Vite 会将 /api 代理到 8787）
pnpm dev
```

然后打开 Vite 输出的本地地址。未填写模型连接时，可选择 `Mock 演示`体验完整前端流程。

### 检查命令

```powershell
pnpm api:test
pnpm api:typecheck
pnpm test
pnpm typecheck
pnpm build
pnpm test:e2e
```

## 用户自带 API Key（BYOK）

点击页头的“模型连接”，用户可选择：

| 类型 | 适用厂商 | Base URL 示例 |
| --- | --- | --- |
| OpenAI-compatible | OpenAI、DeepSeek、通义、智谱及兼容接口 | `https://api.deepseek.com/v1` |
| Anthropic | Claude 原生 Messages API | `https://api.anthropic.com` |
| Mock | 无需密钥的界面演示 | 不适用 |

BYOK 的默认安全规则：

- Key 仅保存于 React 当前会话内存；刷新或关闭页面即失效
- 不写入 `localStorage`、sessionStorage、URL、仓库文件或 Agent event
- 前端通过 HTTPS 把 Key 交给 Forge API；API 仅为这一次运行创建 Provider，不注册为全局配置
- API 不应记录请求体、`Authorization` 或 API Key；上游报错对用户只返回脱敏后的通用错误
- 外部 Base URL 必须为 HTTPS；仅 `localhost` 与 `127.0.0.1` 允许用于本机开发

生产环境还应在反向代理或日志平台中验证敏感请求体不会被采集。

完整配置见 [docs/provider-setup.md](docs/provider-setup.md)。

## GitHub 仓库上下文

在首页输入 `owner/name` 后，Forge API 会调用 GitHub API，读取：

1. 仓库描述和默认分支
2. README
3. 文件树
4. 开放 Issue

公开仓库通常不需要 Token。私有仓库或较高的速率限制需要 API 服务端配置 `GITHUB_TOKEN`。当前 GitHub Token 属于服务端部署配置，不会出现在浏览器中。

工作台读取文件正文后，会将元数据作为“GitHub 事实”保留在证据链中。批量读取只生成摘要，避免模型在没有任务相关性的情况下消耗大段上下文。

## API 概览

| Endpoint | 作用 | 写操作 |
| --- | --- | --- |
| `POST /api/agent/runs` | 运行 Agent，返回 NDJSON 事件流 | 否 |
| `POST /api/github/context` | 获取仓库概览 | 否 |
| `POST /api/github/file` | 读取单个安全仓库相对路径 | 否 |
| `POST /api/github/files` | 批量读取已选文件 | 否 |

`POST /api/agent/runs` 可附带临时 BYOK 连接：

```json
{
  "taskId": "retry-investigation",
  "message": "分析重试失败原因，但不要改动代码。",
  "approved": true,
  "connection": {
    "provider": "openai-compatible",
    "apiKey": "user-provided-key",
    "baseUrl": "https://api.deepseek.com/v1",
    "model": "deepseek-chat"
  }
}
```

## 部署建议

- Web：GitHub Pages、Cloudflare Pages 或 Vercel
- API：Cloudflare Workers、Render、Railway、Fly.io 或 VPS
- API：必须启用 HTTPS、配置 CORS 白名单、限制请求体大小、脱敏应用日志并设置限流
- Web：通过环境变量配置 API 基址，禁止将任何供应商 Key 编译到静态文件中

GitHub Pages 适合部署 Web 前端，但仍需一个独立的 API 服务承载 GitHub 访问、模型转发和安全审计。

## 下一阶段

1. 将自由描述转成可编辑的 Task Spec，并要求用户确认范围、验收标准与风险
2. 加入项目索引、检索和上下文预算器，让上下文选择有可解释的依据
3. 引入工具权限策略与执行沙箱，先支持只读命令，再支持有审阅的写入
4. 生成候选 diff、测试回执与 PR 草稿，仍保持用户最终确认
5. 为多 Agent 引入职责边界：协调、探索、规划、实现、验证和评审分别产出可追溯事件

## 贡献与安全反馈

贡献前请运行相关测试、类型检查和构建。涉及密钥、鉴权、GitHub 权限、命令执行或代码写入的变更，应同时说明威胁模型、默认拒绝策略和验证方式。

不要在 Issue、测试 fixture、日志或提交历史中提交真实 API Key、GitHub Token 或私有仓库内容。

## License

仓库尚未声明开源许可证。在确定商业使用、二次分发或接受外部贡献前，请先补充明确许可证。
