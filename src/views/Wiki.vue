<template>
  <div>
    <webview id="webview" src="https://wiki.edgeless.top/v2"
             style="display:inline-flex; width:80vw; height:40vw"/>
  </div>
</template>

<script>
let earlierUrl = "", earlierTime = 0
const validDCTime = 3000
const {shell} = window.require('electron')
export default {
  name: "Wiki",
  data() {
    return {
      init: false,
      interval: ""
    }
  },
  methods: {},
  mounted() {
    let webview = document.getElementById("webview")
    //监听新窗口事件
    webview.addEventListener('new-window', (e) => {
      const date = new Date()
      if (e.url.slice(0, 4) === 'http') {
        if (e.url === earlierUrl && date.getTime() - earlierTime < validDCTime) {
          shell.openExternal(e.url)
          this.$message.success({content: '已打开外部链接', key: 'URL', duration: validDCTime / 1000})
          earlierTime = 0
        } else {
          this.$message.info({content: '双击以在外部浏览器中继续浏览', key: 'URL', duration: validDCTime / 1000})
          earlierUrl = e.url
          earlierTime = date.getTime()
        }
      }
    })
    //等待WebView就绪
    webview.addEventListener('did-stop-loading', () => {
      if (!this.init) {
        this.init = true
        if (window.location.href.split('?location=')[1]) {
          //处理其他页面的浏览请求
          let trueUrl = window.location.href.split('?location=')[1].replace(/%2F/g, "/").replace("%3A", ":")
          webview.loadURL(trueUrl)
        } else {
          //从store获取历史页面
          webview.loadURL(this.$store.state.wikiUrl)
          //配置定时器，周期性保存历史记录
          this.interval = setInterval(() => {
            this.$store.commit('saveWikiUrl', webview.getURL())
          }, 1000)
        }
      }
    })
    //回到顶部
    scrollTo(0, 0)
  },
  destroyed() {
    if (this.interval !== "") clearInterval(this.interval)
  }
}
</script>