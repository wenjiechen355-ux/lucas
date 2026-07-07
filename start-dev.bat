@echo off
REM ============================================
REM 澳门童军执委会管理系统 - 本地开发启动脚本
REM ============================================

echo.
echo === 澳门童军执委会管理系统 ===
echo.

REM 检查 .env.local
if not exist .env.local (
    echo [警告] .env.local 不存在！
    echo 请复制 .env.example 为 .env.local 并填入 Supabase 配置
    echo.
    copy .env.example .env.local
    echo 已创建 .env.local，请编辑填入配置后再运行
    pause
    exit /b 1
)

REM 安装依赖（如需要）
if not exist node_modules (
    echo [安装依赖中...]
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] npm install 失败
        pause
        exit /b 1
    )
)

echo [启动开发服务器...]
echo 打开浏览器访问 http://localhost:3000
echo.
call npm run dev

pause
