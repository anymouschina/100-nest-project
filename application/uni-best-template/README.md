<p align="center">
  <a href="https://github.com/feige996/unibest">
    <img width="160" src="./src/static/logo.svg">
  </a>
</p>

<h1 align="center">
  <a href="https://github.com/feige996/unibest" target="_blank">unibest - 最好的 uniapp 开发框架</a>
</h1>

<div align="center">
旧仓库 codercup 进不去了，star 也拿不回来，这里也展示一下那个地址的 star.

[![GitHub Repo stars](https://img.shields.io/github/stars/codercup/unibest?style=flat&logo=github)](https://github.com/codercup/unibest)
[![GitHub forks](https://img.shields.io/github/forks/codercup/unibest?style=flat&logo=github)](https://github.com/codercup/unibest)

</div>

<div align="center">

[![GitHub Repo stars](https://img.shields.io/github/stars/feige996/unibest?style=flat&logo=github)](https://github.com/feige996/unibest)
[![GitHub forks](https://img.shields.io/github/forks/feige996/unibest?style=flat&logo=github)](https://github.com/feige996/unibest)
[![star](https://gitee.com/feige996/unibest/badge/star.svg?theme=dark)](https://gitee.com/feige996/unibest/stargazers)
[![fork](https://gitee.com/feige996/unibest/badge/fork.svg?theme=dark)](https://gitee.com/feige996/unibest/members)
![node version](https://img.shields.io/badge/node-%3E%3D18-green)
![pnpm version](https://img.shields.io/badge/pnpm-%3E%3D7.30-green)
![GitHub package.json version (subfolder of monorepo)](https://img.shields.io/github/package-json/v/feige996/unibest)
![GitHub License](https://img.shields.io/github/license/feige996/unibest)

</div>

`unibest` —— 最好的 `uniapp` 开发模板，由 `uniapp` + `Vue3` + `Ts` + `Vite5` + `UnoCss` + `wot-ui` + `z-paging` 构成，使用了最新的前端技术栈，无需依靠 `HBuilderX`，通过命令行方式运行 `web`、`小程序` 和 `App`（编辑器推荐 `VSCode`，可选 `webstorm`）。

`unibest` 内置了 `约定式路由`、`layout布局`、`请求封装`、`请求拦截`、`登录拦截`、`UnoCSS`、`i18n多语言` 等基础功能，提供了 `代码提示`、`自动格式化`、`统一配置`、`代码片段` 等辅助功能，让你编写 `uniapp` 拥有 `best` 体验 （ `unibest 的由来`）。

## 🏠 项目功能

### 首页设计 (src/pages/index/index.vue)

专业防水服务应用首页，采用现代化科技感设计，增强用户信任感：

#### 1. 顶部Banner轮播图 - 科技感设计
- **高质量轮播展示**: 使用wot-design-uni轮播组件，展示防水补漏、新房防水施工和管道疏通服务
- **科技装饰元素**: 添加浮动动画装饰点，营造科技感氛围
- **优化视觉效果**: 圆角设计、渐变指示器，提升视觉层次
- **智能交互**: 4秒自动切换，点击可直接跳转对应服务

#### 2. 品牌标识卡片 - 信任感建立
- **悬浮卡片设计**: 使用阴影和圆角营造现代感，从轮播图自然过渡
- **品牌信任元素**: 
  - 发光Logo效果，增强品牌记忆点
  - 专业认证和品质保障标签
  - 质量保证和官方认证图标展示
- **渐变光效**: Logo周围添加脉冲动画，增强科技感

#### 3. 服务功能区 - 专业展示
- **智能化标题**: "AI智能匹配 · 一站式解决方案"突出技术优势
- **高级卡片设计**: 
  - 渐变背景图标，白色图标增强对比
  - 热门/推荐标签，引导用户选择
  - 脉冲动画效果，增强视觉吸引力
  - 渐变按钮配合阴影效果
- **详细服务信息**: 
  - 防水补漏：30分钟响应、持证师傅
  - 疏通管道：24小时服务、专业设备
- **交互反馈**: 点击时发光边框效果

#### 4. 专业优势展示 - 网格布局
- **现代化网格设计**: 2x2网格布局，每项包含图标和详细说明
- **多彩图标系统**: 不同颜色区分不同优势类型
- **渐变背景**: 淡绿色渐变背景增强视觉层次
- **立体图标效果**: 白色背景圆形阴影，增强立体感

#### 5. 数据统计展示 - 信任建立
- **权威数据展示**: 10000+服务客户、99.8%满意度、24h响应时间
- **渐变背景**: 绿色渐变背景突出重要性
- **视觉分隔**: 半透明分隔线清晰区分数据
- **文字阴影**: 增强数据可读性和专业感

#### 6. 设计特色 - 科技感与信任感
- **现代配色方案**: 
  - 主色：绿色渐变(#2c722c → #52c41a)
  - 辅助色：蓝色渐变(#409eff → #64b5ff)
  - 背景：多层渐变(#f8fffe → #f0f9f0 → #ffffff)
- **动画效果系统**:
  - 浮动动画：科技装饰元素
  - 脉冲动画：Logo和图标
  - 发光效果：卡片边框和按钮
- **视觉层次**:
  - 多层阴影系统
  - 圆角统一设计(30rpx)
  - 渐变和透明度运用
- **信任感元素**:
  - 权威认证标识
  - 专业数据展示
  - 服务保障承诺
  - 品牌实力体现

### 技术栈
- **UI框架**: wot-design-uni
- **样式**: SCSS + CSS3动画
- **组件**: 轮播图(wd-swiper)、按钮(wd-button)、图标(wd-icon)
- **动画**: CSS3 keyframes动画
- **设计**: 现代化卡片设计、渐变效果、阴影层次

![](https://raw.githubusercontent.com/andreasbm/readme/master/screenshots/lines/rainbow.png)

<p align="center">
  <a href="https://unibest.tech/" target="_blank">📖 文档地址(new)</a>
  <span style="margin:0 10px;">|</span>
  <a href="https://feige996.github.io/hello-unibest/" target="_blank">📱 DEMO 地址</a>
</p>

---

注意旧的地址 [codercup](https://github.com/codercup/unibest) 我进不去了，使用新的 [feige996](https://github.com/feige996/unibest)。PR和 issue 也请使用新地址，否则无法合并。

## 平台兼容性

| H5  | IOS | 安卓 | 微信小程序 | 字节小程序 | 快手小程序 | 支付宝小程序 | 钉钉小程序 | 百度小程序 |
| --- | --- | ---- | ---------- | ---------- | ---------- | ------------ | ---------- | ---------- |
| √   | √   | √    | √          | √          | √          | √            | √          | √          |

注意每种 `UI框架` 支持的平台有所不同，详情请看各 `UI框架` 的官网，也可以看 `unibest` 文档。

## ⚙️ 环境

- node>=18
- pnpm>=8
- Vue Official>=2.1.10
- TypeScript>=5.0

## &#x1F4C2; 快速开始

执行 `pnpm create unibest` 创建项目
执行 `pnpm i` 安装依赖
执行 `pnpm dev` 运行 `H5`
执行 `pnpm dev:mp` 运行 `微信小程序`

## 📦 运行（支持热更新）

- web平台： `pnpm dev:h5`, 然后打开 [http://localhost:9000/](http://localhost:9000/)。
- weixin平台：`pnpm dev:mp-weixin` 然后打开微信开发者工具，导入本地文件夹，选择本项目的`dist/dev/mp-weixin` 文件。
- APP平台：`pnpm dev:app`, 然后打开 `HBuilderX`，导入刚刚生成的`dist/dev/app` 文件夹，选择运行到模拟器(开发时优先使用)，或者运行的安卓/ios基座。

## 🔗 发布

- web平台： `pnpm build:h5`，打包后的文件在 `dist/build/h5`，可以放到web服务器，如nginx运行。如果最终不是放在根目录，可以在 `manifest.config.ts` 文件的 `h5.router.base` 属性进行修改。
- weixin平台：`pnpm build:mp-weixin`, 打包后的文件在 `dist/build/mp-weixin`，然后通过微信开发者工具导入，并点击右上角的"上传"按钮进行上传。
- APP平台：`pnpm build:app`, 然后打开 `HBuilderX`，导入刚刚生成的`dist/build/app` 文件夹，选择发行 - APP云打包。

## 🤔 如何贡献

非常欢迎您的加入！提一个 [Issue](https://github.com/feige996/unibest/issues) 或者提交一个 [Pull Request](https://github.com/feige996/unibest/pulls)

**Pull Request:**

- 1. `Fork` 代码到自己的项目下，不要直接在仓库下建分支
- 2. 请选择 `base` 分支，进行 `PR`
- 3. 提交 `PR` 前请 `rebase`，确保 `commit` 记录的整洁
- 4. 注意 `commit` 信息规范，要以 `type: 描述信息` 的形式填写，注意 `type` 得是下面规范之中的一个
- 5. 示例 `commit 信息`：`fix: 修复样式问题`
- 6. 可以使用项目中的 `pnpm cz` 进行 `commit` 提交
- 7. 等待作者 `review` 通过后，即可合并

## 📄 License

[MIT](https://opensource.org/license/mit/)

Copyright (c) 2025 菲鸽

## 捐赠

<p align='center'>
<img alt="special sponsor appwrite" src="https://oss.laf.run/ukw0y1-site/pay/wepay.png" height="330" style="display:inline-block; height:330px;">
<img alt="special sponsor appwrite" src="https://oss.laf.run/ukw0y1-site/pay/alipay.jpg" height="330" style="display:inline-block; height:330px; margin-left:10px;">
</p>
