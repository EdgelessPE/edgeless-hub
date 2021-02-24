@echo off
title Edgeless Hub 热更新程序
color 3f

::校验运行目录正确性
if not exist edgeless-hub.exe (
    echo 错误：更新程序不应在此目录运行
    echo %~dp0
    pause
    exit
)

::延时2s杀死进程
echo 正在等待主进程结束...
@ping 127.0.0.1 -n 2 >nul
TASKKILL /F /IM edgeless-hub.exe /T

::覆盖复制文件
xcopy /s /r /y .\core\Update\source\* .\

::退出
echo Edgeless Hub 更新完成，程序将在3s后退出
@ping 127.0.0.1 -n 3 >nul
del /f /q "%0"