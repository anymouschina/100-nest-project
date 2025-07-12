#!/bin/bash
# 设置HTTP/HTTPS代理到本机1087端口
export http_proxy=http://127.0.0.1:1087
export https_proxy=http://127.0.0.1:1087
export HTTP_PROXY=http://127.0.0.1:1087
export HTTPS_PROXY=http://127.0.0.1:1087

echo "HTTP代理已设置为: http://127.0.0.1:1087"
echo "HTTPS代理已设置为: http://127.0.0.1:1087"