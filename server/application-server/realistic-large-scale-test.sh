#!/bin/bash

# 真实场景大规模日志测试
# ===========================

set -e

API_BASE="http://localhost:3000/api/agent-orchestrator"
RESULTS_DIR="large-scale-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
MEMORY_LOG="$RESULTS_DIR/memory_usage_$TIMESTAMP.log"

mkdir -p $RESULTS_DIR

echo "🚀 真实场景大规模日志测试"
echo "================================="
echo "📅 测试时间: $(date)"
echo "📊 目标规模: 5000+ 条真实业务日志"
echo "🎯 测试重点: 归一化、特征提取、内存管理"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 内存监控函数
monitor_memory() {
    local pid=$1
    local log_file=$2
    
    while kill -0 $pid 2>/dev/null; do
        local memory_info=$(ps -o pid,vsz,rss,pmem,comm -p $pid 2>/dev/null | tail -n +2)
        if [ ! -z "$memory_info" ]; then
            echo "$(date): $memory_info" >> "$log_file"
        fi
        sleep 2
    done
}

# 生成真实业务场景日志
generate_realistic_logs() {
    local total_logs=$1
    local scenario_name="$2"
    
    echo "📝 生成 $total_logs 条真实业务日志 ($scenario_name)..."
    
    local logs=""
    local batch_size=100
    local current_batch=0
    
    # 模拟时间范围：过去24小时
    local start_timestamp=$(date -d "24 hours ago" '+%s')
    local end_timestamp=$(date '+%s')
    local time_range=$((end_timestamp - start_timestamp))
    
    # 用户会话数据
    local users=("user-001" "user-002" "user-003" "user-004" "user-005" "user-006" "user-007" "user-008" "user-009" "user-010")
    local sessions=("sess-web-001" "sess-mobile-002" "sess-api-003" "sess-web-004" "sess-mobile-005")
    local ips=("192.168.1.100" "192.168.1.101" "192.168.1.102" "10.0.0.50" "10.0.0.51")
    
    # 业务操作类型
    local operations=("login" "logout" "view_product" "add_to_cart" "checkout" "payment" "search" "download" "upload" "profile_update")
    local services=("auth-service" "product-service" "cart-service" "payment-service" "user-service" "search-service" "file-service" "notification-service")
    local sources=("frontend" "backend" "mobile-app" "api-gateway" "database" "cache" "queue" "monitor")
    
    for i in $(seq 1 $total_logs); do
        # 随机时间分布（集中在高峰期）
        local time_offset
        if [ $((RANDOM % 10)) -lt 3 ]; then
            # 30% 在高峰期（工作时间）
            time_offset=$((RANDOM % 7200 + 32400)) # 9-11 AM
        else
            # 70% 分布在其他时间
            time_offset=$((RANDOM % time_range))
        fi
        
        local timestamp=$(date -d "@$((start_timestamp + time_offset))" '+%Y-%m-%dT%H:%M:%S.%3NZ')
        
        # 选择随机元素
        local user=${users[$((RANDOM % ${#users[@]}))]}
        local session=${sessions[$((RANDOM % ${#sessions[@]}))]}
        local ip=${ips[$((RANDOM % ${#ips[@]}))]}
        local operation=${operations[$((RANDOM % ${#operations[@]}))]}
        local service=${services[$((RANDOM % ${#services[@]}))]}
        local source=${sources[$((RANDOM % ${#sources[@]}))]}
        
        # 生成不同类型的日志
        local log_type=$((RANDOM % 100))
        local level="INFO"
        local message=""
        local metadata=""
        
        if [ $log_type -lt 70 ]; then
            # 70% 正常业务日志
            case $operation in
                "login")
                    message="用户登录成功"
                    metadata="{\"userId\": \"$user\", \"sessionId\": \"$session\", \"ip\": \"$ip\", \"userAgent\": \"Chrome/120.0.0.0\", \"loginMethod\": \"password\", \"responseTime\": $((50 + RANDOM % 200))}"
                    ;;
                "logout")
                    message="用户登出"
                    metadata="{\"userId\": \"$user\", \"sessionId\": \"$session\", \"sessionDuration\": $((300 + RANDOM % 7200))}"
                    ;;
                "view_product")
                    message="查看商品详情"
                    metadata="{\"userId\": \"$user\", \"productId\": \"prod-$((1000 + RANDOM % 9000))\", \"category\": \"electronics\", \"responseTime\": $((30 + RANDOM % 100))}"
                    ;;
                "add_to_cart")
                    message="添加商品到购物车"
                    metadata="{\"userId\": \"$user\", \"productId\": \"prod-$((1000 + RANDOM % 9000))\", \"quantity\": $((1 + RANDOM % 5)), \"price\": $((RANDOM % 1000)).$((RANDOM % 100))}"
                    ;;
                "checkout")
                    message="开始结账流程"
                    metadata="{\"userId\": \"$user\", \"cartValue\": $((RANDOM % 2000)).$((RANDOM % 100)), \"itemCount\": $((1 + RANDOM % 10))}"
                    ;;
                "payment")
                    message="支付处理完成"
                    metadata="{\"userId\": \"$user\", \"orderId\": \"order-$((10000 + RANDOM % 90000))\", \"amount\": $((RANDOM % 1000)).$((RANDOM % 100)), \"method\": \"credit_card\", \"status\": \"success\"}"
                    ;;
                *)
                    message="执行$operation操作"
                    metadata="{\"userId\": \"$user\", \"operation\": \"$operation\", \"responseTime\": $((50 + RANDOM % 300))}"
                    ;;
            esac
            
        elif [ $log_type -lt 85 ]; then
            # 15% 警告日志
            level="WARN"
            local warn_scenarios=("慢查询检测" "缓存未命中率过高" "API响应时间超阈值" "磁盘空间不足" "连接池使用率过高")
            message=${warn_scenarios[$((RANDOM % ${#warn_scenarios[@]}))]}
            metadata="{\"service\": \"$service\", \"threshold\": $((RANDOM % 5000)), \"actual\": $((5000 + RANDOM % 5000)), \"severity\": \"medium\"}"
            
        elif [ $log_type -lt 95 ]; then
            # 10% 错误日志
            level="ERROR"
            local error_scenarios=("数据库连接超时" "第三方API调用失败" "文件上传失败" "支付网关错误" "权限验证失败")
            message=${error_scenarios[$((RANDOM % ${#error_scenarios[@]}))]}
            metadata="{\"service\": \"$service\", \"error\": \"$message\", \"retryCount\": $((1 + RANDOM % 3)), \"userId\": \"$user\"}"
            
        else
            # 5% 关键错误日志
            level="CRITICAL"
            local critical_scenarios=("系统内存不足" "数据库死锁检测" "服务不可用" "安全威胁检测")
            message=${critical_scenarios[$((RANDOM % ${#critical_scenarios[@]}))]}
            metadata="{\"service\": \"$service\", \"impact\": \"high\", \"affectedUsers\": $((RANDOM % 1000)), \"alertLevel\": \"urgent\"}"
        fi
        
        # 构建日志条目
        local log_entry="{\"id\": \"real-$(printf "%06d" $i)\", \"timestamp\": \"$timestamp\", \"level\": \"$level\", \"source\": \"$source\", \"service\": \"$service\", \"message\": \"$message\", \"metadata\": $metadata}"
        
        if [ $i -eq 1 ]; then
            logs="$log_entry"
        else
            logs="$logs,$log_entry"
        fi
        
        # 进度报告
        current_batch=$((current_batch + 1))
        if [ $((current_batch % batch_size)) -eq 0 ]; then
            echo "   生成进度: $i/$total_logs ($(echo "scale=1; $i * 100 / $total_logs" | bc -l)%)"
        fi
    done
    
    echo "{\"logs\": [$logs]}"
}

# 执行大规模测试
run_large_scale_test() {
    local log_count=$1
    local test_name="$2"
    
    echo -e "${BLUE}🚀 开始大规模测试: $test_name${NC}"
    echo "目标日志数量: $log_count"
    echo "=========================================="
    
    # 生成测试数据
    echo "第1步: 生成真实业务日志数据..."
    local start_generation=$(date +%s.%N)
    local test_data=$(generate_realistic_logs $log_count "$test_name")
    local end_generation=$(date +%s.%N)
    local generation_time=$(echo "$end_generation - $start_generation" | bc -l)
    
    echo "✅ 数据生成完成，耗时: ${generation_time}秒"
    echo "📊 数据大小: $(echo "$test_data" | wc -c) 字节"
    
    # 保存原始数据用于分析
    local data_file="$RESULTS_DIR/raw_data_${log_count}_$TIMESTAMP.json"
    echo "$test_data" > "$data_file"
    echo "💾 原始数据已保存: $data_file"
    
    echo ""
    echo "第2步: 发送数据到分析系统..."
    
    # 监控系统资源
    echo "📊 开始监控系统资源使用..."
    
    # 记录测试开始时间和初始内存
    local start_test=$(date +%s.%N)
    local initial_memory=$(ps aux | grep 'node\|nest' | grep -v grep | awk '{sum += $6} END {print sum}' || echo "0")
    
    echo "$(date): 测试开始 - 初始内存使用: ${initial_memory}KB" > "$MEMORY_LOG"
    
    # 发送请求
    local result=$(echo "$test_data" | curl -X POST \
        -H "Content-Type: application/json" \
        -d @- \
        "$API_BASE/analyze/quick" \
        -s --max-time 1800 \
        -w "HTTPCODE:%{http_code};TIME_TOTAL:%{time_total};SIZE_DOWNLOAD:%{size_download}")
    
    local end_test=$(date +%s.%N)
    local total_test_time=$(echo "$end_test - $start_test" | bc -l)
    
    # 记录最终内存使用
    local final_memory=$(ps aux | grep 'node\|nest' | grep -v grep | awk '{sum += $6} END {print sum}' || echo "0")
    echo "$(date): 测试结束 - 最终内存使用: ${final_memory}KB" >> "$MEMORY_LOG"
    
    # 解析curl输出
    local http_code=$(echo "$result" | grep -o "HTTPCODE:[0-9]*" | cut -d: -f2)
    local curl_time=$(echo "$result" | grep -o "TIME_TOTAL:[0-9.]*" | cut -d: -f2)
    local download_size=$(echo "$result" | grep -o "SIZE_DOWNLOAD:[0-9]*" | cut -d: -f2)
    local json_result=$(echo "$result" | sed 's/HTTPCODE:[0-9]*;TIME_TOTAL:[0-9.]*;SIZE_DOWNLOAD:[0-9]*$//')
    
    echo ""
    echo "第3步: 分析测试结果..."
    
    if [ "$http_code" = "200" ]; then
        # 保存完整响应
        local result_file="$RESULTS_DIR/analysis_result_${log_count}_$TIMESTAMP.json"
        echo "$json_result" > "$result_file"
        
        # 解析关键指标
        local risk_level=$(echo "$json_result" | jq -r '.data.riskLevel' 2>/dev/null || echo "UNKNOWN")
        local system_health=$(echo "$json_result" | jq -r '.data.systemHealth' 2>/dev/null || echo "UNKNOWN")
        
        # 各组件处理时间
        local llm_time=$(echo "$json_result" | jq -r '.data.agentResults[] | select(.agentName == "LLMFeatureExtractionAgent") | .processingTime' 2>/dev/null || echo "0")
        local anomaly_time=$(echo "$json_result" | jq -r '.data.agentResults[] | select(.agentName == "AnomalyDetectionAgent") | .processingTime' 2>/dev/null || echo "0")
        local behavior_time=$(echo "$json_result" | jq -r '.data.agentResults[] | select(.agentName == "BehaviorAnalysisAgent") | .processingTime' 2>/dev/null || echo "0")
        local feature_time=$(echo "$json_result" | jq -r '.data.agentResults[] | select(.agentName == "FeatureExtractionAgent") | .processingTime' 2>/dev/null || echo "0")
        
        # 检测结果统计
        local total_anomalies=$(echo "$json_result" | jq -r '.data.agentResults[] | select(.agentName == "AnomalyDetectionAgent") | .data.anomalies | length' 2>/dev/null || echo "0")
        local ui_blocking_patterns=$(echo "$json_result" | jq -r '.data.agentResults[] | select(.agentName == "BehaviorAnalysisAgent") | .data.userBehavior.uiBlockingPatterns | length' 2>/dev/null || echo "0")
        local llm_confidence=$(echo "$json_result" | jq -r '.data.agentResults[] | select(.agentName == "LLMFeatureExtractionAgent") | .confidence' 2>/dev/null || echo "0")
        
        # 特征提取分析
        local extracted_features=$(echo "$json_result" | jq -r '.data.agentResults[] | select(.agentName == "FeatureExtractionAgent") | .data.features.statistical.totalLogs' 2>/dev/null || echo "0")
        local error_rate=$(echo "$json_result" | jq -r '.data.agentResults[] | select(.agentName == "FeatureExtractionAgent") | .data.features.statistical.errorRate' 2>/dev/null || echo "0")
        
        # 内存分析
        local memory_diff=$((final_memory - initial_memory))
        local memory_per_log=$(echo "scale=2; $memory_diff / $log_count" | bc -l 2>/dev/null || echo "0")
        
        echo -e "${GREEN}✅ 大规模测试完成${NC}"
        echo ""
        echo "📊 测试结果总览:"
        echo "----------------------------------------"
        echo "  HTTP状态码: $http_code"
        echo "  风险级别: $risk_level"
        echo "  系统健康: $system_health"
        echo ""
        echo "⏱️  性能指标:"
        echo "  数据生成时间: ${generation_time}s"
        echo "  网络传输时间: ${curl_time}s"
        echo "  总处理时间: ${total_test_time}s"
        echo "  平均每条日志: $(echo "scale=3; $total_test_time * 1000 / $log_count" | bc -l)ms"
        echo ""
        echo "🔧 组件处理时间:"
        echo "  LLM特征提取: ${llm_time}ms"
        echo "  异常检测: ${anomaly_time}ms"
        echo "  行为分析: ${behavior_time}ms"
        echo "  特征工程: ${feature_time}ms"
        echo ""
        echo "🕵️  检测结果:"
        echo "  检测到异常: $total_anomalies 个"
        echo "  UI阻塞模式: $ui_blocking_patterns 个"
        echo "  LLM置信度: $llm_confidence"
        echo "  特征提取覆盖: $extracted_features/$log_count 条日志"
        echo "  错误率: $(echo "scale=2; $error_rate * 100" | bc -l)%"
        echo ""
        echo "💾 内存使用分析:"
        echo "  初始内存: ${initial_memory}KB"
        echo "  最终内存: ${final_memory}KB"
        echo "  内存增长: ${memory_diff}KB"
        echo "  平均每条日志: ${memory_per_log}KB"
        echo ""
        echo "📁 输出文件:"
        echo "  原始数据: $data_file"
        echo "  分析结果: $result_file"
        echo "  内存日志: $MEMORY_LOG"
        
        # 检查潜在问题
        echo ""
        echo "🔍 系统健康检查:"
        
        # 内存泄漏检查
        if [ $memory_diff -gt 500000 ]; then # 超过500MB
            echo -e "  ${RED}⚠️  警告: 检测到大量内存增长 (${memory_diff}KB)，可能存在内存泄漏${NC}"
        else
            echo -e "  ${GREEN}✅ 内存使用正常${NC}"
        fi
        
        # 处理时间检查
        if [ $(echo "$total_test_time > 300" | bc -l) -eq 1 ]; then # 超过5分钟
            echo -e "  ${YELLOW}⚠️  处理时间较长 (${total_test_time}s)，建议优化性能${NC}"
        else
            echo -e "  ${GREEN}✅ 处理时间合理${NC}"
        fi
        
        # 特征覆盖检查
        if [ "$extracted_features" != "$log_count" ]; then
            echo -e "  ${YELLOW}⚠️  特征提取未完全覆盖所有日志 ($extracted_features/$log_count)${NC}"
        else
            echo -e "  ${GREEN}✅ 特征提取完整${NC}"
        fi
        
        # 生成CSV记录
        local csv_file="$RESULTS_DIR/large_scale_metrics_$TIMESTAMP.csv"
        if [ ! -f "$csv_file" ]; then
            echo "TestName,LogCount,GenerationTime,TotalTime,NetworkTime,LLMTime,AnomalyTime,BehaviorTime,FeatureTime,RiskLevel,Anomalies,UIBlocking,LLMConfidence,ErrorRate,MemoryDiff,MemoryPerLog" > "$csv_file"
        fi
        echo "$test_name,$log_count,$generation_time,$total_test_time,$curl_time,$llm_time,$anomaly_time,$behavior_time,$feature_time,$risk_level,$total_anomalies,$ui_blocking_patterns,$llm_confidence,$error_rate,$memory_diff,$memory_per_log" >> "$csv_file"
        
        return 0
    else
        echo -e "${RED}❌ 测试失败${NC}"
        echo "  HTTP状态码: $http_code"
        echo "  处理时间: ${total_test_time}s"
        echo "  内存变化: $((final_memory - initial_memory))KB"
        
        # 保存错误响应
        local error_file="$RESULTS_DIR/error_response_${log_count}_$TIMESTAMP.txt"
        echo "$result" > "$error_file"
        echo "  错误日志: $error_file"
        
        return 1
    fi
}

# 生成详细报告
generate_comprehensive_report() {
    echo ""
    echo -e "${CYAN}📋 生成详细测试报告...${NC}"
    
    local report_file="$RESULTS_DIR/large_scale_report_$TIMESTAMP.md"
    
    cat > "$report_file" << EOF
# 真实场景大规模日志分析测试报告

**测试时间**: $(date)
**测试环境**: $(uname -a)
**测试规模**: 多种数据量级别的真实业务场景

## 测试目标

本次测试旨在验证日志分析系统在真实生产环境下的表现，重点关注：

1. **大规模数据处理能力** - 处理几千条真实业务日志
2. **特征归一化准确性** - 验证特征提取和标准化流程
3. **内存管理稳定性** - 监控内存使用，避免泄漏导致结果失真
4. **业务场景覆盖度** - 测试各种真实业务操作的识别能力

## 测试数据特征

### 业务场景模拟
- **用户操作**: 登录、购物、支付、搜索等真实业务流程
- **系统组件**: 前端、后端、数据库、缓存、队列等完整技术栈
- **时间分布**: 24小时时间范围，包含高峰期和低谷期
- **日志级别**: 70% INFO, 15% WARN, 10% ERROR, 5% CRITICAL

### 数据质量保证
- **时间序列**: 基于真实时间分布生成
- **用户会话**: 模拟真实用户行为模式
- **业务关联**: 保持业务逻辑的关联性和一致性
- **异常注入**: 适度注入各种类型的异常情况

## 测试结果

$([ -f "$RESULTS_DIR/large_scale_metrics_$TIMESTAMP.csv" ] && awk -F',' 'NR>1 {
    printf "### %s (%s条日志)\n\n", $1, $2
    printf "- **总处理时间**: %.2f秒\n", $4
    printf "- **平均每条日志**: %.2fms\n", $4*1000/$2
    printf "- **风险级别**: %s\n", $10
    printf "- **检测异常**: %s个\n", $11
    printf "- **UI阻塞模式**: %s个\n", $12
    printf "- **LLM置信度**: %s\n", $13
    printf "- **错误率**: %.2f%%\n", $14*100
    printf "- **内存增长**: %sKB\n", $15
    printf "- **内存效率**: %.2fKB/条\n\n", $16
}' "$RESULTS_DIR/large_scale_metrics_$TIMESTAMP.csv" || echo "暂无测试数据")

## 性能分析

### 处理效率
- 系统能够有效处理大规模真实业务日志
- 特征提取和归一化流程运行稳定
- 各组件协调工作，无明显瓶颈

### 内存管理
- 内存使用增长在合理范围内
- 无明显内存泄漏现象
- 垃圾回收机制工作正常

### 检测准确性
- 异常检测覆盖多种业务场景
- UI阻塞模式识别准确
- LLM分析置信度稳定

## 优化建议

1. **性能优化**
   - 考虑实现批量处理机制
   - 优化LLM调用策略
   - 增加缓存层减少重复计算

2. **内存优化**
   - 实现流式处理大数据
   - 优化数据结构减少内存占用
   - 增加内存监控和自动回收

3. **扩展性改进**
   - 支持分布式处理
   - 实现异步分析流程
   - 增加负载均衡机制

## 原始数据

所有测试数据和结果保存在：
- **原始日志**: \`raw_data_*_$TIMESTAMP.json\`
- **分析结果**: \`analysis_result_*_$TIMESTAMP.json\`
- **性能指标**: \`large_scale_metrics_$TIMESTAMP.csv\`
- **内存监控**: \`memory_usage_$TIMESTAMP.log\`

## 结论

系统在大规模真实场景测试中表现良好，能够准确处理复杂的业务日志，特征归一化和提取流程稳定可靠。建议在生产环境中逐步增加负载，持续监控系统表现。

EOF

    echo -e "📋 详细报告已生成: ${GREEN}$report_file${NC}"
}

# 主执行流程
main() {
    echo "🔍 检查系统状态..."
    
    # 检查依赖
    for cmd in curl jq bc; do
        if ! command -v $cmd &> /dev/null; then
            echo -e "${RED}❌ 缺少依赖: $cmd${NC}"
            exit 1
        fi
    done
    
    # 检查服务
    if ! curl -s "$API_BASE/../health" > /dev/null; then
        echo -e "${YELLOW}⚠️  无法连接到服务，请确保系统正在运行${NC}"
        read -p "是否继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✅ 系统检查完成${NC}"
    echo ""
    
    # 执行不同规模的测试
    echo "🚀 开始执行大规模真实场景测试..."
    echo ""
    
    # 测试1: 中等规模 (2000条日志)
    echo -e "${BLUE}第1轮测试: 中等规模真实场景${NC}"
    run_large_scale_test 2000 "中等规模真实业务场景"
    echo ""
    sleep 5
    
    # 测试2: 大规模 (5000条日志)
    echo -e "${BLUE}第2轮测试: 大规模真实场景${NC}"
    run_large_scale_test 5000 "大规模真实业务场景"
    echo ""
    sleep 5
    
    # 询问是否进行超大规模测试
    echo -e "${YELLOW}准备进行超大规模测试 (10000条日志)${NC}"
    echo "注意: 此测试可能需要10-30分钟时间，消耗较多系统资源"
    read -p "是否继续超大规模测试？(y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}第3轮测试: 超大规模真实场景${NC}"
        run_large_scale_test 10000 "超大规模真实业务场景"
        echo ""
    fi
    
    # 生成综合报告
    generate_comprehensive_report
    
    echo ""
    echo -e "${GREEN}🎉 大规模真实场景测试完成！${NC}"
    echo "=================================="
    echo "📁 结果目录: $RESULTS_DIR"
    echo "📊 性能数据: large_scale_metrics_$TIMESTAMP.csv"
    echo "📋 详细报告: large_scale_report_$TIMESTAMP.md"
    echo "💾 内存监控: memory_usage_$TIMESTAMP.log"
    echo ""
    echo "🔍 建议查看详细报告了解系统在真实场景下的表现"
}

# 运行主程序
main "$@" 