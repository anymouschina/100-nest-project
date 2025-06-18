# 聊天客户端

基于React和TypeScript开发的聊天客户端，配合NestJS后端使用。

## 功能特性

- 用户认证
  - 账号密码登录
  - 新用户注册
- 会话管理
  - 创建新会话
  - 查看历史会话列表
  - 在会话中进行聊天
- 实时消息发送和接收
- 响应式界面设计

## 技术栈

- React 18
- TypeScript
- React Router v7
- Ant Design UI库
- Axios用于API调用

## 目录结构

```
src/
  ├── components/         # 可复用组件
  │   ├── ChatWindow.tsx  # 聊天窗口组件
  │   └── SessionList.tsx # 会话列表组件
  ├── pages/              # 页面组件
  │   ├── ChatPage.tsx    # 主聊天页面
  │   └── LoginPage.tsx   # 登录页面
  ├── services/           # 服务
  │   └── api.ts          # API调用服务
  ├── types/              # TypeScript类型定义
  │   └── chat.ts         # 聊天相关类型
  ├── App.tsx             # 根组件
  └── index.tsx           # 入口文件
```

## 安装和使用

1. 安装依赖

```bash
pnpm install
```

2. 开发模式运行

```bash
pnpm start
```

3. 构建生产版本

```bash
pnpm build
```

## API接口

客户端通过以下API与服务端通信：

- 用户认证
  - `POST /api/user/webLogin` - 邮箱密码登录
  - `POST /api/user/register` - 用户注册
  - `GET /api/user/logout` - 用户登出
  - `GET /user/info` - 获取用户信息

- 聊天功能
  - `POST /chat/sessions` - 创建新会话
  - `GET /chat/sessions` - 获取会话列表
  - `GET /chat/sessions/:sessionId` - 获取特定会话详情
  - `GET /chat/sessions/:sessionId/history` - 获取会话消息历史
  - `POST /chat/sessions/:sessionId/messages` - 发送消息
  - `GET /chat/agents` - 获取可用的聊天代理

## 配置

在开发模式中，客户端默认连接到 `http://localhost:3001`。如果需要修改API地址，请设置环境变量：

```
REACT_APP_API_URL=http://your-api-url
```

## 部署

构建完成后，可以将 `build` 目录下的内容部署到任何静态文件服务器。

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
