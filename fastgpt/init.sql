-- 初始化PostgreSQL，创建fastgpt数据库和扩展
CREATE DATABASE fastgpt;
\c fastgpt;
CREATE EXTENSION IF NOT EXISTS vector;