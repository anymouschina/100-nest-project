# FastGPT集成启动指南

## 🚀 快速启动

### 1. 启动基础服务
```bash
# 启动现有服务（包含PostgreSQL、Redis、n8n等）
docker-compose up -d

# 等待基础服务启动完成
docker-compose ps
```

### 2. 启动FastGPT服务
```bash
# 使用专门的FastGPT配置文件
docker-compose -f docker-compose.fastgpt.yml up -d

# 查看服务状态
docker-compose -f docker-compose.fastgpt.yml ps
```

### 3. 服务端口清单
| 服务 | 端口 | 说明 |
|---|---|---|
| FastGPT主服务 | 3000 | Web界面 |
| MongoDB | 27017 | FastGPT数据库 |
| MinIO对象存储 | 9000/9001 | 文件存储 |
| MCP服务器 | 3005 | 扩展接口 |
| n8n工作流 | 5678 | 自动化工具 |
| Redis缓存 | 6379 | 共享缓存 |
| PostgreSQL | 5432 | 共享数据库 |

## 🔧 配置优化

### 1. 数据库共享配置
- **PostgreSQL**: 已配置多数据库支持，包含`n8n`和`fastgpt`
- **Redis**: 使用现有Redis服务，密码`123456`
- **MongoDB**: FastGPT专用，独立数据卷

### 2. 环境变量配置
所有服务都使用统一的环境变量命名规范，便于管理：
- 数据库密码统一为`postgres`和`fastgpt123`
- Redis密码统一为`123456`

### 3. 网络配置
所有服务都在`n8n-network`网络中，服务间可以通过服务名直接通信。

## 📊 验证启动

### 1. 检查服务状态
```bash
# 查看所有服务状态
docker-compose ps

# 查看FastGPT专用服务状态
docker-compose -f docker-compose.fastgpt.yml ps
```

### 2. 访问测试
- FastGPT Web界面: http://localhost:3000
- MinIO控制台: http://localhost:9001 (minioadmin/minioadmin)
- n8n工作流: http://localhost:5678

### 3. 首次登录
- 用户名: root
- 密码: 1234 (在config.json中配置)

## 🛠️ 故障排查

### 1. 日志查看
```bash
# FastGPT服务日志
docker-compose -f docker-compose.fastgpt.yml logs -f fastgpt

# MongoDB日志
docker-compose -f docker-compose.fastgpt.yml logs -f mongo
```

### 2. 常见问题
- **端口冲突**: 如果3000端口被占用，修改docker-compose.fastgpt.yml中的端口映射
- **内存不足**: 减少并发参数或增加Docker内存限制
- **网络问题**: 确保所有服务都在同一个Docker网络中

### 3. 数据持久化
- PostgreSQL数据: `./db_data`
- MongoDB数据: `./mongo_data`
- MinIO数据: `./minio_data`
- FastGPT配置: `./fastgpt/config.json`

## 🔄 停止服务

```bash
# 停止FastGPT服务
docker-compose -f docker-compose.fastgpt.yml down

# 停止所有服务（包括基础服务）
docker-compose down
```

## 🔧 自定义配置

要修改FastGPT配置，请编辑：`fastgpt/config.json`

要修改环境变量，请编辑：`docker-compose.fastgpt.yml`

## 📝 注意事项

1. **安全性**: 生产环境请修改所有默认密码
2. **性能**: 根据服务器配置调整内存和并发参数
3. **备份**: 定期备份数据库和配置文件
4. **更新**: 使用`docker pull`命令更新镜像版本