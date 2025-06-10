#!/bin/bash

# 日志分析系统综合测试套件
# =====================================

set -e

API_BASE="http://localhost:3000/api/agent-orchestrator"
RESULTS_DIR="test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 创建结果目录
mkdir -p $RESULTS_DIR

echo "🚀 启动日志分析系统综合测试套件"
echo "===================================="
echo "📅 测试时间: $(date)"
echo "📁 结果目录: $RESULTS_DIR"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
run_test() {
    local test_name="$1"
    local test_data="$2"
    local expected_risk="$3"
    local expected_patterns="$4"
    
    echo -e "${BLUE}🧪 运行测试: $test_name${NC}"
    echo "----------------------------------------"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # 发送请求并保存结果
    local result_file="$RESULTS_DIR/${test_name// /_}_$TIMESTAMP.json"
    
    echo "$test_data" | curl -X POST \
        -H "Content-Type: application/json" \
        -d @- \
        "$API_BASE/analyze/quick" \
        -o "$result_file" \
        -s \
        --max-time 300
    
    if [ $? -eq 0 ]; then
        # 解析结果
        local actual_risk=$(jq -r '.data.riskLevel' "$result_file" 2>/dev/null || echo "UNKNOWN")
        local detected_anomalies=$(jq -r '.data.agentResults[] | select(.agentName == "AnomalyDetectionAgent") | .data.anomalies | length' "$result_file" 2>/dev/null || echo "0")
        local ui_blocking=$(jq -r '.data.agentResults[] | select(.agentName == "BehaviorAnalysisAgent") | .data.userBehavior.uiBlockingPatterns | length' "$result_file" 2>/dev/null || echo "0")
        
        echo -e "📊 ${GREEN}测试完成${NC}"
        echo "   风险级别: $actual_risk (预期: $expected_risk)"
        echo "   检测异常: $detected_anomalies 个"
        echo "   UI阻塞: $ui_blocking 个模式"
        
        # 简单的验证逻辑
        if [[ "$actual_risk" == "$expected_risk" ]] || [[ "$expected_risk" == "ANY" ]]; then
            echo -e "   ✅ ${GREEN}通过${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "   ❌ ${RED}失败${NC} - 风险级别不匹配"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        echo -e "❌ ${RED}请求失败${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo ""
    sleep 2
}

# 异常测试用例
echo -e "${RED}🚨 异常测试用例${NC}"
echo "===================="

# 1. 高频错误日志测试
run_test "高频错误日志" '{
  "logs": [
    {"id": "err-001", "timestamp": "2025-01-10T14:30:01.000Z", "level": "ERROR", "source": "backend", "service": "database", "message": "数据库连接失败", "metadata": {"error": "CONNECTION_TIMEOUT", "retryCount": 3}},
    {"id": "err-002", "timestamp": "2025-01-10T14:30:02.000Z", "level": "ERROR", "source": "backend", "service": "database", "message": "数据库连接失败", "metadata": {"error": "CONNECTION_TIMEOUT", "retryCount": 4}},
    {"id": "err-003", "timestamp": "2025-01-10T14:30:03.000Z", "level": "ERROR", "source": "backend", "service": "database", "message": "数据库连接失败", "metadata": {"error": "CONNECTION_TIMEOUT", "retryCount": 5}},
    {"id": "err-004", "timestamp": "2025-01-10T14:30:04.000Z", "level": "ERROR", "source": "backend", "service": "api", "message": "API调用超时", "metadata": {"endpoint": "/api/users", "timeout": 30000}},
    {"id": "err-005", "timestamp": "2025-01-10T14:30:05.000Z", "level": "ERROR", "source": "backend", "service": "api", "message": "API调用超时", "metadata": {"endpoint": "/api/orders", "timeout": 30000}},
    {"id": "err-006", "timestamp": "2025-01-10T14:30:06.000Z", "level": "FATAL", "source": "backend", "service": "core", "message": "系统内存不足", "metadata": {"memoryUsage": "95%", "availableMemory": "128MB"}},
    {"id": "err-007", "timestamp": "2025-01-10T14:30:07.000Z", "level": "ERROR", "source": "backend", "service": "auth", "message": "JWT令牌验证失败", "metadata": {"reason": "expired", "userId": "user-123"}},
    {"id": "err-008", "timestamp": "2025-01-10T14:30:08.000Z", "level": "ERROR", "source": "backend", "service": "auth", "message": "登录失败次数过多", "metadata": {"ip": "192.168.1.100", "attempts": 10}},
    {"id": "err-009", "timestamp": "2025-01-10T14:30:09.000Z", "level": "ERROR", "source": "frontend", "service": "ui", "message": "页面加载失败", "metadata": {"url": "/dashboard", "error": "NETWORK_ERROR"}},
    {"id": "err-010", "timestamp": "2025-01-10T14:30:10.000Z", "level": "CRITICAL", "source": "backend", "service": "payment", "message": "支付系统异常", "metadata": {"orderId": "ORD-12345", "amount": 999.99}}
  ]
}' "HIGH" "database_errors,timeout_errors"

# 2. 安全攻击模式测试
run_test "安全攻击模式" '{
  "logs": [
    {"id": "sec-001", "timestamp": "2025-01-10T14:30:01.000Z", "level": "WARN", "source": "security", "service": "firewall", "message": "可疑IP访问", "metadata": {"ip": "10.0.0.1", "country": "Unknown", "requests": 1000}},
    {"id": "sec-002", "timestamp": "2025-01-10T14:30:02.000Z", "level": "WARN", "source": "security", "service": "firewall", "message": "可疑IP访问", "metadata": {"ip": "10.0.0.1", "country": "Unknown", "requests": 1500}},
    {"id": "sec-003", "timestamp": "2025-01-10T14:30:03.000Z", "level": "ERROR", "source": "security", "service": "auth", "message": "暴力破解尝试", "metadata": {"ip": "10.0.0.1", "username": "admin", "attempts": 50}},
    {"id": "sec-004", "timestamp": "2025-01-10T14:30:04.000Z", "level": "ERROR", "source": "security", "service": "waf", "message": "SQL注入尝试", "metadata": {"ip": "10.0.0.1", "payload": "1 OR 1=1", "blocked": true}},
    {"id": "sec-005", "timestamp": "2025-01-10T14:30:05.000Z", "level": "ERROR", "source": "security", "service": "waf", "message": "XSS攻击尝试", "metadata": {"ip": "10.0.0.1", "payload": "<script>alert(1)</script>", "blocked": true}},
    {"id": "sec-006", "timestamp": "2025-01-10T14:30:06.000Z", "level": "CRITICAL", "source": "security", "service": "ids", "message": "检测到DDoS攻击", "metadata": {"sourceIPs": ["10.0.0.1", "10.0.0.2", "10.0.0.3"], "requestRate": 10000}},
    {"id": "sec-007", "timestamp": "2025-01-10T14:30:07.000Z", "level": "ERROR", "source": "security", "service": "auth", "message": "异常登录地理位置", "metadata": {"userId": "user-456", "location": "Russia", "lastLocation": "China"}},
    {"id": "sec-008", "timestamp": "2025-01-10T14:30:08.000Z", "level": "WARN", "source": "security", "service": "scanner", "message": "端口扫描检测", "metadata": {"ip": "10.0.0.1", "ports": [22, 80, 443, 3306, 5432]}},
    {"id": "sec-009", "timestamp": "2025-01-10T14:30:09.000Z", "level": "ERROR", "source": "security", "service": "file", "message": "恶意文件上传尝试", "metadata": {"ip": "10.0.0.1", "filename": "shell.php", "blocked": true}},
    {"id": "sec-010", "timestamp": "2025-01-10T14:30:10.000Z", "level": "CRITICAL", "source": "security", "service": "honeypot", "message": "蜜罐系统触发", "metadata": {"ip": "10.0.0.1", "service": "ssh", "attempts": 100}}
  ]
}' "CRITICAL" "security_attacks"

# 3. 系统崩溃场景测试
run_test "系统崩溃场景" '{
  "logs": [
    {"id": "crash-001", "timestamp": "2025-01-10T14:30:01.000Z", "level": "INFO", "source": "system", "service": "monitor", "message": "系统负载正常", "metadata": {"cpu": "45%", "memory": "60%", "disk": "70%"}},
    {"id": "crash-002", "timestamp": "2025-01-10T14:30:10.000Z", "level": "WARN", "source": "system", "service": "monitor", "message": "CPU使用率异常", "metadata": {"cpu": "85%", "memory": "75%", "disk": "72%"}},
    {"id": "crash-003", "timestamp": "2025-01-10T14:30:20.000Z", "level": "ERROR", "source": "system", "service": "monitor", "message": "内存使用率过高", "metadata": {"cpu": "90%", "memory": "95%", "disk": "75%"}},
    {"id": "crash-004", "timestamp": "2025-01-10T14:30:25.000Z", "level": "FATAL", "source": "system", "service": "core", "message": "JVM堆内存溢出", "metadata": {"heapUsed": "2GB", "heapMax": "2GB", "error": "OutOfMemoryError"}},
    {"id": "crash-005", "timestamp": "2025-01-10T14:30:26.000Z", "level": "ERROR", "source": "system", "service": "database", "message": "数据库连接池耗尽", "metadata": {"activeConnections": 100, "maxConnections": 100}},
    {"id": "crash-006", "timestamp": "2025-01-10T14:30:27.000Z", "level": "CRITICAL", "source": "system", "service": "api", "message": "服务响应超时", "metadata": {"endpoint": "/api/health", "responseTime": 60000}},
    {"id": "crash-007", "timestamp": "2025-01-10T14:30:28.000Z", "level": "FATAL", "source": "system", "service": "core", "message": "应用程序崩溃", "metadata": {"exitCode": -1, "signal": "SIGKILL"}},
    {"id": "crash-008", "timestamp": "2025-01-10T14:30:30.000Z", "level": "INFO", "source": "system", "service": "orchestrator", "message": "尝试重启服务", "metadata": {"service": "api-server", "attempt": 1}},
    {"id": "crash-009", "timestamp": "2025-01-10T14:30:35.000Z", "level": "ERROR", "source": "system", "service": "orchestrator", "message": "服务重启失败", "metadata": {"service": "api-server", "attempt": 1, "error": "PORT_IN_USE"}},
    {"id": "crash-010", "timestamp": "2025-01-10T14:30:40.000Z", "level": "CRITICAL", "source": "system", "service": "orchestrator", "message": "系统进入故障转移模式", "metadata": {"primaryNode": "down", "backupNode": "activating"}}
  ]
}' "CRITICAL" "system_crash"

# 正常测试用例
echo -e "${GREEN}✅ 正常日志验证集${NC}"
echo "===================="

# 4. 正常用户登录流程
run_test "正常用户登录流程" '{
  "logs": [
    {"id": "login-001", "timestamp": "2025-01-10T14:30:01.000Z", "level": "INFO", "source": "frontend", "service": "auth", "message": "用户访问登录页面", "metadata": {"userId": "user-789", "sessionId": "sess-abc123", "userAgent": "Chrome/120.0.0.0"}},
    {"id": "login-002", "timestamp": "2025-01-10T14:30:05.000Z", "level": "INFO", "source": "frontend", "service": "auth", "message": "用户提交登录表单", "metadata": {"userId": "user-789", "sessionId": "sess-abc123", "loginType": "email"}},
    {"id": "login-003", "timestamp": "2025-01-10T14:30:06.000Z", "level": "INFO", "source": "backend", "service": "auth", "message": "验证用户凭据", "metadata": {"userId": "user-789", "sessionId": "sess-abc123", "method": "bcrypt"}},
    {"id": "login-004", "timestamp": "2025-01-10T14:30:07.000Z", "level": "INFO", "source": "backend", "service": "auth", "message": "生成JWT令牌", "metadata": {"userId": "user-789", "sessionId": "sess-abc123", "tokenType": "access"}},
    {"id": "login-005", "timestamp": "2025-01-10T14:30:08.000Z", "level": "INFO", "source": "backend", "service": "auth", "message": "登录成功", "metadata": {"userId": "user-789", "sessionId": "sess-abc123", "ip": "192.168.1.50"}},
    {"id": "login-006", "timestamp": "2025-01-10T14:30:09.000Z", "level": "INFO", "source": "frontend", "service": "dashboard", "message": "重定向到仪表板", "metadata": {"userId": "user-789", "sessionId": "sess-abc123", "route": "/dashboard"}},
    {"id": "login-007", "timestamp": "2025-01-10T14:30:10.000Z", "level": "INFO", "source": "backend", "service": "user", "message": "获取用户配置", "metadata": {"userId": "user-789", "sessionId": "sess-abc123", "preferences": "loaded"}},
    {"id": "login-008", "timestamp": "2025-01-10T14:30:11.000Z", "level": "INFO", "source": "backend", "service": "audit", "message": "记录登录事件", "metadata": {"userId": "user-789", "sessionId": "sess-abc123", "event": "user_login"}}
  ]
}' "LOW" "normal_flow"

# 5. 常规API调用
run_test "常规API调用" '{
  "logs": [
    {"id": "api-001", "timestamp": "2025-01-10T14:30:01.000Z", "level": "INFO", "source": "api", "service": "gateway", "message": "API请求接收", "metadata": {"endpoint": "/api/users", "method": "GET", "ip": "192.168.1.100"}},
    {"id": "api-002", "timestamp": "2025-01-10T14:30:01.100Z", "level": "INFO", "source": "api", "service": "auth", "message": "令牌验证成功", "metadata": {"userId": "user-456", "tokenType": "bearer"}},
    {"id": "api-003", "timestamp": "2025-01-10T14:30:01.200Z", "level": "INFO", "source": "api", "service": "users", "message": "查询用户列表", "metadata": {"limit": 20, "offset": 0, "filters": {}}},
    {"id": "api-004", "timestamp": "2025-01-10T14:30:01.350Z", "level": "INFO", "source": "database", "service": "mysql", "message": "执行SQL查询", "metadata": {"query": "SELECT * FROM users", "executionTime": "45ms"}},
    {"id": "api-005", "timestamp": "2025-01-10T14:30:01.400Z", "level": "INFO", "source": "api", "service": "users", "message": "数据序列化", "metadata": {"recordCount": 18, "format": "json"}},
    {"id": "api-006", "timestamp": "2025-01-10T14:30:01.450Z", "level": "INFO", "source": "api", "service": "gateway", "message": "API响应发送", "metadata": {"statusCode": 200, "responseTime": "450ms", "dataSize": "2.3KB"}},
    {"id": "api-007", "timestamp": "2025-01-10T14:30:02.000Z", "level": "INFO", "source": "api", "service": "metrics", "message": "记录API指标", "metadata": {"endpoint": "/api/users", "responseTime": 450, "status": "success"}}
  ]
}' "LOW" "normal_api"

# 6. 定时任务执行
run_test "定时任务执行" '{
  "logs": [
    {"id": "cron-001", "timestamp": "2025-01-10T14:00:00.000Z", "level": "INFO", "source": "scheduler", "service": "cron", "message": "定时任务开始执行", "metadata": {"jobName": "daily_backup", "schedule": "0 2 * * *"}},
    {"id": "cron-002", "timestamp": "2025-01-10T14:00:01.000Z", "level": "INFO", "source": "backup", "service": "database", "message": "开始数据库备份", "metadata": {"database": "production", "type": "full"}},
    {"id": "cron-003", "timestamp": "2025-01-10T14:00:30.000Z", "level": "INFO", "source": "backup", "service": "database", "message": "备份进度", "metadata": {"progress": "25%", "tablesCompleted": 10, "totalTables": 40}},
    {"id": "cron-004", "timestamp": "2025-01-10T14:01:00.000Z", "level": "INFO", "source": "backup", "service": "database", "message": "备份进度", "metadata": {"progress": "50%", "tablesCompleted": 20, "totalTables": 40}},
    {"id": "cron-005", "timestamp": "2025-01-10T14:01:30.000Z", "level": "INFO", "source": "backup", "service": "database", "message": "备份进度", "metadata": {"progress": "75%", "tablesCompleted": 30, "totalTables": 40}},
    {"id": "cron-006", "timestamp": "2025-01-10T14:02:00.000Z", "level": "INFO", "source": "backup", "service": "database", "message": "数据库备份完成", "metadata": {"backupSize": "2.5GB", "duration": "120s", "location": "/backups/prod_20250110.sql"}},
    {"id": "cron-007", "timestamp": "2025-01-10T14:02:01.000Z", "level": "INFO", "source": "backup", "service": "storage", "message": "上传备份到云存储", "metadata": {"provider": "AWS S3", "bucket": "company-backups"}},
    {"id": "cron-008", "timestamp": "2025-01-10T14:02:30.000Z", "level": "INFO", "source": "backup", "service": "storage", "message": "备份上传完成", "metadata": {"uploadTime": "29s", "s3Key": "backups/2025/01/10/prod_20250110.sql"}},
    {"id": "cron-009", "timestamp": "2025-01-10T14:02:31.000Z", "level": "INFO", "source": "scheduler", "service": "cron", "message": "定时任务执行完成", "metadata": {"jobName": "daily_backup", "status": "success", "totalDuration": "151s"}}
  ]
}' "LOW" "scheduled_task"

# 边界测试用例
echo -e "${YELLOW}⚡ 边界测试用例${NC}"
echo "===================="

# 7. 混合场景测试
run_test "混合异常正常场景" '{
  "logs": [
    {"id": "mix-001", "timestamp": "2025-01-10T14:30:01.000Z", "level": "INFO", "source": "api", "service": "users", "message": "用户登录成功", "metadata": {"userId": "user-100", "ip": "192.168.1.50"}},
    {"id": "mix-002", "timestamp": "2025-01-10T14:30:02.000Z", "level": "WARN", "source": "api", "service": "users", "message": "慢查询检测", "metadata": {"query": "SELECT * FROM orders", "duration": "5000ms"}},
    {"id": "mix-003", "timestamp": "2025-01-10T14:30:03.000Z", "level": "INFO", "source": "api", "service": "orders", "message": "创建订单", "metadata": {"orderId": "ORD-001", "userId": "user-100", "amount": 299.99}},
    {"id": "mix-004", "timestamp": "2025-01-10T14:30:04.000Z", "level": "ERROR", "source": "payment", "service": "gateway", "message": "支付网关暂时不可用", "metadata": {"gateway": "stripe", "error": "SERVICE_UNAVAILABLE"}},
    {"id": "mix-005", "timestamp": "2025-01-10T14:30:05.000Z", "level": "INFO", "source": "api", "service": "orders", "message": "订单状态更新", "metadata": {"orderId": "ORD-001", "status": "pending", "reason": "payment_failed"}},
    {"id": "mix-006", "timestamp": "2025-01-10T14:30:10.000Z", "level": "INFO", "source": "payment", "service": "retry", "message": "重试支付处理", "metadata": {"orderId": "ORD-001", "attempt": 1}},
    {"id": "mix-007", "timestamp": "2025-01-10T14:30:15.000Z", "level": "INFO", "source": "payment", "service": "gateway", "message": "支付成功", "metadata": {"orderId": "ORD-001", "transactionId": "txn_123456", "amount": 299.99}},
    {"id": "mix-008", "timestamp": "2025-01-10T14:30:16.000Z", "level": "INFO", "source": "api", "service": "orders", "message": "订单完成", "metadata": {"orderId": "ORD-001", "status": "completed", "finalAmount": 299.99}}
  ]
}' "ANY" "mixed_scenario"

# 8. 空日志和边界数据测试
run_test "边界数据测试" '{
  "logs": [
    {"id": "bound-001", "timestamp": "2025-01-10T14:30:01.000Z", "level": "INFO", "source": "", "service": "", "message": "", "metadata": {}},
    {"id": "bound-002", "timestamp": "2025-01-10T14:30:02.000Z", "level": "DEBUG", "source": "test", "service": "test", "message": "这是一条非常长的日志消息，包含大量的详细信息和描述，用于测试系统对长文本的处理能力和性能表现，确保在处理大量文本时不会出现性能问题或内存溢出的情况", "metadata": {"data": "large_payload"}},
    {"id": "bound-003", "timestamp": "2025-01-10T14:30:03.000Z", "level": "INFO", "source": "special_chars", "service": "unicode", "message": "测试特殊字符: 🚀 ♨️ ⚡ 💯 🔥 ✅ ❌ ⚠️", "metadata": {"emoji": true, "unicode": "✓"}}
  ]
}' "LOW" "boundary_test"

# 性能测试用例
echo -e "${PURPLE}⚡ 性能测试用例${NC}"
echo "===================="

# 9. 大量日志测试
generate_large_log_set() {
    echo '{"logs": ['
    for i in {1..100}; do
        cat << EOF
{"id": "perf-$(printf "%03d" $i)", "timestamp": "2025-01-10T14:30:$(printf "%02d" $((i%60))).000Z", "level": "INFO", "source": "performance", "service": "test", "message": "性能测试日志 $i", "metadata": {"iteration": $i, "batch": "performance_test"}}$([ $i -lt 100 ] && echo ",")
EOF
    done
    echo ']}'
}

echo -e "${PURPLE}🚀 大量日志性能测试 (100条日志)${NC}"
large_log_data=$(generate_large_log_set)
run_test "大量日志性能测试" "$large_log_data" "LOW" "performance_test"

# 生成测试报告
echo -e "${CYAN}📊 生成测试报告${NC}"
echo "===================="

REPORT_FILE="$RESULTS_DIR/test_report_$TIMESTAMP.md"

cat > "$REPORT_FILE" << EOF
# 日志分析系统测试报告

**测试时间**: $(date)
**测试环境**: $(uname -a)

## 测试统计

- **总测试数**: $TOTAL_TESTS
- **通过测试**: $PASSED_TESTS
- **失败测试**: $FAILED_TESTS
- **成功率**: $(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l)%

## 测试用例分类

### 🚨 异常测试用例
1. 高频错误日志测试
2. 安全攻击模式测试  
3. 系统崩溃场景测试

### ✅ 正常验证用例
4. 正常用户登录流程
5. 常规API调用
6. 定时任务执行

### ⚡ 边界测试用例
7. 混合异常正常场景
8. 边界数据测试

### 🚀 性能测试用例
9. 大量日志性能测试

## 详细结果

所有测试结果已保存到: \`$RESULTS_DIR\`

## 建议

- 查看失败的测试用例，分析系统检测能力
- 关注性能测试结果，优化处理速度
- 验证边界情况的处理是否符合预期

EOF

echo -e "📋 测试报告已生成: ${GREEN}$REPORT_FILE${NC}"

# 总结
echo ""
echo -e "${CYAN}🎯 测试完成总结${NC}"
echo "================================"
echo -e "总测试数: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "通过: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失败: ${RED}$FAILED_TESTS${NC}"
echo -e "成功率: ${YELLOW}$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l)%${NC}"
echo ""
echo -e "📁 所有结果文件保存在: ${CYAN}$RESULTS_DIR${NC}"
echo -e "📋 详细报告: ${GREEN}$REPORT_FILE${NC}"
echo ""
echo "🎉 测试套件执行完成！" 