#!/bin/bash
set -e

# 定义要创建的数据库列表
DATABASES="orderManagementSystem order_management wechat_analysis"

echo "开始创建数据库..."

# 为每个数据库创建和配置
for db in $DATABASES; do
    echo "创建数据库: $db"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        CREATE DATABASE "$db";
        GRANT ALL PRIVILEGES ON DATABASE "$db" TO $POSTGRES_USER;
EOSQL

    echo "为数据库 $db 启用 pgvector 扩展"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$db" <<-EOSQL
        CREATE EXTENSION IF NOT EXISTS vector;
        SELECT * FROM pg_extension WHERE extname = 'vector';
EOSQL
done

echo "所有数据库创建完成！"
echo "创建的数据库："
echo "- orderManagementSystem (订单管理系统)"
echo "- order_management (订单管理)"  
echo "- wechat_analysis (微信分析，带向量支持)" 