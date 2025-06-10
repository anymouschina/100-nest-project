#!/bin/bash

# 性能基准测试脚本
# ==================

API_BASE="http://localhost:3000/api/agent-orchestrator"
RESULTS_DIR="benchmark-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p $RESULTS_DIR

echo "⚡ 性能基准测试"
echo "================"

# 性能测试函数
benchmark_test() {
    local test_name="$1"
    local log_count="$2"
    local description="$3"
    
    echo "🚀 测试: $test_name ($log_count 条日志)"
    echo "----------------------------------------"
    
    # 生成测试数据
    local test_data=$(generate_logs $log_count)
    
    # 记录开始时间
    local start_time=$(date +%s.%N)
    
    # 发送请求
    local result=$(echo "$test_data" | curl -X POST \
        -H "Content-Type: application/json" \
        -d @- \
        "$API_BASE/analyze/quick" \
        -s --max-time 600 \
        -w "HTTPCODE:%{http_code};TIME:%{time_total}")
    
    # 记录结束时间
    local end_time=$(date +%s.%N)
    local total_time=$(echo "$end_time - $start_time" | bc -l)
    
    # 解析curl输出
    local http_code=$(echo "$result" | grep -o "HTTPCODE:[0-9]*" | cut -d: -f2)
    local curl_time=$(echo "$result" | grep -o "TIME:[0-9.]*" | cut -d: -f2)
    local json_result=$(echo "$result" | sed 's/HTTPCODE:[0-9]*;TIME:[0-9.]*$//')
    
    if [ "$http_code" = "200" ]; then
        # 解析系统响应时间
        local llm_time=$(echo "$json_result" | jq -r '.data.agentResults[] | select(.agentName == "LLMFeatureExtractionAgent") | .processingTime' 2>/dev/null || echo "0")
        local anomaly_time=$(echo "$json_result" | jq -r '.data.agentResults[] | select(.agentName == "AnomalyDetectionAgent") | .processingTime' 2>/dev/null || echo "0")
        local behavior_time=$(echo "$json_result" | jq -r '.data.agentResults[] | select(.agentName == "BehaviorAnalysisAgent") | .processingTime' 2>/dev/null || echo "0")
        local risk_level=$(echo "$json_result" | jq -r '.data.riskLevel' 2>/dev/null || echo "UNKNOWN")
        
        echo "✅ 测试成功"
        echo "   HTTP状态: $http_code"
        echo "   总耗时: ${total_time}s"
        echo "   网络耗时: ${curl_time}s"
        echo "   LLM处理: ${llm_time}ms"
        echo "   异常检测: ${anomaly_time}ms"
        echo "   行为分析: ${behavior_time}ms"
        echo "   风险级别: $risk_level"
        echo "   平均每条日志: $(echo "scale=3; $total_time * 1000 / $log_count" | bc -l)ms"
        
        # 保存详细结果
        echo "$json_result" > "$RESULTS_DIR/benchmark_${log_count}_logs_$TIMESTAMP.json"
        
        # 记录性能指标
        echo "$log_count,$total_time,$curl_time,$llm_time,$anomaly_time,$behavior_time,$risk_level" >> "$RESULTS_DIR/performance_metrics_$TIMESTAMP.csv"
    else
        echo "❌ 测试失败 (HTTP: $http_code)"
        echo "   总耗时: ${total_time}s"
        echo "   网络耗时: ${curl_time}s"
        
        # 记录失败
        echo "$log_count,FAILED,$curl_time,0,0,0,ERROR" >> "$RESULTS_DIR/performance_metrics_$TIMESTAMP.csv"
    fi
    
    echo ""
    sleep 3
}

# 生成日志数据函数
generate_logs() {
    local count=$1
    local logs=""
    
    # 生成混合类型的日志
    for i in $(seq 1 $count); do
        local log_type=$((i % 4))
        local timestamp="2025-01-10T14:$(printf "%02d" $((30 + i/60))):$(printf "%02d" $((i % 60))).000Z"
        
        case $log_type in
            0) # 正常日志
                logs="$logs{\"id\": \"perf-$(printf "%06d" $i)\", \"timestamp\": \"$timestamp\", \"level\": \"INFO\", \"source\": \"api\", \"service\": \"users\", \"message\": \"用户操作成功\", \"metadata\": {\"userId\": \"user-$i\", \"action\": \"view\", \"responseTime\": $((50 + $RANDOM % 200))}}"
                ;;
            1) # 警告日志
                logs="$logs{\"id\": \"perf-$(printf "%06d" $i)\", \"timestamp\": \"$timestamp\", \"level\": \"WARN\", \"source\": \"database\", \"service\": \"mysql\", \"message\": \"慢查询检测\", \"metadata\": {\"query\": \"SELECT * FROM table\", \"duration\": $((1000 + $RANDOM % 3000))}}"
                ;;
            2) # 错误日志  
                logs="$logs{\"id\": \"perf-$(printf "%06d" $i)\", \"timestamp\": \"$timestamp\", \"level\": \"ERROR\", \"source\": \"api\", \"service\": \"payment\", \"message\": \"支付处理失败\", \"metadata\": {\"orderId\": \"order-$i\", \"error\": \"TIMEOUT\", \"retryCount\": $((1 + $RANDOM % 3))}}"
                ;;
            3) # 系统日志
                logs="$logs{\"id\": \"perf-$(printf "%06d" $i)\", \"timestamp\": \"$timestamp\", \"level\": \"INFO\", \"source\": \"system\", \"service\": \"monitor\", \"message\": \"系统监控\", \"metadata\": {\"cpu\": \"$((30 + $RANDOM % 40))%\", \"memory\": \"$((40 + $RANDOM % 30))%\", \"disk\": \"$((20 + $RANDOM % 50))%\"}}"
                ;;
        esac
        
        # 添加逗号分隔符
        if [ $i -lt $count ]; then
            logs="$logs,"
        fi
    done
    
    echo "{\"logs\": [$logs]}"
}

# 初始化CSV文件
echo "LogCount,TotalTime,NetworkTime,LLMTime,AnomalyTime,BehaviorTime,RiskLevel" > "$RESULTS_DIR/performance_metrics_$TIMESTAMP.csv"

# 执行基准测试
echo "📊 开始性能基准测试..."
echo ""

# 小规模测试
benchmark_test "小规模测试" 10 "测试基础功能响应"
benchmark_test "小规模测试" 20 "测试基础功能响应"
benchmark_test "小规模测试" 50 "测试基础功能响应"

# 中等规模测试
benchmark_test "中等规模测试" 100 "测试中等数据量处理"
benchmark_test "中等规模测试" 200 "测试中等数据量处理"
benchmark_test "中等规模测试" 500 "测试中等数据量处理"

# 大规模测试
benchmark_test "大规模测试" 1000 "测试大数据量处理能力"
benchmark_test "大规模测试" 2000 "测试系统扩展性"

# 极限测试（可选）
echo "⚠️  准备进行极限测试，这可能需要较长时间..."
read -p "是否继续极限测试？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    benchmark_test "极限测试" 5000 "测试系统极限处理能力"
    benchmark_test "极限测试" 10000 "测试系统最大承载能力"
fi

# 生成性能报告
echo "📈 生成性能报告..."

REPORT_FILE="$RESULTS_DIR/performance_report_$TIMESTAMP.md"

cat > "$REPORT_FILE" << EOF
# 日志分析系统性能基准测试报告

**测试时间**: $(date)
**测试环境**: $(uname -a)

## 测试概述

本次测试评估了日志分析系统在不同数据量下的性能表现，包括：
- 响应时间分析
- 各组件处理时间
- 系统扩展性评估
- 资源使用效率

## 测试结果汇总

$(awk -F',' 'NR>1 && $2!="FAILED" {
    total_time += $2; 
    network_time += $3; 
    llm_time += $4; 
    anomaly_time += $5; 
    behavior_time += $6; 
    count++
} 
END {
    if(count > 0) {
        printf "- **测试用例总数**: %d\n", count
        printf "- **平均总响应时间**: %.3f 秒\n", total_time/count
        printf "- **平均网络耗时**: %.3f 秒\n", network_time/count  
        printf "- **平均LLM处理时间**: %.1f 毫秒\n", llm_time/count
        printf "- **平均异常检测时间**: %.1f 毫秒\n", anomaly_time/count
        printf "- **平均行为分析时间**: %.1f 毫秒\n", behavior_time/count
    }
}' "$RESULTS_DIR/performance_metrics_$TIMESTAMP.csv")

## 详细数据

| 日志数量 | 总耗时(s) | 网络耗时(s) | LLM处理(ms) | 异常检测(ms) | 行为分析(ms) | 风险级别 | 每条日志耗时(ms) |
|---------|----------|------------|-------------|-------------|-------------|---------|----------------|
$(awk -F',' 'NR>1 {
    if($2 != "FAILED") {
        avg_per_log = $2 * 1000 / $1
        printf "| %d | %.3f | %.3f | %s | %s | %s | %s | %.2f |\n", $1, $2, $3, $4, $5, $6, $7, avg_per_log
    } else {
        printf "| %d | FAILED | %.3f | - | - | - | ERROR | - |\n", $1, $3
    }
}' "$RESULTS_DIR/performance_metrics_$TIMESTAMP.csv")

## 性能分析

### 响应时间趋势
- 系统在小规模数据(10-50条)下响应迅速
- 中等规模数据(100-500条)处理时间呈线性增长
- 大规模数据(1000+条)需要关注性能优化

### 组件性能
- **LLM处理**: 通常是主要耗时组件
- **异常检测**: 处理效率较高
- **行为分析**: 包含UI阻塞检测，处理时间适中

### 优化建议
1. **LLM优化**: 考虑批处理和并行处理
2. **缓存策略**: 实现智能缓存减少重复计算
3. **异步处理**: 对大数据量实现异步分析
4. **资源管理**: 优化内存使用和垃圾回收

## 原始数据

完整的测试数据保存在：
- CSV数据: \`performance_metrics_$TIMESTAMP.csv\`
- JSON结果: \`benchmark_*_logs_$TIMESTAMP.json\`

EOF

echo "📋 性能报告已生成: $REPORT_FILE"

# 生成简单的性能图表数据
echo "📊 生成图表数据..."
CHART_DATA="$RESULTS_DIR/chart_data_$TIMESTAMP.js"

cat > "$CHART_DATA" << EOF
// 性能测试图表数据
const performanceData = {
    labels: [$(awk -F',' 'NR>1 && $2!="FAILED" {printf "%s,", $1}' "$RESULTS_DIR/performance_metrics_$TIMESTAMP.csv" | sed 's/,$//')],
    datasets: [
        {
            label: '总响应时间(秒)',
            data: [$(awk -F',' 'NR>1 && $2!="FAILED" {printf "%.3f,", $2}' "$RESULTS_DIR/performance_metrics_$TIMESTAMP.csv" | sed 's/,$//')],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        },
        {
            label: 'LLM处理时间(秒)',
            data: [$(awk -F',' 'NR>1 && $2!="FAILED" {printf "%.3f,", $4/1000}' "$RESULTS_DIR/performance_metrics_$TIMESTAMP.csv" | sed 's/,$//')],
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1
        }
    ]
};

console.log('性能测试数据:', performanceData);
EOF

echo "📈 图表数据已生成: $CHART_DATA"

# 总结
echo ""
echo "🎯 性能基准测试完成"
echo "================================"
echo "📁 结果目录: $RESULTS_DIR"
echo "📊 CSV数据: performance_metrics_$TIMESTAMP.csv"
echo "📋 详细报告: $REPORT_FILE"
echo "📈 图表数据: $CHART_DATA"
echo ""
echo "🚀 测试套件执行完成！"

# 显示快速统计
echo "📈 快速统计:"
awk -F',' 'NR>1 && $2!="FAILED" {
    if(NR==2) {min_time=max_time=$2; min_logs=max_logs=$1}
    if($2<min_time) {min_time=$2; min_logs=$1}
    if($2>max_time) {max_time=$2; max_logs=$1}
    total_time+=$2; count++
}
END {
    if(count>0) {
        printf "   最快处理: %.3f秒 (%d条日志)\n", min_time, min_logs
        printf "   最慢处理: %.3f秒 (%d条日志)\n", max_time, max_logs  
        printf "   平均处理: %.3f秒\n", total_time/count
    }
}' "$RESULTS_DIR/performance_metrics_$TIMESTAMP.csv" 