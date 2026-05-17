export const zh = {
  lang: 'zh' as const,
  dir: 'ltr' as const,
  htmlTitle: 'Your New Tab — 一个标签页打通所有 AI 搜索',
  htmlDesc:
    '面向 AI 搜索的浏览器新标签页：一次输入直达 Google AI、Metaso、Grok、X，自带搜索历史、动态背景与可配置快捷方式。',
  nav: {
    features: '特性',
    faq: '常见问题',
    privacy: '隐私',
    github: 'GitHub',
    switchLang: 'English',
  },
  hero: {
    eyebrow: 'AI-Search-First New Tab',
    title: '一次输入，打通所有 AI 搜索',
    subtitle:
      '在新标签页里把你的问题一键送到 Google AI、Metaso、Grok、X，或任何你自己配置的搜索源。搜索历史用方向键回顾，背景每天自动焕新。',
    ctaInstall: '从 Chrome 商店安装',
    ctaFirefox: 'Firefox 版本',
    ctaSource: '查看源码',
    demoAlt: '产品演示动画',
  },
  features: {
    heading: '为什么选择 Your New Tab',
    intro: '把新标签页变成你最锋利的 AI 入口，而不是又一张需要再点一次的门面。',
    items: [
      {
        title: '内置 4 大 AI 搜索',
        body: 'Google AI Mode、Metaso、Grok、X Search 一键切换，选中的提供方在所有新标签页中保持一致。',
      },
      {
        title: '自定义任意提供方',
        body: '在弹窗里粘贴带 {query} 占位符的 URL，就能把任何 AI 或搜索服务加入选择列表，自定义图标与顺序。',
      },
      {
        title: '智能搜索历史',
        body: '↑/↓ 翻看最近 20 条查询，键入前缀后只匹配以该前缀开头的历史，重复检索不再从头打字。',
      },
      {
        title: '动态背景',
        body: 'Unsplash 与 Picsum 每天自动轮换；也可以塞入自己的 GIF / WebP / MP4 链接，靠右下角风车按钮手动切换。',
      },
      {
        title: '自定义快捷方式',
        body: '在弹窗里以 JSON 维护书签，远程 URL、纯本地、粘贴模式三选一，跨标签页实时同步。',
      },
      {
        title: '隐私至上',
        body: '不申请 tabs 权限、无内容脚本、无遥测；所有配置只写入本地 localStorage，第三方请求由浏览器直发不经任何代理。',
      },
    ],
  },
  faq: {
    heading: '常见问题',
    items: [
      {
        q: '它会收集我的搜索记录吗？',
        a: '不会。所有历史只写入本地 localStorage，作者没有任何服务器接收数据。卸载扩展或清理浏览器数据即可彻底删除。',
      },
      {
        q: '我能添加自己的 AI 服务吗？',
        a: '可以。打开扩展弹窗 → 搜索源 → 新增，粘贴形如 https://example.com/search?q={query} 的 URL 并设置图标即可，{query} 会在搜索时被自动替换。',
      },
      {
        q: '为什么不申请 tabs 权限？',
        a: '为了把权限面降到最小。扩展只覆盖新标签页本身，不读取你打开的其他标签，所以不需要 tabs 权限——也就没有被滥用的可能。',
      },
      {
        q: '背景图片来自哪里？',
        a: '默认来自 Unsplash 与 Picsum 的公共接口，每天换一张并缓存在本地。你也可以在弹窗里填入自己的动图/视频地址，由风车按钮循环切换。',
      },
      {
        q: '支持哪些浏览器？',
        a: 'Chromium 系（Chrome / Edge / Arc / Brave）通过 Chrome Web Store 安装；Firefox 通过 Add-ons 商店或本地加载 zip 包。',
      },
    ],
  },
  privacy: {
    heading: '隐私一览',
    intro:
      '我们相信隐私应当是默认值，而不是付费选项。下面是 PRIVACY.md 的浓缩版，完整版见仓库。',
    points: [
      {
        title: '本地存储',
        body: '搜索历史、书签缓存、提供方设置、动画背景列表与语言偏好全部存放在浏览器的 localStorage。',
      },
      {
        title: '不向作者服务器发送数据',
        body: '扩展自身不发起任何到作者服务器的请求。背景图片直接向 Unsplash / Picsum 拉取以绕过 CORS。',
      },
      {
        title: '搜索查询只发给你选的提供方',
        body: '按下回车后，浏览器直接打开你选中提供方的 URL；扩展不在中间记录、转发或代理任何查询。',
      },
      {
        title: '不执行远程代码',
        body: '远程书签 JSON 与背景资源只作为数据使用，永远不会被当作脚本执行。',
      },
    ],
    fullLink: '阅读完整隐私政策 →',
  },
  footer: {
    license: 'MIT 协议开源',
    builtWith: '用 Astro 构建，部署在 GitHub Pages',
  },
};

export type Dict = typeof zh;
