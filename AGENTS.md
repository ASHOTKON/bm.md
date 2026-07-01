# AGENTS.md

本文件为 AI 编程助手提供 bm.md 项目的高信号开发指南。`CLAUDE.md` 是本文件的软链接。

## 语言

所有交流、提交信息、代码注释一律使用 **简体中文**。

## 项目概述

bm.md 是 Markdown 排版工具，同时发布为：

- **Web 应用**：TanStack Start (React 19) + Vite 7 + Tailwind 4 + shadcn/ui，部署到 Cloudflare Workers / Vercel / 阿里云 ESA / 腾讯 EdgeOne 等（通过 Nitro）。
- **CLI**：`bmmd`，入口 `src/cli/index.ts`，由 `tsdown` 打包到 `bin/bmmd.mjs` 后通过 npm 发布。
- **REST API + MCP Server**：通过 oRPC 暴露 Markdown 处理能力。

> ⚠️ **核心架构约定**：`render` / `parse` / `extract` / `lint` 四个 Markdown 工具的输入输出 Schema 集中在 `src/lib/markdown/definitions.ts`。CLI、API 路由 (`src/routes/api.$.ts`)、MCP 路由 (`src/routes/mcp.ts`) 都从此文件复用 schema 与处理函数。**新增/修改工具时必须先改 definitions.ts**，否则三端会失去同步。

## 常用命令

```bash
pnpm dev                    # 开发服务器，端口 2663
pnpm build                  # 先 openapi:generate，再 vite build（顺序不可换）
pnpm build:cli              # 仅打包 CLI 到 bin/
pnpm openapi:generate       # 生成 OpenAPI
pnpm typecheck              # tsc --noEmit
pnpm lint:fix               # eslint --fix（pre-commit 通过 simple-git-hooks 自动对暂存文件执行）

# 测试（Vitest 4，配置内嵌于 vite.config.ts，NODE_ENV=test 时关闭 nitro 插件）
pnpm test                                             # 跑所有
pnpm test src/lib/markdown/extract/text.test.ts      # 单文件
pnpm test --grep "keeps paragraph"                   # 按名称
pnpm test --watch

# 安装依赖：因为是 CLI + 应用混合产物，所有运行时依赖都列在 devDependencies（lock 入产物由 tsdown 内联）
pnpm add -D <package>

# shadcn 组件（绝不手改 src/components/ui/）
pnpm shadcn add <component>
pnpm shadcn add shimmer-button --registry @magicui
```

## 项目结构

```
src/
├── cli/             # bmmd CLI 入口（被 tsdown 打包到 bin/）
├── components/ui/   # shadcn 生成，CLI 管理，禁止手改
├── config/          # appConfig 等共享常量
├── env/             # 环境变量统一入口（VITE_* 客户端可见，其余仅 server getter）
├── lib/
│   ├── markdown/
│   │   ├── definitions.ts   # ⭐ CLI / API / MCP 共享的工具定义（schema + 元信息）
│   │   ├── render|parse|extract|lint/   # 各工具实现
│   │   ├── worker.ts        # Web Worker 入口
│   │   └── api.ts/router.ts # oRPC 路由
│   ├── actions/             # 编辑器内可触发的命令面板动作
│   └── middleware/
├── routes/
│   ├── api.$.ts             # oRPC + OpenAPI catch-all
│   ├── mcp.ts               # MCP server endpoint
│   ├── api.upload.image.ts  # S3 上传
│   ├── _layout.*.tsx        # 页面路由（_layout 嵌套）
│   └── __root.tsx
├── routeTree.gen.ts # ⚠️ 自动生成，禁止手改
├── stores/          # Zustand，store 名称统一前缀 bm.md.
├── themes/          # Markdown / 代码高亮主题
└── sw.ts            # PWA Service Worker（vite-plugin-pwa injectManifest）

scripts/vite/        # 自定义 vite 插件（CSS/HTML 极简化、修复 nitro 内联动态导入、markdown 插件）
preset/              # Nitro 自定义 preset（aliyun-esa / tencent-edgeone）
```

## 部署 / Nitro Preset 自动检测

`vite.config.ts` 通过环境变量自动选择 preset：

- `process.env.AliUid` 存在 → 阿里云 ESA preset，并启用首页/`/about`/`/docs/*` 预渲染、把 PWA 输出改到 `dist/client`。
- `HOME=/dev/shm/home` 且 `TMPDIR=/dev/shm/tmp` → 腾讯 EdgeOne preset。
- 其他环境 → Nitro 自动检测（Cloudflare、Vercel 等）。

修改 `vite.config.ts` 时请保留这套检测逻辑，不要改成硬编码。

## 环境变量

通过 `src/env/index.ts` 统一访问，**禁止直接读 `process.env` / `import.meta.env`**。

| 前缀    | 范围              | 例子               |
| ------- | ----------------- | ------------------ |
| `VITE_` | 客户端 + 服务端   | `VITE_APP_URL`     |
| 无前缀  | 仅服务端 (getter) | `S3_ACCESS_KEY_ID` |

参考 `.env.example`。S3 配置用于 `/api/upload/image`。

## 代码风格（@antfu/eslint-config）

- 2 空格、单引号、无分号、多行尾随逗号、Stroustrup 大括号风格。
- 导入顺序：`node:` 内置 → 外部依赖 → `@/` 内部 → 相对路径（eslint 自动排序）。
- TypeScript：`import type` 导入纯类型；**禁用 `any`**；ES2022 + `strictNullChecks`。
- React 组件 PascalCase，文件 kebab-case；hooks `use` 前缀。
- 已启用 `babel-plugin-react-compiler`，**不要手动加 `useMemo` / `useCallback`** 除非 profiler 证明必要。
- `console.info` / `warn` / `error` 允许，`console.log` 触发 ESLint 警告。
- ESLint 已忽略 `bin/**`、`*.gen.ts`、`src/components/ui/**`、`src/hooks/use-mobile.tsx`。
- pre-commit 钩子（simple-git-hooks + lint-staged）会对暂存文件执行 `eslint --fix`，**不要绕过**。

## UI 规范

- 优先使用 Tailwind / shadcn 默认值；类名用 `cn`（`clsx` + `tailwind-merge`）合并。
- 可访问原语用 `@base-ui/react`；图标只用 `lucide-react`；纯图标按钮必须 `aria-label`。
- **禁止**：未授权动画、对布局属性 (`width/height/margin/padding`) 动画、渐变、`h-screen`（用 `h-dvh`）、任意 `z-[...]`（必须固定刻度）。
- 动画：JS 用 `motion/react`，入场用 `tw-animate-css`，仅动画 `transform` / `opacity`。

## 状态管理 / 持久化

```ts
export const useEditorStore = create<EditorState>()(
  persist(set => ({ /* ... */ }), { name: 'bm.md.editor' }),
)
```

Store 名称必须以 `bm.md.` 开头，否则会与现有 IndexedDB / localStorage 冲突。

## 路由

文件路由，`createFileRoute` 风格：

```ts
export const Route = createFileRoute('/api/upload/image')({
  server: { handlers: { POST: async ({ request }) => Response.json({ url }) } },
})
export const Route = createFileRoute('/_layout/')({ component: HomePage })
```

新增路由后 `pnpm dev` 会自动重生成 `src/routeTree.gen.ts`。

## 测试

测试与源文件同目录，命名 `*.test.ts`。Vitest 4 + 默认 Node 环境（无浏览器），所以 worker / DOM 相关代码需自行 mock 或拆分纯函数测试。

## MCP / 工具发现

`opencode.json` 已配置以下 MCP：`deepwiki`（文档 wiki）、`tanstack`（TanStack 官方 API）、`shadcn`、`lucide-icons`。优先使用它们查询最新 API，**不要**默认依赖 `context7`（未配置）。

## 易错点速查

| 不要                                        | 要                                               |
| ------------------------------------------- | ------------------------------------------------ |
| 改 `src/components/ui/` 或 `*.gen.ts`       | 用 shadcn CLI 重新生成                           |
| 直接读 `process.env`                        | 走 `@/env`                                       |
| 新增 markdown 工具时只改 CLI 或 API 一端    | 先改 `src/lib/markdown/definitions.ts`，三端复用 |
| 调换 `pnpm build` 步骤顺序                  | 必须先 `openapi:generate` 再 `vite build`        |
| 引入新图标库                                | 用 `lucide-react`                                |
| 用 `any` / 动画布局属性 / 渐变 / `h-screen` | 见 UI 规范                                       |
| 把 deps 加到 `dependencies`                 | 全部 `pnpm add -D`（CLI 通过 tsdown 内联）       |
