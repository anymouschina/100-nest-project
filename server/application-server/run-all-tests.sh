#!/bin/bash

# 日志分析系统 - 主测试启动脚本
# =====================================

clear
echo "🚀 日志分析系统测试套件"
echo "======================================"
echo "📅 当前时间: $(date)"
echo "📍 工作目录: $(pwd)"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 检查依赖
check_dependencies() {
    echo "🔍 检查系统依赖..."
    
    # 检查必需的命令
    local deps=("curl" "jq" "bc")
    local missing=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing+=("$dep")
        fi
    done
    
    if [ ${#missing[@]} -ne 0 ]; then
        echo -e "${RED}❌ 缺少以下依赖: ${missing[*]}${NC}"
        echo "请安装缺少的依赖后重新运行"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 所有依赖已就绪${NC}"
    echo ""
}

# 检查服务状态
check_service() {
    echo "🏥 检查服务状态..."
    
    local health_check=$(curl -s "http://localhost:3000/api/health" || echo "FAILED")
    
    if [[ "$health_check" == *"status"* ]]; then
        echo -e "${GREEN}✅ 服务运行正常${NC}"
        echo "   服务地址: http://localhost:3000"
    else
        echo -e "${YELLOW}⚠️  服务可能未启动或不可访问${NC}"
        echo "   请确保应用服务器正在运行在 http://localhost:3000"
        read -p "   继续测试吗？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    echo ""
}

# 显示菜单
show_menu() {
    echo -e "${CYAN}📋 测试选项菜单${NC}"
    echo "======================================"
    echo -e "${GREEN}1.${NC} 🧪 快速场景测试 (6个特定场景)"
    echo -e "${GREEN}2.${NC} 📊 综合测试套件 (9个完整测试用例)"
    echo -e "${GREEN}3.${NC} ⚡ 性能基准测试 (压力和性能评估)"
    echo -e "${GREEN}4.${NC} 🎯 UI阻塞专项测试 (重现之前的问题)"
    echo -e "${PURPLE}5.${NC} 🌐 真实场景大规模测试 (几千条日志)"
    echo -e "${PURPLE}6.${NC} 🔍 数据质量验证工具 (特征归一化检查)"
    echo -e "${GREEN}7.${NC} 🔄 运行所有测试 (完整测试流程)"
    echo -e "${YELLOW}8.${NC} 📋 查看测试结果"
    echo -e "${BLUE}9.${NC} 🧹 清理测试数据"
    echo -e "${RED}10.${NC} 🚪 退出"
    echo ""
}

# UI阻塞专项测试
ui_blocking_test() {
    echo -e "${PURPLE}🎯 UI阻塞专项测试${NC}"
    echo "================================"
    
    if [ -f "./test-ui-blocking-analysis.sh" ]; then
        echo "执行已有的UI阻塞测试..."
        ./test-ui-blocking-analysis.sh
    else
        echo "生成UI阻塞测试场景..."
        
        curl -X POST -H "Content-Type: application/json" \
            -d '{
                "logs": [
                    {"id": "ui-01", "timestamp": "2025-01-10T14:30:01.000Z", "level": "INFO", "source": "frontend", "service": "auth", "message": "用户点击登录按钮", "metadata": {"userId": "user-ui-test", "sessionId": "session-ui-test", "action": "login_attempt"}},
                    {"id": "ui-02", "timestamp": "2025-01-10T14:30:02.000Z", "level": "INFO", "source": "backend", "service": "auth", "message": "登录请求处理成功", "metadata": {"userId": "user-ui-test", "sessionId": "session-ui-test", "http_status": 200}},
                    {"id": "ui-03", "timestamp": "2025-01-10T14:30:03.000Z", "level": "INFO", "source": "frontend", "service": "auth", "message": "用户点击登录按钮", "metadata": {"userId": "user-ui-test", "sessionId": "session-ui-test", "action": "login_attempt"}},
                    {"id": "ui-04", "timestamp": "2025-01-10T14:30:04.000Z", "level": "INFO", "source": "backend", "service": "auth", "message": "登录请求处理成功", "metadata": {"userId": "user-ui-test", "sessionId": "session-ui-test", "http_status": 200}},
                    {"id": "ui-05", "timestamp": "2025-01-10T14:30:05.000Z", "level": "INFO", "source": "frontend", "service": "auth", "message": "用户点击登录按钮", "metadata": {"userId": "user-ui-test", "sessionId": "session-ui-test", "action": "login_attempt"}},
                    {"id": "ui-06", "timestamp": "2025-01-10T14:30:06.000Z", "level": "INFO", "source": "backend", "service": "auth", "message": "登录请求处理成功", "metadata": {"userId": "user-ui-test", "sessionId": "session-ui-test", "http_status": 200}},
                    {"id": "ui-07", "timestamp": "2025-01-10T14:30:07.000Z", "level": "INFO", "source": "frontend", "service": "auth", "message": "用户点击登录按钮", "metadata": {"userId": "user-ui-test", "sessionId": "session-ui-test", "action": "login_attempt"}},
                    {"id": "ui-08", "timestamp": "2025-01-10T14:30:08.000Z", "level": "INFO", "source": "backend", "service": "auth", "message": "登录请求处理成功", "metadata": {"userId": "user-ui-test", "sessionId": "session-ui-test", "http_status": 200}},
                    {"id": "ui-09", "timestamp": "2025-01-10T14:30:09.000Z", "level": "INFO", "source": "frontend", "service": "auth", "message": "用户点击登录按钮", "metadata": {"userId": "user-ui-test", "sessionId": "session-ui-test", "action": "login_attempt"}},
                    {"id": "ui-10", "timestamp": "2025-01-10T14:30:10.000Z", "level": "INFO", "source": "backend", "service": "auth", "message": "登录请求处理成功", "metadata": {"userId": "user-ui-test", "sessionId": "session-ui-test", "http_status": 200}}
                ]
            }' \
            "http://localhost:3000/api/agent-orchestrator/analyze/quick" | jq .
    fi
    
    echo ""
    read -p "按任意键继续..." -n 1
    echo ""
}

# 查看测试结果
view_results() {
    echo -e "${CYAN}📋 查看测试结果${NC}"
    echo "================================"
    
    echo "可用的结果目录:"
    ls -la | grep -E "(test-results|benchmark-results)" || echo "暂无测试结果"
    
    echo ""
    echo "最近的测试文件:"
    find . -name "*.json" -o -name "*.csv" -o -name "*.md" | grep -E "(test|benchmark)" | head -10 || echo "暂无测试文件"
    
    echo ""
    read -p "按任意键继续..." -n 1
    echo ""
}

# 清理测试数据
cleanup_data() {
    echo -e "${YELLOW}🧹 清理测试数据${NC}"
    echo "================================"
    
    echo "将要删除的目录和文件:"
    ls -la | grep -E "(test-results|benchmark-results)" || echo "暂无测试目录"
    find . -name "test_result*.json" -o -name "*test*.log" | head -5 || echo "暂无测试文件"
    
    echo ""
    read -p "确认删除所有测试数据吗？(y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf test-results benchmark-results
        rm -f test_result*.json test_result*.log
        echo -e "${GREEN}✅ 测试数据已清理${NC}"
    else
        echo "取消清理操作"
    fi
    
    echo ""
    read -p "按任意键继续..." -n 1
    echo ""
}

# 真实场景大规模测试
large_scale_test() {
    echo -e "${PURPLE}🌐 真实场景大规模测试${NC}"
    echo "================================"
    echo "此测试将生成几千条真实业务日志进行分析"
    echo "测试重点: 特征归一化、内存管理、大规模处理"
    echo ""
    
    read -p "开始大规模测试？(注意：可能需要5-10分钟) (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./realistic-large-scale-test.sh
    else
        echo "取消大规模测试"
    fi
    
    echo ""
    read -p "按任意键继续..." -n 1
    echo ""
}

# 数据质量验证
data_quality_validation() {
    echo -e "${PURPLE}🔍 数据质量验证工具${NC}"
    echo "================================"
    echo "此工具验证最新测试的数据质量和特征归一化"
    echo ""
    
    ./data-quality-validator.sh
    
    echo ""
    read -p "按任意键继续..." -n 1
    echo ""
}

# 运行所有测试
run_all_tests() {
    echo -e "${PURPLE}🔄 运行完整测试流程${NC}"
    echo "================================"
    
    echo "测试流程:"
    echo "1. 快速场景测试"
    echo "2. UI阻塞专项测试"
    echo "3. 性能基准测试"
    echo "4. 综合测试套件"
    echo "5. 真实场景大规模测试"
    echo "6. 数据质量验证"
    echo ""
    
    read -p "开始完整测试流程？(注意：可能需要15-30分钟) (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🚀 开始完整测试...${NC}"
        echo ""
        
        # 1. 快速场景测试
        echo -e "${GREEN}第1步: 快速场景测试${NC}"
        ./quick-scenario-tests.sh
        echo ""
        
        # 2. UI阻塞测试
        echo -e "${GREEN}第2步: UI阻塞专项测试${NC}"
        ui_blocking_test
        
        # 3. 性能测试
        echo -e "${GREEN}第3步: 性能基准测试${NC}"
        echo "n" | ./performance-benchmark.sh  # 自动回答不进行极限测试
        echo ""
        
        # 4. 综合测试
        echo -e "${GREEN}第4步: 综合测试套件${NC}"
        ./comprehensive-test-suite.sh
        echo ""
        
        # 5. 大规模测试
        echo -e "${GREEN}第5步: 真实场景大规模测试${NC}"
        echo "y" | ./realistic-large-scale-test.sh  # 自动回答进行测试
        echo ""
        
        # 6. 数据质量验证
        echo -e "${GREEN}第6步: 数据质量验证${NC}"
        ./data-quality-validator.sh
        echo ""
        
        echo -e "${GREEN}🎉 完整测试流程完成！${NC}"
        echo ""
        
        # 生成总结报告
        echo "📊 生成总结报告..."
        SUMMARY_FILE="test_summary_$(date +"%Y%m%d_%H%M%S").md"
        
        cat > "$SUMMARY_FILE" << EOF
# 日志分析系统完整测试总结

**测试时间**: $(date)
**测试类型**: 完整测试流程

## 测试覆盖

- ✅ 快速场景测试 (6个场景)
- ✅ UI阻塞专项测试
- ✅ 性能基准测试
- ✅ 综合测试套件 (9个用例)
- ✅ 真实场景大规模测试 (几千条日志)
- ✅ 数据质量验证 (特征归一化检查)

## 结果位置

- 测试结果: \`test-results/\`
- 性能数据: \`benchmark-results/\`
- 大规模测试: \`large-scale-results/\`
- 详细日志: 各测试脚本输出

## 重点发现

1. **系统稳定性**: 大规模处理能力验证
2. **特征质量**: 归一化和提取准确性确认
3. **性能表现**: 各种负载下的响应情况
4. **UI阻塞检测**: 特定问题的识别能力
5. **内存管理**: 长时间运行的资源控制

## 建议

1. 查看具体的测试结果文件了解详情
2. 关注性能测试中的瓶颈
3. 验证UI阻塞检测的准确性
4. 检查大规模测试的内存使用情况
5. 根据失败的测试用例优化系统

EOF
        
        echo -e "📋 总结报告已生成: ${GREEN}$SUMMARY_FILE${NC}"
    else
        echo "取消完整测试"
    fi
    
    echo ""
    read -p "按任意键继续..." -n 1
    echo ""
}

# 主循环
main() {
    check_dependencies
    check_service
    
    while true; do
        clear
        echo -e "${CYAN}🚀 日志分析系统测试套件${NC}"
        echo "======================================"
        show_menu
        
        read -p "请选择操作 (1-10): " choice
        echo ""
        
        case $choice in
            1)
                echo -e "${GREEN}🧪 执行快速场景测试...${NC}"
                ./quick-scenario-tests.sh
                read -p "按任意键继续..." -n 1
                ;;
            2)
                echo -e "${GREEN}📊 执行综合测试套件...${NC}"
                ./comprehensive-test-suite.sh
                read -p "按任意键继续..." -n 1
                ;;
            3)
                echo -e "${GREEN}⚡ 执行性能基准测试...${NC}"
                ./performance-benchmark.sh
                read -p "按任意键继续..." -n 1
                ;;
            4)
                ui_blocking_test
                ;;
            5)
                large_scale_test
                ;;
            6)
                data_quality_validation
                ;;
            7)
                run_all_tests
                ;;
            8)
                view_results
                ;;
            9)
                cleanup_data
                ;;
            10)
                echo -e "${GREEN}👋 再见！${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ 无效选择，请重新输入${NC}"
                sleep 2
                ;;
        esac
    done
}

# 运行主程序
main 