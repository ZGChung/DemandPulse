# 生产环境配置 (Production Environment Configuration)

部署 DemandPulse 到生产前，请按本文设置环境变量并完成检查项。参考项目根目录 `.env.example`。

## 一、环境变量

### 必选（无则应用或登录会失败）

| 变量                  | 说明                                    | 示例                                                  |
| --------------------- | --------------------------------------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | 应用对外访问地址                        | `https://demandpulse.example.com`                     |
| `NEXTAUTH_SECRET`     | NextAuth 会话加密密钥，需随机长字符串   | 使用 `openssl rand -base64 32` 生成                   |
| `NEXTAUTH_URL`        | 与 `NEXT_PUBLIC_APP_URL` 一致（含协议） | `https://demandpulse.example.com`                     |
| `DATABASE_URL`        | 数据库连接串（生产建议 PostgreSQL）     | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `GITHUB_ID`           | GitHub OAuth App Client ID              | 在 GitHub Developer Settings 创建                     |
| `GITHUB_SECRET`       | GitHub OAuth App Client Secret          | 同上                                                  |
| `DEEPSEEK_API_KEY`    | AI 处理用 DeepSeek API 密钥             | 以 `sk-` 开头                                         |

### 推荐（功能完整、安全与可观测）

| 变量                | 说明                         | 示例                                          |
| ------------------- | ---------------------------- | --------------------------------------------- |
| `REDIS_URL`         | 限流/缓存（无则内存限流）    | `rediss://default:xxx@xxx.upstash.io:6379`    |
| `SENTRY_DSN`        | 错误上报                     | Sentry 项目 DSN                               |
| `RESEND_API_KEY`    | 邮件发送（周报、管理员通知） | Resend API Key                                |
| `RESEND_FROM_EMAIL` | 发件人邮箱                   | `notifications@yourdomain.com`                |
| `EMAIL_ENABLED`     | 是否发真实邮件               | `true`                                        |
| `EMAIL_USE_MOCK`    | 生产应关闭 mock              | `false`                                       |
| `CRON_SECRET`       | 定时任务鉴权（周报、聚类）   | 随机字符串，与 Vercel Cron 等配置一致         |
| `PLUGIN_API_KEY`    | 插件/外部调用 API 鉴权       | 随机字符串                                    |
| `ENCRYPTION_KEY`    | 字段级加密（Base64）         | 生产建议开启 `ENCRYPTION_ENABLED=true` 并配置 |

### 可选

| 变量                        | 说明                           |
| --------------------------- | ------------------------------ |
| `NEXT_PUBLIC_APP_NAME`      | 应用名称，默认 DemandPulse     |
| `RATE_LIMIT_MAX_REQUESTS`   | 限流窗口内最大请求数，默认 100 |
| `RATE_LIMIT_WINDOW_MS`      | 限流窗口毫秒数，默认 900000    |
| `ENABLE_CLAUDE_CODE_PLUGIN` | 是否启用 Claude Code 插件能力  |
| `ENABLE_AI_PROCESSING`      | 是否启用 AI 处理与聚类         |

## 二、GitHub OAuth（Vercel 必做）

否则点击「Sign in with GitHub」会跳转到 GitHub 报错或回调 404。

1. **创建 GitHub OAuth App**  
   GitHub → Settings → Developer settings → OAuth Apps → New OAuth App。
   - Application name: 任意（如 DemandPulse）
   - Homepage URL: `https://demand-pulse.vercel.app`（或你的生产域名）
   - Authorization callback URL: **必须为** `https://demand-pulse.vercel.app/api/auth/callback/github`（与 `NEXTAUTH_URL` 一致，且无多余空格）

2. **拿到 Client ID 和 Client Secret**  
   创建后复制 Client ID 和生成一个 Client secret。

3. **在 Vercel 里配置**  
   Project → Settings → Environment Variables，添加：
   - `GITHUB_ID` = 上一步的 Client ID（不要填 `test` 或占位符）
   - `GITHUB_SECRET` = 上一步的 Client secret
   - `NEXTAUTH_URL` = `https://demand-pulse.vercel.app`（与 callback 同源）
   - `NEXTAUTH_SECRET` = 随机字符串（如 `openssl rand -base64 32`）

4. **重新部署**  
   保存变量后触发一次 Redeploy，使新环境变量生效。

## 三、部署前检查清单（其他）

- [ ] `NEXTAUTH_SECRET`、`NEXTAUTH_URL`、`NEXT_PUBLIC_APP_URL` 已设置且 URL 一致
- [ ] `DATABASE_URL` 指向生产数据库（已执行迁移或 `prisma db push`）
- [ ] GitHub OAuth 应用回调 URL 已包含 `{NEXTAUTH_URL}/api/auth/callback/github`
- [ ] 生产环境关闭 mock：`EMAIL_USE_MOCK=false`，并配置 `RESEND_*`
- [ ] 若使用 Vercel Cron：在 Vercel 中配置 `CRON_SECRET`，与请求头或查询参数一致
- [ ] 敏感变量未提交到代码库，仅通过平台环境或密钥管理配置

## 四、部署方式简述

- **Vercel**：在 Project Settings → Environment Variables 中配置上述变量，部署分支触发构建。
- **Docker**：使用 `docker compose up --build` 时通过 `env_file: .env` 或 `environment` 注入；镜像内不打包 `.env`。
- 更多见 README「Running with Docker」与 `doc/MONITORING.md`（监控与可观测）。
