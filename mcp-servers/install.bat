@echo off
chcp 65001 >nul
echo ============================================
echo  学术研究智能体 - MCP 服务器安装
echo ============================================
echo.

echo [1/3] 安装 Python 依赖...
pip install -q mcp jieba gensim scikit-learn scipy nltk snownlp httpx aiohttp numpy pandas

echo.
echo [2/3] 验证安装...
python -c "import jieba, gensim, httpx, mcp; print('  ✓ Python 依赖安装成功')"

echo.
echo [3/3] 测试 MCP 服务器 API 连接...
python mcp-servers/test_connectivity.py

echo.
echo ============================================
echo  安装完成！
echo.
echo  MCP 服务器配置: .cursor/mcp.json
echo  启动前端: npm run dev
echo ============================================
pause
