# iFlow CLI 项目上下文

## 项目概述

**your-new-tab** 是一款 **AI 搜索优先**的浏览器新标签页扩展：打开新标签 → 输入问题 → 一键发送到 Google AI、Metaso、Grok 或 X 等搜索提供商。基于 WXT 框架构建，使用 React 19 和 TypeScript 开发。

### 核心卖点
- **AI 搜索中心**：内置 Google AI Mode、Metaso、Grok、X 四个提供商；用户可在弹窗里添加任意带 `{query}` 模板的搜索/AI 站点，并设定默认提供商
- **搜索历史快捷复用**：搜索框内 ArrowUp/ArrowDown 浏览最近 20 条历史，输入前缀后再按方向键则按前缀筛选
- **隐私优先**：所有配置仅写入 `localStorage`；不申请 `tabs` 权限、无内容脚本、无远程代码、无遥测；图标统一经过白名单消毒后渲染

### 辅助功能
- **实时时钟与日期**
- **个性化快捷方式**：通过弹窗 JSON 编辑器维护
- **动态背景**：每日从 Unsplash 和 Picsum API 轮换
- **动图背景**：可选 GIF/APNG/WebP/MP4/WebM/MOV 直链，风车按钮顺序切换
- **自适应布局**：覆盖主流桌面/笔记本分辨率
- **智能降级**：所有外部请求均带超时与回退

## 技术栈

- **框架**: WXT (Web Extension Framework)
- **前端**: React 19 + TypeScript
- **构建工具**: Vite
- **样式**: CSS3
- **包管理**: pnpm
- **代码编辑器**: Ace Editor (用于 JSON 编辑)

## 项目结构

```
├── entrypoints/              # 扩展入口点
│   ├── newtab/              # 新标签页主界面
│   │   ├── index.html       # HTML 入口
│   │   ├── main.tsx         # React 主组件
│   │   └── newtab.css       # 样式文件
│   ├── popup/               # 配置弹窗界面
│   │   ├── index.html       # 弹窗 HTML
│   │   ├── App.tsx          # 配置组件
│   │   ├── main.tsx         # 弹窗初始化
│   │   └── App.css          # 弹窗样式
│   └── background.ts        # 后台脚本（仅负责拉取背景图）
├── public/                  # 静态资源（图标由 assets/icon-source.svg 渲染）
├── assets/                  # 扩展图标源文件（SVG + 1024 PNG）
├── utils/                   # 工具函数
│   ├── browser.ts          # 浏览器兼容性工具
│   ├── searchProviders.ts  # 搜索提供商定义与持久化
│   └── searchHistory.ts    # 搜索历史读写与前缀过滤
└── wxt.config.ts           # WXT 配置文件
```

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式 (Chrome)
pnpm run dev

# 开发模式 (Firefox) - 解决 manifest v3 已知问题
pnpm run dev:firefox

# 构建生产版本 (Chrome)
pnpm run build

# 构建生产版本 (Firefox)
pnpm run build:firefox

# 打包为 ZIP (Chrome Web Store)
pnpm run zip

# 打包为 ZIP (Firefox Add-ons)
pnpm run zip:firefox

# TypeScript 类型检查
pnpm run compile
```

## 核心功能实现

### 1. AI 搜索中心（卖点）
- 内置提供商定义于 `utils/searchProviders.ts`：Google AI、Metaso、X、Grok
- 用户可在弹窗里增删提供商；自定义项与内置项在渲染时合并
- 选中的活跃提供商会持久化到 `localStorage`，并通过 `storage` 事件实现跨标签同步（无需 `tabs` 权限）
- 提交查询时按提供商 `urlTemplate` 中的 `{query}` 占位符替换并在新标签打开
- 提供商图标统一经过 `getSafeIconImageSrc` 白名单消毒（SVG → data URI；URL 仅允许 https）

### 2. 搜索历史
- 历史持久化在 `localStorage` 的 `searchHistory` 键下，最多 20 条
- 工具函数位于 `utils/searchHistory.ts`：`getSearchHistory` / `addSearchHistory` / `filterHistoryByPrefix`
- 新标签搜索框在 ArrowUp/ArrowDown 时按前缀（不区分大小写）过滤历史

### 3. 书签管理
- 支持三种数据源模式：
  - 内置默认书签（精选开发者工具）
  - 远程 JSON URL（支持跨域）
  - 直接粘贴 JSON 数据
- 本地缓存机制：每日自动刷新，支持手动刷新
- 跨标签同步通过 `storage` 事件实现（已移除后台广播逻辑）

### 4. 背景图片系统
- 多源图片获取：Unsplash 主源 + Picsum 备用源
- 后台脚本处理：避免 CORS 问题
- Base64 编码存储：提升性能和可靠性
- 本地缓存：带时间戳验证的缓存机制
- 手动切换：风车按钮即时刷新；如配置了动图背景 URL，风车顺序循环

### 5. 时间显示
- 实时更新（每秒刷新）
- 中文本地化格式
- 24小时制显示

## 配置说明

### 浏览器加载步骤

**Chrome/Edge:**
1. 访问 `chrome://extensions`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展"
4. 选择 `.output/chrome-mv3` 目录

**Firefox:**
1. 访问 `about:debugging`
2. 点击"此 Firefox"
3. 点击"加载临时附加组件"
4. 选择 `.output/firefox-mv2/manifest.json` 文件

### 扩展权限
- `host_permissions` 仅包含背景图来源：
  - `https://source.unsplash.com/*`
  - `https://picsum.photos/*`
  - `https://fastly.picsum.photos/*`
- 不申请 `tabs`、`storage`、`scripting` 等敏感权限

## 数据流架构

### AI 搜索数据流
1. 内置提供商 + 用户自定义在弹窗合并写入 `localStorage`
2. 新标签页加载时读取配置并渲染提供商选择器
3. 用户切换或新增提供商触发 `storage` 事件，所有打开的新标签实时同步
4. 提交查询时按 `urlTemplate` 替换 `{query}` 并在新标签打开

### 书签数据流
1. 用户通过弹窗配置书签源
2. 数据存储在 localStorage 中
3. 新标签页组件加载时读取配置
4. 根据配置模式获取书签数据
5. 数据缓存并每日自动刷新
6. 跨标签同步通过 `storage` 事件触发（不再使用后台广播）

### 背景图片数据流
1. 组件加载时检查本地缓存
2. 无缓存或缓存过期时请求新图片
3. 通过后台脚本获取图片（避免 CORS）
4. 转换为 Base64 并存储
5. 设置为背景并缓存时间戳
6. 手动刷新时清除缓存重新获取

## 开发规范

### 代码风格
- TypeScript 严格类型检查
- React 函数组件 + Hooks
- CSS 模块化设计
- 语义化 HTML 结构

### 错误处理
- 网络请求超时处理（15秒）
- 图片加载失败降级机制
- JSON 解析错误处理
- 本地存储异常处理

### 性能优化
- 图片 Base64 缓存
- 本地数据每日刷新机制
- React 组件优化
- 事件监听器清理

## 浏览器兼容性

- **Chrome**: Manifest V3 支持
- **Edge**: Manifest V3 支持  
- **Firefox**: Manifest V2（V3 存在已知问题）
- **跨浏览器 API**: 使用工具函数处理兼容性

## 部署说明

1. 运行 `pnpm run build` 构建生产版本
2. 运行 `pnpm run zip` 创建分发包
3. 上传到 Chrome Web Store 或 Firefox Add-ons
4. 遵循各商店的审核规范

## 扩展开发提示

- 使用 WXT 框架简化扩展开发流程
- 利用 React 19 的新特性优化性能
- 注意浏览器扩展的 CSP 限制
- 处理好跨域请求问题
- 保持向后兼容性

## 相关资源

- [WXT 文档](https://wxt.dev)
- [React 19 文档](https://react.dev)
- [Chrome 扩展开发文档](https://developer.chrome.com/docs/extensions/)
- [Firefox 扩展开发文档](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)