@echo off
set "infile_=%1"
set "keypath_=%2"
set "value_=%3"

jj -v %value_% -i %infile_% %keypath_% -o 1.json
move %infile_% %infile_%.bak.json
move 1.json %infile_%