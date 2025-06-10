# 日志分析系统测试套件

## 📋 概述

这是一个全面的日志分析系统测试套件，旨在验证和评估系统在各种场景下的表现，包括：

- 🧪 **异常场景检测** - 验证系统对各种异常情况的识别能力
- ✅ **正常流程验证** - 确保系统对正常业务流程的准确处理
- ⚡ **性能基准测试** - 评估系统在不同数据量下的性能表现
- 🎯 **UI阻塞专项测试** - 专门测试UI阻塞行为检测功能

## 🚀 快速开始

### 1. 启动主测试界面
```bash
./run-all-tests.sh
```

这将启动一个交互式菜单，提供以下选项：
- 🧪 快速场景测试 (6个特定场景)
- 📊 综合测试套件 (9个完整测试用例)
- ⚡ 性能基准测试 (压力和性能评估)
- 🎯 UI阻塞专项测试
- 🔄 运行所有测试 (完整测试流程)

### 2. 独立运行测试脚本

#### 快速场景测试
```bash
./quick-scenario-tests.sh
```
执行6个关键异常场景：
- 内存泄漏检测
- API限流触发
- 数据库死锁检测
- 异常用户行为
- 服务雪崩效应
- 正常业务流程对比

#### 综合测试套件
```bash
./comprehensive-test-suite.sh
```
执行完整的测试用例集：
- 异常测试用例 (3个)
- 正常验证用例 (3个)
- 边界测试用例 (2个)
- 性能测试用例 (1个)

#### 性能基准测试
```bash
./performance-benchmark.sh
```
测试不同数据量下的系统性能：
- 小规模: 10-50条日志
- 中等规模: 100-500条日志
- 大规模: 1000-2000条日志
- 极限测试: 5000-10000条日志（可选）

#### 真实场景大规模测试
```bash
./realistic-large-scale-test.sh
```
模拟真实生产环境的大规模日志处理：
- 生成2000-10000条真实业务日志
- 模拟完整业务流程（登录、购物、支付等）
- 验证特征归一化和数据质量
- 监控内存使用和系统稳定性
- 重点测试避免内存泄漏导致的结果失真

#### 数据质量验证
```bash
./data-quality-validator.sh
```
验证大规模测试的数据质量：
- 检查特征归一化准确性
- 验证数据完整性和格式一致性
- 分析业务逻辑连贯性
- 监控内存使用模式
- 生成详细的质量评估报告

## 📊 测试用例详情

### 🚨 异常测试用例

#### 1. 高频错误日志测试
模拟系统出现大量错误的情况：
- 数据库连接失败
- API调用超时
- 系统内存不足
- JWT令牌验证失败
- 支付系统异常

#### 2. 安全攻击模式测试
测试系统对安全威胁的检测能力：
- 可疑IP访问
- 暴力破解尝试
- SQL注入和XSS攻击
- DDoS攻击检测
- 异常登录地理位置

#### 3. 系统崩溃场景测试
验证系统故障检测：
- 内存使用率飙升
- JVM堆内存溢出
- 数据库连接池耗尽
- 应用程序崩溃
- 故障转移模式

### ✅ 正常验证用例

#### 4. 正常用户登录流程
验证标准用户操作：
- 访问登录页面
- 提交登录表单
- 验证用户凭据
- 生成JWT令牌
- 重定向到仪表板

#### 5. 常规API调用
测试标准API处理：
- API请求接收
- 令牌验证
- 数据查询和序列化
- 响应发送
- 指标记录

#### 6. 定时任务执行
验证计划任务：
- 定时任务启动
- 数据库备份
- 云存储上传
- 任务完成记录

### ⚡ 边界测试用例

#### 7. 混合异常正常场景
测试复杂的业务流程：
- 正常操作与异常交替
- 支付失败和重试
- 系统恢复处理

#### 8. 边界数据测试
验证特殊情况处理：
- 空日志数据
- 超长文本消息
- 特殊字符和Unicode

### 🚀 性能测试用例

#### 9. 大量日志性能测试
评估系统扩展性：
- 不同数据量处理时间
- 各组件性能分析
- 资源使用效率
- 性能瓶颈识别

## 📈 结果分析

### 输出目录结构
```
test-results/          # 功能测试结果
├── *_test_*.json     # 各测试用例的详细结果
└── test_report_*.md  # 测试报告汇总

benchmark-results/     # 性能测试结果
├── performance_metrics_*.csv    # 性能指标数据
├── benchmark_*_logs_*.json     # 详细测试结果
├── performance_report_*.md     # 性能报告
└── chart_data_*.js            # 图表数据

large-scale-results/   # 大规模测试结果
├── raw_data_*_*.json          # 原始测试数据
├── analysis_result_*_*.json   # 分析结果数据
├── large_scale_metrics_*.csv  # 性能指标记录
├── memory_usage_*.log         # 内存使用监控
├── large_scale_report_*.md    # 大规模测试报告
└── data_quality_report_*.md   # 数据质量验证报告

test_summary_*.md     # 完整测试流程总结
```

### 关键指标说明

#### 功能测试指标
- **风险级别**: LOW/MEDIUM/HIGH/CRITICAL
- **异常检测数量**: 系统识别的异常模式数量
- **UI阻塞模式**: 检测到的UI阻塞行为数量
- **LLM置信度**: AI分析的置信水平
- **处理时间**: 各组件的处理耗时

#### 性能测试指标
- **总响应时间**: 完整请求处理时间
- **网络耗时**: HTTP请求传输时间
- **LLM处理时间**: 大语言模型分析耗时
- **异常检测时间**: 异常识别算法耗时
- **行为分析时间**: 用户行为分析耗时

## 🔧 系统要求

### 依赖软件
- `curl` - HTTP请求工具
- `jq` - JSON处理工具
- `bc` - 数学计算工具

### 服务要求
- 日志分析系统运行在 `http://localhost:3000`
- `/api/agent-orchestrator/analyze/quick` 接口可用
- `/api/health` 健康检查接口可用

## 🎯 使用场景

### 1. 开发阶段验证
```bash
# 快速验证核心功能
./quick-scenario-tests.sh
```

### 2. 发布前测试
```bash
# 完整功能验证
./comprehensive-test-suite.sh
```

### 3. 性能评估
```bash
# 性能基准测试
./performance-benchmark.sh
```

### 4. 生产环境压力测试
```bash
# 真实场景大规模测试
./realistic-large-scale-test.sh
```

### 5. 数据质量监控
```bash
# 验证数据处理质量
./data-quality-validator.sh
```

### 6. 完整系统验证
```bash
# 运行所有测试套件
./run-all-tests.sh
```

### 4. 回归测试
```bash
# 运行完整测试流程
./run-all-tests.sh
# 选择选项 5: 运行所有测试
```

### 5. 问题诊断
```bash
# UI阻塞问题专项测试
./run-all-tests.sh
# 选择选项 4: UI阻塞专项测试
```

## 📝 自定义测试

### 添加新的测试场景

1. **编辑快速场景测试**:
   ```bash
   vi quick-scenario-tests.sh
   # 添加新的 test_scenario 调用
   ```

2. **扩展综合测试套件**:
   ```bash
   vi comprehensive-test-suite.sh
   # 添加新的 run_test 调用
   ```

3. **自定义性能测试**:
   ```bash
   vi performance-benchmark.sh
   # 修改 benchmark_test 参数
   ```

### 测试数据格式

所有测试都使用标准的JSON格式：
```json
{
  "logs": [
    {
      "id": "unique-id",
      "timestamp": "2025-01-10T14:30:01.000Z",
      "level": "INFO|WARN|ERROR|CRITICAL|FATAL",
      "source": "frontend|backend|system|security",
      "service": "service-name",
      "message": "日志消息内容",
      "metadata": {
        "key": "value",
        // 任意扩展字段
      }
    }
  ]
}
```

## 🐛 故障排除

### 常见问题

1. **服务连接失败**
   ```bash
   # 检查服务状态
   curl http://localhost:3000/api/health
   
   # 确保应用服务器正在运行
   npm run start:dev  # 或相应的启动命令
   ```

2. **依赖缺失**
   ```bash
   # macOS
   brew install jq
   
   # Ubuntu/Debian
   sudo apt-get install jq bc curl
   
   # CentOS/RHEL
   sudo yum install jq bc curl
   ```

3. **权限问题**
   ```bash
   # 确保脚本有执行权限
   chmod +x *.sh
   ```

4. **超时问题**
   ```bash
   # 对于大数据量测试，可能需要增加超时时间
   # 编辑脚本中的 --max-time 参数
   ```

### 调试技巧

1. **详细输出**:
   ```bash
   # 运行时添加详细输出
   bash -x ./quick-scenario-tests.sh
   ```

2. **保存原始响应**:
   ```bash
   # 手动测试单个场景
   curl -X POST -H "Content-Type: application/json" \
        -d '{"logs":[...]}' \
        http://localhost:3000/api/agent-orchestrator/analyze/quick \
        | jq . > debug_response.json
   ```

3. **检查日志**:
   查看应用服务器的控制台输出，了解处理过程中的详细信息。

## 📞 支持

如有问题或建议，请：
1. 检查测试结果和错误日志
2. 验证系统环境和依赖
3. 查看应用服务器状态
4. 参考故障排除指南

---

**测试愉快！** 🎉 