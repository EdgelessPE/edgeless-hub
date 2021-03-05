<template>
  <div>
    <webview id="webview" src="https://wiki.edgeless.top/v2"
             style="display:inline-flex; width:80vw; height:40vw"/>
  </div>
</template>

<script>
export default {
  name: "Wiki",
  data() {
    return {
      init:false,
      interval:""
    }
  },
  methods: {

  },
  mounted() {
    //等待WebView就绪
    document.getElementById("webview").addEventListener('did-stop-loading', ()=>{
      if(!this.init){
        this.init=true
        if(window.location.href.split('?location=')[1]){
          //处理其他页面的浏览请求
          let trueUrl = window.location.href.split('?location=')[1].replace(/%2F/g, "/").replace("%3A", ":")
          document.getElementById("webview").loadURL(trueUrl)
        }else{
          //从store获取历史页面
          document.getElementById("webview").loadURL(this.$store.state.wikiUrl)
          //配置定时器，周期性保存历史记录
          this.interval=setInterval(()=>{
            this.$store.commit('saveWikiUrl',document.getElementById("webview").getURL())
          },1000)
        }
      }
    })
    //回到顶部
    scrollTo(0,0)
  },
  destroyed() {
    if(this.interval!=="") clearInterval(this.interval)
  }
}
</script>