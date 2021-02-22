::@echo off
color 3f

::读取版本号
call readJson.cmd ..\package.json version
set "version=%getValue_%"
title 发布Edgeless Hub %version%

::写入版本号
::call writeJson ..\package.json version 1.5.0