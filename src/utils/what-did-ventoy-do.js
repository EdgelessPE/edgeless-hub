"use strict";
exports.__esModule = true;
var log = "";
var operation_log = [];
//match util
var regexTable = {
    Ventoy2Disk_Version: {
        exp: /Ventoy2Disk \d(.+)/,
        handler: function (r) {
            return r[0].match(/\d+.\d+(.\d+)*/)[0];
        }
    },
    Win_line: {
        exp: /Windows Version : [^\n]*/,
        handler: function (r) {
            return r[0];
        }
    },
    Drive_lines: {
        exp: /LogicalDrive:\\\\.\\[^\n]*/g
    },
    Installed_string: {
        exp: /Logical drive letter after write ventoy: <[A-Z]*/g,
        handler: function (r) {
            if (r) {
                //取最后一条结果
                return r[r.length - 1].split("<")[1];
            }
            else {
                return "";
            }
        }
    }
};
function match(key) {
    if (!regexTable.hasOwnProperty(key)) {
        throw "QUERY_REGEX_TABLE_ERROR:" + key;
    }
    var mn = regexTable[key];
    var r = log.match(mn.exp);
    if (mn.handler) {
        return mn.handler(r);
    }
    else {
        return r;
    }
}
//finder
function findVentoyExisted() {
    //查找存在语句
    var exist_lines = log.match(/PhyDrive \d+ is Ventoy Disk[^\n\r]*/g);
    var found = {};
    if (exist_lines) {
        //分析语句
        for (var i = 0; i < exist_lines.length; i++) {
            var line = exist_lines[i];
            var index = line.match(/PhyDrive \d+/)[0].split(" ")[1];
            found[index] = {
                installed: true,
                updated: false,
                version: line.match(/ver:\d+.\d+(.\d+)*/)[0].split(":")[1],
                secureBoot: line.match(/SecureBoot:\d/)[0].split(":")[1] != "0"
            };
        }
    }
    return found;
}
function findVentoyInstalledOrUpdated(install) {
    //计算token
    var token = install ? "InstallVentoy2PhyDrive" : "UpdateVentoy2PhyDrive";
    //查找安装语句
    var r_str = "/" + token + "[^\\n\\r]*/g";
    var installTargetLines = log.match(eval(r_str));
    if (installTargetLines == null)
        return {};
    //安装语句分段
    var installBlocks = log.split(token).splice(1);
    if (installBlocks.length !== installTargetLines.length)
        throw "ParseVentoyInstalled_FAILED-" + installBlocks.length + ":" + installTargetLines.length;
    //收集安装目标信息
    var found = {};
    for (var i = 0; i < installTargetLines.length; i++) {
        //获取当前行
        var line = installTargetLines[i];
        //匹配index
        var index = line.match(/PhyDrive\d+/)[0].split("PhyDrive")[1];
        //获取当前安装信息对应的块
        var block = installBlocks[i];
        //匹配安全启动
        var secureBoot_match = block.match(/VentoyProcSecureBoot \d/);
        if (secureBoot_match)
            secureBoot_match = secureBoot_match[0];
        else
            secureBoot_match = "0";
        var secureBoot = secureBoot_match[secureBoot_match.length - 1] != "0";
        //匹配是否成功
        var success_match = block.match(/]\s*OK[\n\r]/);
        var success = false;
        if (success_match)
            success = true;
        //推入found
        found[index] = {
            installed: success || !install,
            updated: !install && success,
            secureBoot: secureBoot,
            version: "Unknown",
            success: success
        };
        //记录到ventoy操作日志
        operation_log.push({
            success: success,
            upgrade: !install,
            secureBoot: secureBoot,
            targetDrive: Number(index)
        });
    }
    return found;
}
function findLetterRemoved() {
    var result = [];
    //匹配语句
    var lines = log.match(/[A-Z]:\\ is ventoy part2, delete mountpoint/);
    if (lines) {
        for (var i = 0; i < lines.length; i++) {
            var letter = lines[i][0];
            //检查挂载点是否被Part1复用
            var check = log.match("SetVolumeMountPoint <" + letter);
            if (!check) {
                //推入结果数组
                result.push();
            }
        }
    }
    return result;
}
function findLetterWithVentoyInstalled() {
    var finalLetter = "";
    //匹配所有Logical drive letter after write ventoy: <>，读取最后一条的<>内容
    var letters = match("Installed_string");
    //处理空串情况
    if (letters.length == 0) {
        //查询Ventoy2Disk为其挂载的位置
        var m = log.match(/SetVolumeMountPoint <[A-Z]/);
        if (m) {
            var line = m[m.length - 1];
            finalLetter = line[line.length - 1];
        }
        else {
            return "";
        }
    }
    else {
        //检查被确认的盘符
        var matchLines = log.match(/[A-Z]:\\ is ventoy part1, already mounted/);
        var targetLetter = void 0;
        if (matchLines == null) {
            //此时挂载上了Part2，Ventoy会为Part1执行挂载
            //SetVolumeMountPoint <E:\>
            matchLines = log.match(/SetVolumeMountPoint <[A-Z]/);
            //使用被挂载的盘符
            var line = matchLines[matchLines.length - 1];
            targetLetter = line[line.length - 1];
        }
        else {
            //Part1即正确
            targetLetter = matchLines[matchLines.length - 1][0];
        }
        if (letters.includes(targetLetter)) {
            finalLetter = targetLetter;
        }
        else {
            return "";
        }
    }
    return finalLetter;
}
//parser
function parseWinInfo(line) {
    return {
        version: line.split(":")[1].match(/Windows\s*[\S]*/)[0],
        bits: line.match(/\d+-bit/)[0].split("-")[0],
        build: line.match(/Build \d*/)[0].split(" ")[1]
    };
}
function parseDrivesInfo(lines) {
    var hash = {};
    //定义解析函数
    var soloParser = function (line) {
        var letter_match = line.match(/LogicalDrive:\\\\.\\[A-Z]/)[0];
        return {
            letter: letter_match[letter_match.length - 1],
            index: Number(line.match(/PhyDrive:-*\d+/)[0].split(":")[1]),
            capacity: Number(line.match(/ExtentLength:\d+/)[0].split(":")[1])
        };
    };
    var matchDriveDetailLine = function (index) {
        var regex_str = "/PhyDrv:" + index + " BusType:[^\\n\\r]*/";
        var regex = eval(regex_str);
        var result = log.match(regex);
        if (result) {
            return result[0];
        }
        else {
            return null;
        }
    };
    //获取Ventoy安装状态
    var ventoyExisted = findVentoyExisted();
    var ventoyInstalled = findVentoyInstalledOrUpdated(true);
    var ventoyUpdated = findVentoyInstalledOrUpdated(false);
    //lines倒序，保证信息都是最新的
    lines = lines.reverse();
    //使用hash表忽略已被移除的盘符
    var removedLetters = findLetterRemoved();
    removedLetters.forEach(function (item) {
        hash[item] = true;
    });
    //综合信息
    var result = [];
    var installedLetter = findLetterWithVentoyInstalled();
    for (var i = 0; i < lines.length; i++) {
        //获取Naive描述
        var n = soloParser(lines[i]);
        var index = n.index.toString();
        //根据盘符去重
        if (hash.hasOwnProperty(n.letter)) {
            continue;
        }
        else {
            hash[n.letter] = true;
        }
        //获取Ventoy信息
        var ventoyInfo = {
            installed: false,
            updated: false,
            version: "0.0.0",
            secureBoot: false
        };
        if (ventoyExisted.hasOwnProperty(index)) {
            ventoyInfo = ventoyExisted[index];
        }
        if (ventoyInstalled.hasOwnProperty(index)) {
            ventoyInfo = ventoyInstalled[index];
        }
        if (ventoyUpdated.hasOwnProperty(index) && ventoyUpdated[index].success) {
            ventoyInfo = ventoyUpdated[index];
        }
        //校验Ventoy写入的目标盘的VentoyStatus是否正确
        if (installedLetter == n.letter && !ventoyInfo.installed) {
            throw "VENTOY_TARGET_LETTER_CHANGED";
        }
        //匹配可能存在的设备的描述行
        var rline = matchDriveDetailLine(Number(index));
        //填充信息
        if (rline) {
            //找到详细描述，匹配详细描述
            var name_match = rline.match(/Name:[^\n]+/)[0];
            var removable_match = rline.match(/Removable:[^\n]+/)[0];
            var busType_match = rline.match(/BusType:[^\s]+/)[0];
            result.push({
                index: Number(index),
                letter: n.letter,
                capacity: n.capacity,
                removable: removable_match.includes("Removable:1"),
                flag: name_match.split(":")[1],
                ventoyStatus: ventoyInfo,
                busType: busType_match.split(":")[1]
            });
        }
        else {
            //填充缺省值
            result.push({
                index: Number(index),
                letter: n.letter,
                capacity: n.capacity,
                removable: false,
                flag: "LogicalDrive",
                ventoyStatus: ventoyInfo,
                busType: "Unknown"
            });
        }
    }
    return result;
}
export default function (input_log) {
    //使用最后一次分割作为全局log
    var spt = input_log.split(/################################ Ventoy2Disk/);
    log = "################################ Ventoy2Disk" + spt[spt.length - 1];
    //检查是否为Ventoy2Disk日志
    var v2dVer = match("Ventoy2Disk_Version");
    if (!v2dVer) {
        throw "INPUT_INVALID_LOG";
    }
    //匹配Windows信息
    var w_line = match("Win_line");
    var winInfo = parseWinInfo(w_line);
    //匹配磁盘驱动器信息
    var d_lines = match("Drive_lines");
    var driveInfo = parseDrivesInfo(d_lines);
    //组装信息
    var systemInfo = {
        drives: driveInfo,
        windows: winInfo
    };
    var ventoy2DiskInfo = {
        version: v2dVer
    };
    return {
        systemInfo: systemInfo,
        ventoy2DiskInfo: ventoy2DiskInfo,
        ventoyOperationLog: operation_log
    };
}