@echo off
set "infile_=%1"
set "keypath_=%2"
set getValue_=
jj -i %infile_% %keypath_% >tmp
typex tmp>val
set /p getValue_=<val
del /f /q tmp
del /f /q val