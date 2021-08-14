@echo off
set stage=Beta

::检查rclone是否能正常工作
rclone ls pineapple:/hdisk/edgeless/Socket/Hub >nul
if "%errorlevel%" neq "0" (
    echo Please install rclone then add pineapple
    pause
    exit
)

::读取版本号
call readJson ..\package.json version
set "version=%getValue_%"
title 发布Edgeless Hub %version%

::条件选择
echo 1.此版本只需最小更新（默认）
echo 2.需要连依赖更新
echo 3.需要全量更新
set /p choice=输入序号或直接回车：

if "%choice%"=="2" (
    call writeJson Workshop\update.json dependencies_requirement %version:~0,-2%
)
if "%choice%"=="3" (
    call writeJson Workshop\update.json dependencies_requirement %version:~0,-2%
    call writeJson Workshop\update.json wide_gaps.-1 %version:~0,-2%
)

::编译
title 发布Edgeless Hub %version%-编译（1/6）
cd ..
cmd /c "yarn electron:build"

::精简win-unpack目录
cd dist\win-unpacked
::del /f /s /q swiftshader
::rd swiftshader
del /f /q d3dcompiler_47.dll
del /f /q LICENSE.electron.txt
del /f /q LICENSES.chromium.html
del /f /q vk_swiftshader.dll
del /f /q vk_swiftshader_icd.json
del /f /q vulkan-1.dll
del /f /q locales\am.pak
del /f /q locales\ar.pak
del /f /q locales\bg.pak
del /f /q locales\bn.pak
del /f /q locales\ca.pak
del /f /q locales\cs.pak
del /f /q locales\da.pak
del /f /q locales\de.pak
del /f /q locales\el.pak
del /f /q locales\es-419.pak
del /f /q locales\es.pak
del /f /q locales\et.pak
del /f /q locales\fa.pak
del /f /q locales\fi.pak
del /f /q locales\fil.pak
del /f /q locales\fr.pak
del /f /q locales\gu.pak
del /f /q locales\he.pak
del /f /q locales\hi.pak
del /f /q locales\hr.pak
del /f /q locales\hu.pak
del /f /q locales\id.pak
del /f /q locales\it.pak
del /f /q locales\ja.pak
del /f /q locales\kn.pak
del /f /q locales\ko.pak
del /f /q locales\lt.pak
del /f /q locales\lv.pak
del /f /q locales\ml.pak
del /f /q locales\mr.pak
del /f /q locales\ms.pak
del /f /q locales\nb.pak
del /f /q locales\nl.pak
del /f /q locales\pl.pak
del /f /q locales\pt-BR.pak
del /f /q locales\pt-PT.pak
del /f /q locales\ro.pak
del /f /q locales\ru.pak
del /f /q locales\sk.pak
del /f /q locales\sl.pak
del /f /q locales\sr.pak
del /f /q locales\sv.pak
del /f /q locales\sw.pak
del /f /q locales\ta.pak
del /f /q locales\te.pak
del /f /q locales\th.pak
del /f /q locales\tr.pak
del /f /q locales\uk.pak
del /f /q locales\vi.pak
del /f /q locales\zh-TW.pak
del /f /q locales\en-GB.pak

::复制core文件夹
title 发布Edgeless Hub %version%-复制core文件夹（2/6）
cd ..
cd ..
xcopy /s /r /y core dist\win-unpacked\core\

::清理垃圾
cd dist
del /f /q *.exe
del /f /q *.blockmap

::重命名win-unpack
del /f /s /q "Edgeless Hub"
rd /s /q "Edgeless Hub"
ren win-unpacked "Edgeless Hub"

::生成三种压缩包
title 发布Edgeless Hub %version%-生成完整包（3/6）
"C:\Program Files\7-Zip\7z.exe" a -t7z -mx9 "Edgeless Hub_%stage%_%version:~0,-2%.7z" "Edgeless Hub"

cd "Edgeless Hub"
title 发布Edgeless Hub %version%-生成update包（4/6）
"C:\Program Files\7-Zip\7z.exe" a -t7z -mx9 "update.7z" "core" "resources"
title 发布Edgeless Hub %version%-生成miniupdate包（5/6）
"C:\Program Files\7-Zip\7z.exe" a -t7z -mx9 "miniupdate.7z" "resources\app.asar"
cd ..
cd ..
del /f /q release\Workshop\*.7z
md release\Workshop
move /y "dist\Edgeless Hub\update.7z" "release\Workshop\update.7z"
move /y "dist\Edgeless Hub\miniupdate.7z" "release\Workshop\miniupdate.7z"
move /y "dist\Edgeless Hub_%stage%_%version:~0,-2%.7z" "release\Workshop\Edgeless Hub_%stage%_%version:~0,-2%.7z"

::上传三个包和update.json
title 发布Edgeless Hub %version%-上传文件（6/6）
cd release\Workshop
rclone copy -P "Edgeless Hub_%stage%_%version:~0,-2%.7z" pineapple:/hdisk/edgeless/Socket/Hub
rclone copy -P "update.json" pineapple:/hdisk/edgeless/Socket/Hub/Update
rclone copy -P "update.7z" pineapple:/hdisk/edgeless/Socket/Hub/Update
rclone copy -P "miniupdate.7z" pineapple:/hdisk/edgeless/Socket/Hub/Update
exit