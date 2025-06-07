# Simple Order Management System

An implementation for an Order Management System (OMS) for an e-commerce mobile app.
It allows users to manage their carts, place orders, view order details, and apply coupons.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Additional Features](#additional-features)
- [Dummy Data](#dummy-data)
- [Postman Collection](#postman-collection)

## Prerequisites

Make sure you have the following installed:

- [nodejs](https://nodejs.org/en/download/package-manager/current)
- npm
- [PostgreSQL](https://www.postgresql.org/download/)

## Getting Started

Follow these commands to install any dependency and setting up the Database.
Also filling some tables with dummy data.

```bash
git clone https://github.com/LORDyyyyy/simple-orderManagementSystem
npm install
```

Next you need to change the Database connection URL in the [.env](./.env) file

```bash
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DB_NAME?schema=public"
```

You can leave everything the same as it is in the file except the `USERNAME` and the `PASSWORD`.

Also you can change the Database provider from PostgreSQL to any other DBMS.
See [Prisma Documentation - Data sources](https://www.prisma.io/docs/orm/prisma-schema/overview/data-sources).
Don't forget to change the provider name in [prisma/schema.prisma](./prisma/schema.prisma).

---

Building the application and the Database:

```bash
npm run db:init
npm run build
npm run db:seed
```

Running the application:

```bash
npm run start:dev
```

Or in one step:

```bash
npm run start:all
```

Be careful from running this command multiple times, you will add the dummy data more than once.

## API Documentation

API endpoints are documented using Swagger. Once the server is running locally, access the documentation at:

```bash
http://localhost:3000/api-docs
```

## Additional Features

Here are the additional features that has been added to the application:

- Order History Retrieval for a specific users
  - Endpoint: `GET /api/users/:userId/orders`
- Applying Discounts and Coupons to orders
  - Endpoint: `POST /api/orders/apply-coupon`
- 一键预约功能
  - 提交预约申请: `POST /api/appointment/submit`
  - 获取用户所有预约: `GET /api/appointment/user`
  - 获取预约详情: `GET /api/appointment/:id`
- 订单取消与退款: `POST /api/orders/:id/cancel`
- 订单统计功能: 
  - 微服务模式: `order.getStatistics`
  - 支持按日、周、月、年维度统计: `timeRange` 参数可选值为 `day`, `week`, `month`, `year`
  - 支持自定义时间范围: `startDate` 和 `endDate` 参数
  - 返回数据格式适配echarts图表展示

## Dummy Data

Here are the dummy data that has been added to the tables `User`, `Product`, and `Coupons`.

### Product Table:

| name      | price | stock | description               | createdAt           |
| --------- | ----- | ----- | ------------------------- | ------------------- |
| Product A | 19.99 | 100   | Description for Product A | [Current Date/Time] |
| Product B | 29.99 | 150   | Description for Product B | [Current Date/Time] |
| Product C | 9.99  | 200   | Description for Product C | [Current Date/Time] |
| Product D | 39.99 | 120   | Description for Product D | [Current Date/Time] |
| Product E | 49.99 | 80    | Description for Product E | [Current Date/Time] |
| Product F | 59.99 | 60    | Description for Product F | [Current Date/Time] |
| Product G | 69.99 | 40    | Description for Product G | [Current Date/Time] |
| Product H | 79.99 | 30    | Description for Product H | [Current Date/Time] |
| Product I | 89.99 | 20    | Description for Product I | [Current Date/Time] |
| Product J | 99.99 | 10    | Description for Product J | [Current Date/Time] |

### User Table:

| name    | email               | password    | address                         | createdAt           |
| ------- | ------------------- | ----------- | ------------------------------- | ------------------- |
| Alice   | alice@example.com   | password123 | 123 Main St, City, Country      | 2023-01-01 10:00:00 |
| Bob     | bob@example.com     | password456 | 456 Elm St, Town, Country       | 2023-01-05 12:00:00 |
| Charlie | charlie@example.com | password789 | 789 Oak St, Village, Country    | 2023-01-10 15:00:00 |
| David   | david@example.com   | passwordabc | 321 Pine St, City, Country      | 2023-02-01 09:00:00 |
| Eve     | eve@example.com     | passwordefg | 654 Cedar St, Town, Country     | 2023-02-15 11:00:00 |
| Frank   | frank@example.com   | passwordxyz | 987 Birch St, Village, Country  | 2024-03-01 14:00:00 |
| Grace   | grace@example.com   | password123 | 246 Maple St, City, Country     | 2024-03-15 16:00:00 |
| Hannah  | hannah@example.com  | password456 | 135 Walnut St, Town, Country    | 2024-04-01 18:00:00 |
| Ian     | ian@example.com     | password789 | 864 Spruce St, Village, Country | 2024-04-15 19:00:00 |
| Jasmine | jasmine@example.com | passwordabc | 579 Fir St, City, Country       | 2024-05-01 20:00:00 |

#### Coupons Table:

| code          | discount | expireAt            | createdAt           |
| ------------- | -------- | ------------------- | ------------------- |
| SAVE10        | 10.0     | 2023-12-31 23:59:59 | 2023-01-01 10:00:00 |
| DISCOUNT20    | 20.0     | 2023-11-30 23:59:59 | 2023-01-05 12:00:00 |
| WELCOME15     | 15.0     | 2023-10-31 23:59:59 | 2023-01-10 15:00:00 |
| HOLIDAY30     | 30.0     | 2023-12-25 23:59:59 | 2023-02-01 09:00:00 |
| SPRING5       | 5.0      | 2024-03-01 23:59:59 | 2023-02-15 11:00:00 |
| SUMMER25      | 25.0     | 2024-09-01 23:59:59 | 2024-03-01 14:00:00 |
| FALL10        | 10.0     | 2024-11-01 23:59:59 | 2024-03-15 16:00:00 |
| WINTER50      | 50.0     | 2025-01-01 23:59:59 | 2024-04-01 18:00:00 |
| BLACKFRIDAY40 | 40.0     | 2024-11-29 23:59:59 | 2024-04-15 19:00:00 |
| CYBERMONDAY35 | 35.0     | 2024-12-02 23:59:59 | 2024-05-01 20:00:00 |

> Note: the first 5 coupons are expired.

## Postman Collection

A Postman collection is included to facilitate API testing.
To use it:

- Import the [OMS.postman_collection.json](./OMS.postman_collection.json) file into Postman.
- Ensure your local server is running.
- Execute the API requests defined in the collection to test the endpoints.
