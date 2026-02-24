# Claude Code 官方文档与集成说明

DemandPulse 通过 **Claude Code 插件** 与 **Hooks** 与 Claude Code 集成，将对话中的需求提交到后端。本文汇总官方文档入口与集成方式。

## 官方文档入口

- **文档索引（推荐）**: https://code.claude.com/docs/llms.txt — 可发现全部页面
- **Claude Code 概览**: https://platform.claude.com/docs/en/claude-code
- **Hooks 参考**: https://code.claude.com/docs/en/hooks.md — 事件、输入/输出 JSON、exit code
- **Hooks 指南**: https://code.claude.com/docs/en/hooks-guide.md
- **插件开发**: https://code.claude.com/docs/en/plugins.md
- **插件参考**: https://code.claude.com/docs/en/plugins-reference.md — manifest、hooks、skills、MCP
- **Skills**: https://code.claude.com/docs/en/skills.md

## Hook 事件（与需求采集相关）

| 事件                          | 触发时机             | 典型用途                                     |
| ----------------------------- | -------------------- | -------------------------------------------- |
| `UserPromptSubmit`            | 用户提交 prompt 之前 | 可读取用户输入，做校验或上报                 |
| `Stop`                        | Claude 结束回复时    | 可读取 `transcript_path`，解析对话并上报需求 |
| `PostToolUse`                 | 某次 tool 调用成功后 | 用于与工具调用相关的侧效应（如格式化）       |
| `SessionStart` / `SessionEnd` | 会话开始/结束        | 加载上下文或清理                             |

Hook 输入（stdin）为 JSON，公共字段包括：`session_id`、`transcript_path`、`cwd`、`permission_mode`、`hook_event_name`。

- 对 **Stop**：可用 `transcript_path` 读取对话 JSONL，解析最后一条用户消息并提交到 DemandPulse（需用户同意与 env 开关）。
- 对 **UserPromptSubmit**：若官方 schema 中包含用户输入的 prompt 文本，也可在此处上报（需以实际 schema 为准）。

插件中 Hooks 配置写在 `hooks/hooks.json`，命令可使用 `${CLAUDE_PLUGIN_ROOT}` 指向插件根目录。

## DemandPulse 当前集成

1. **Skill**
   - `/demandpulse:submit`（见 `claude-plugin-demandpulse/skills/submit-requirement/SKILL.md`）
   - 用户或 Claude 主动调用，将当前对话中的需求提交到 DemandPulse。

2. **后端**
   - `POST /api/plugin/requirements`，Header：`x-api-key: <PLUGIN_API_KEY>`
   - 与 `doc/PLUGIN-INTEGRATION.md` 及 E2E 脚本一致。

3. **已实现：Stop Hook + 自动上报**
   - 插件在 **Stop** 事件触发时运行 `bin/hook-handler.mjs`，读取 `transcript_path` 的 JSONL 对话，解析最后一条用户消息；若满足长度/关键词且 `ENABLE_AUTO_DETECTION=true`、`DEFAULT_DATA_COLLECTION_CONSENT=true`，则 POST 到 `/api/plugin/requirements`。
   - 默认关闭，需用户显式设置环境变量开启并同意数据收集。
   - `hooks/hooks.json` 已注册 **Stop** 与 **PostToolUse**（PostToolUse 仅打日志，不提交需求）。

## 环境变量（插件侧）

| 变量                              | 说明                                                |
| --------------------------------- | --------------------------------------------------- |
| `DEMANDPULSE_API_URL`             | 后端地址，默认 `http://localhost:3000`              |
| `DEMANDPULSE_API_KEY`             | 与后端 `PLUGIN_API_KEY` 一致                        |
| `ENABLE_AUTO_DETECTION`           | `true` 时启用 Stop 时自动检测并上报（默认 `false`） |
| `DEFAULT_DATA_COLLECTION_CONSENT` | 自动上报时是否视为已同意收集（默认 `false`）        |

## 参考

- 安装与 E2E：`doc/PLUGIN-INTEGRATION.md`
- 后端插件 API：`app/api/plugin/requirements/route.ts`
