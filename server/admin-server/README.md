<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## 项目功能

### 数据库功能

1. 使用Prisma作为ORM，管理PostgreSQL数据库
2. 种子脚本自动填充初始数据
3. 自增主键序列重置 - 确保新插入数据的ID从已有数据的最大ID值+1开始，而不是从1开始

### 上传功能

1. 支持单文件和多文件上传
2. 提供公共上传接口（无需鉴权），返回可访问的URL
   - 单文件上传：`POST /public/upload`
   - 多文件上传：`POST /public/uploads`
3. 上传的资源支持跨域访问，不受同源策略限制
   - 所有静态资源目录添加了CORS头，允许从任何域名访问
   - 支持通过配置文件中的`app.url`设置返回完整的访问URL

### 订单管理功能

1. 订单微服务接口
   - 获取订单列表：`GET /api/admin/orders`
   - 获取订单详情：`GET /api/admin/orders/:id`
   - 更新订单状态：`PUT /api/admin/orders/:id/status`
   - 获取订单统计：`GET /api/admin/orders/statistics`
     - 支持按日、周、月、年维度统计: `?timeRange=day|week|month|year`
     - 支持自定义时间范围: `?startDate=2023-01-01&endDate=2023-12-31`
     - 返回数据格式适配echarts图表展示，包含坐标轴数据和多个数据系列
2. 支持根据状态和用户ID筛选订单
3. 提供订单状态统计分析
   - 按支付状态（已支付、未支付、已退款）统计
   - 按订单状态（待处理、已接受、处理中、已完成、已取消、已交付）统计
   - 支持组合查询统计
4. 微服务功能
   - 提供Redis微服务接口，可供其他服务调用
   - 支持订单统计数据的微服务调用 `order.getStatistics`
   - 本地备份统计功能，确保微服务不可用时仍能获取统计数据

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
