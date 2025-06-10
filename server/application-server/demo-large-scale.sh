#!/bin/bash

# 大规模测试功能演示脚本
# ========================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🌐 大规模真实场景测试演示${NC}"
echo "=================================="
echo ""
echo "此演示将展示系统如何处理几千条真实业务日志："
echo "✨ 真实业务场景模拟"
echo "🔧 特征归一化验证"  
echo "💾 内存使用监控"
echo "📊 数据质量检查"
echo ""

# 检查依赖
echo "🔍 检查运行环境..."
for cmd in curl jq bc; do
    if ! command -v $cmd &> /dev/null; then
        echo -e "${RED}❌ 缺少依赖: $cmd${NC}"
        exit 1
    fi
done

# 检查服务状态
echo "🔌 检查服务连接..."
if curl -s "http://localhost:3000/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 服务连接正常${NC}"
else
    echo -e "${YELLOW}⚠️  服务可能未启动，但继续演示${NC}"
fi

echo ""

# 询问用户选择
echo "选择演示模式："
echo "1) 🚀 快速演示 (1000条日志, ~2分钟)"
echo "2) 🌟 标准演示 (2000条日志, ~5分钟)"
echo "3) 🔥 完整演示 (5000条日志, ~10分钟)"
echo "4) 🔍 仅数据质量验证"
echo "5) 📋 查看演示说明"

read -p "请选择 (1-5): " choice

case $choice in
    1)
        echo -e "${BLUE}🚀 快速演示模式${NC}"
        echo ""
        echo "正在生成1000条真实业务日志..."
        ./realistic-large-scale-test.sh <<< $'2000\nn\n'
        ;;
    2)
        echo -e "${BLUE}🌟 标准演示模式${NC}"
        echo ""
        echo "正在生成2000条真实业务日志..."
        ./realistic-large-scale-test.sh <<< $'y\nn\n'
        ;;
    3)
        echo -e "${BLUE}🔥 完整演示模式${NC}"
        echo ""
        echo "正在生成5000条真实业务日志..."
        ./realistic-large-scale-test.sh <<< $'y\ny\n'
        ;;
    4)
        echo -e "${BLUE}🔍 数据质量验证${NC}"
        echo ""
        echo "验证最新测试数据的质量..."
        ./data-quality-validator.sh
        ;;
    5)
        echo -e "${CYAN}📋 演示说明${NC}"
        echo "======================="
        echo ""
        echo "🎯 演示目标："
        echo "  • 验证系统处理大规模真实日志的能力"
        echo "  • 检查特征归一化和数据质量"
        echo "  • 监控内存使用，避免泄漏导致结果失真"
        echo "  • 展示真实业务场景的日志分析效果"
        echo ""
        echo "📊 测试数据特征："
        echo "  • 模拟真实的电商业务流程"
        echo "  • 包含登录、购物、支付、搜索等操作"
        echo "  • 70% INFO, 15% WARN, 10% ERROR, 5% CRITICAL"
        echo "  • 24小时时间分布，包含高峰期和低谷期"
        echo "  • 多用户、多会话、多服务的复杂场景"
        echo ""
        echo "🔍 验证重点："
        echo "  • 特征提取覆盖率是否达到100%"
        echo "  • 内存使用是否在合理范围内"
        echo "  • 业务逻辑一致性检查"
        echo "  • 异常检测准确性"
        echo "  • UI阻塞模式识别能力"
        echo ""
        echo "📁 输出文件："
        echo "  • large-scale-results/ - 所有测试结果"
        echo "  • 原始数据、分析结果、性能指标"
        echo "  • 内存监控日志、质量验证报告"
        echo ""
        read -p "按任意键返回主菜单..." -n 1
        echo ""
        exec "$0"
        ;;
    *)
        echo -e "${RED}❌ 无效选择${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 演示完成！${NC}"
echo ""
echo "📊 结果查看："
echo "  • 详细报告: large-scale-results/"
echo "  • 性能指标: large-scale-results/large_scale_metrics_*.csv"
echo "  • 质量报告: large-scale-results/large_scale_report_*.md"
echo ""
echo "🔍 建议接下来："
echo "  1. 查看生成的详细报告"
echo "  2. 运行数据质量验证: ./data-quality-validator.sh"
echo "  3. 比较不同规模下的性能表现"
echo ""
echo "💡 提示: 使用 ./run-all-tests.sh 可以运行完整的测试套件" 