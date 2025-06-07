# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support For `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
   1. Run `Extensions: Show Built-in Extensions` from VSCode's command palette
   2. Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## 项目功能模块

### 目录结构说明

项目的主要功能模块都位于 `src/views/system` 目录下，遵循以下命名规范：
- 每个功能模块放在独立目录下
- 列表页面放在 `list` 子目录下
- 详情页面放在 `detail` 子目录下

### 订单管理

- 路径：`src/views/system/order`
- 订单列表：展示订单信息，包括订单状态、支付状态、服务类型等
- 订单详情：查看订单的详细信息，包括用户信息、服务信息、地址信息等
- 订单状态管理：支持订单的接单、施工、完成、取消等操作
- 支持按订单状态、服务类型、支付状态、用户ID、手机号码、创建时间等条件筛选订单

订单状态包括：待接单、已接单、施工中、已完成、已取消、已交付

### 推广管理

- 路径：`src/views/referral`
- 推广引用码列表：展示推广引用码(refCode)信息，包括引用码状态、使用次数、创建时间等
- 推广统计数据：查看推广引用码的使用情况、转化率等统计数据
- 推广引用码状态管理：支持引用码的激活、停用等操作
- 支持按引用码状态、用户ID、创建时间等条件筛选引用码
- 支持按用户ID查询推广统计数据

推广引用码状态包括：活跃、未激活、已过期
