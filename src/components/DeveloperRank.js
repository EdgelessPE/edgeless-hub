let devHash = {}
let finished = false

let titleList = [
    {
        title: "Edgeless官方人员",
        color: "red",
        list: ["Cno", "Copur", "Oxygen", "Brzh", "Fir"],
        link: "https://github.com/EdgelessPE"
    },
    {
        title: "Edgeless群管理员",
        color: "orange",
        list: ["Horatio Shaw", "LittleTurtle", "HHJLKK", "光卡", "可爱の萌新酱", "天霸动霸TUA", "Cpl.Kerry", "柠檬味小可爱"]
    },
    {
        title: "Edgeless群活跃群友",
        color: "blue",
        list: ["路人甲", "Ran", "as2o3", "Heven Kin", "WangJack", "漉鲸", "汪凯","undefined","Beluga"]
    }
]

//用于计数
function singleMention(author) {
    //判断是否有（bot）
    let writeBotAuthor = false
    if (author.indexOf("（bot）") !== -1) {
        writeBotAuthor = true
        author = author.split("（bot）")[0]
    }

    //执行+1
    if (devHash.hasOwnProperty(author)) {
        devHash[author].num++
    } else {
        devHash[author] = {
            num: 1,
            rank: 0,
            title: [],
            botAuthor: false
        }
    }

    //写botAuthor
    if (writeBotAuthor) devHash[author].botAuthor = true
}

//用于统计完毕后排序
function finish() {
    //将json对象收集为数组
    let arr = []
    for (const author in devHash) {
        let node = devHash[author]
        arr.push({
            author,
            num: node.num
        })
    }

    //排序
    arr.sort((a, b) => {
        return b.num - a.num
    })
    console.log(arr)

    //写排序结果

    for (let i = 0; i < arr.length; i++) {
        let node = arr[i]
        if (i === 0) devHash[node.author].rank = 1
        else {
            let prevNode = arr[i - 1]
            if (devHash[node.author].num === devHash[prevNode.author].num) {
                devHash[node.author].rank = devHash[prevNode.author].rank
            } else devHash[node.author].rank = i + 1
        }
    }

    //认证头衔
    auth()

    finished = true
}

//用于发放认证头衔，包括botAuthor
function auth() {
    //认证titleList
    titleList.forEach((titleNode) => {
        titleNode.list.forEach((author) => {
            if (devHash[author] !== undefined) {
                devHash[author].title.push({
                    text: titleNode.title,
                    color: titleNode.color,
                    link: titleNode.link,
                })
            }
        })
    })
    //认证botAuthor
    for (const author in devHash) {
        let node = devHash[author]
        if (node.botAuthor) devHash[author].title.push({
            text: "自动构建插件作者",
            color: "cyan",
            link: "https://wiki.edgeless.top/v2/develop/automake.html"
        })
    }
}

//用于查询
function singleQuery(author) {
    if (devHash.hasOwnProperty(author)) return devHash[author]
    else {
        console.warn("Unknown author:" + author)
        return {
            num: 0,
            rank: 0,
            title: []
        }
    }
}

function query(rawText) {
    if (finished) {
        let names = nameParser(rawText)
        return singleQuery(names[0])
    } else {
        return {
            num: 0,
            rank: 0,
            title: [],
            botAuthor: false
        }
    }
}

//用于清除
function clear() {
    devHash = {}
    finished = false
}

//处理多作者、多名情况（将首要人物放在第一个）
function nameParser(rawText) {
    let res = []
    switch (rawText) {
        case "光卡 and HHJLKK":
            res.push("HHJLKK")
            res.push("光卡")
            break
        case "传说当中的帅锅&汪凯":
            res.push("汪凯")
            break
        case "WHF":
            res.push("王洪峰")
            break
        default:
            res.push(rawText)
    }
    return res
}

function mention(rawText) {
    nameParser(rawText).forEach((name) => {
        singleMention(name)
    })
}

export default {
    mention,
    finish,
    query,
    clear
}
