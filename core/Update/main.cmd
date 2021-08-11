@echo off
title Edgeless Hub Hot Update
color 3f

if not exist edgeless-hub.exe (
    echo Error working directory
    echo %~dp0
    pause
    exit
)

echo Waiting for main program...
@ping 127.0.0.1 -n 2 >nul
TASKKILL /F /IM edgeless-hub.exe /T >nul

xcopy /s /r /y .\core\Update\source\* .\

echo Edgeless Hub updated successfully
@ping 127.0.0.1 -n 3 >nul
del /f /q main.cmd
del /f /q "%0"