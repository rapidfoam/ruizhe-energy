# AGENTS.md - 建筑节能水平评估应用

## 项目概览
建筑节能水平评估 H5 应用，用户通过5步表单填写建筑信息，系统自动计算传热系数K值并与国家标准限值对比，生成详细节能评估报告。

## 技术栈
- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI**: shadcn/ui + Tailwind CSS 4
- **导出**: html2canvas (长图导出)

## 目录结构
```
src/
├── app/
│   ├── page.tsx              # 首页(入口)
│   ├── form/page.tsx         # 5步表单页面
│   ├── report/page.tsx       # 评估报告页面
│   ├── globals.css           # 全局样式
│   └── layout.tsx            # 根布局
├── lib/
│   ├── types.ts              # 类型定义
│   ├── data/
│   │   ├── climate.ts        # 气候分区+城市映射(GB 50178)
│   │   ├── building-types.ts # 建筑类型定义
│   │   ├── materials.ts      # 材料热工参数库(GB 50176-2016)
│   │   ├── standards.ts      # 标准限值(GB 55015-2021)
│   │   └── assets/           # 原始JSON数据
│   └── engine/
│       └── calculator.ts     # K值计算引擎
└── components/ui/            # shadcn/ui组件
```

## 核心计算
- K值公式: `K = 1 / (0.11 + Σ(δn / (λn × an)) + 0.04)`
- 窗户K值: 直接查表
- 评级: A-E五级，基于达标程度和超标幅度

## 数据流
1. 用户填写表单 → sessionStorage 存储
2. 计算引擎处理 → 生成 EvaluationResult
3. 报告页读取 sessionStorage → 渲染报告
4. 注册弹窗验证后 → 显示完整报告
5. html2canvas 导出长图

## 开发命令
- 安装依赖: `pnpm install`
- 开发: `pnpm dev`
- 构建: `pnpm build`
- 类型检查: `pnpm ts-check`
- Lint: `pnpm lint`
