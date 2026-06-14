@echo off
chcp 65001 >nul
echo ==============================================
echo  学术研究智能体 - 完整安装向导
echo  语料库 + 数字人文 MCP 服务
echo ==============================================
echo.

echo [1/2] 安装前端依赖 (npm)...
call npm install

echo.
echo [2/2] 安装 MCP 服务器依赖 (Python)...
pip install -q mcp jieba gensim scikit-learn scipy nltk snownlp httpx aiohttp numpy pandas

echo.
echo ==============================================
echo  安装完成！使用以下命令启动：
echo.
echo   前端开发:    npm run dev
echo   访问地址:    http://localhost:3000
echo.
echo   MCP 服务器已配置在 .cursor/mcp.json
echo   在 Cursor IDE 中 AI 助手可自动调用 MCP 工具
echo ==============================================
pause
