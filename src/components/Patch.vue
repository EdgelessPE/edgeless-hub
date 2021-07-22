<template>

</template>

<script>
import DownloadManager from "@/components/DownloadManager";
import {notification} from "ant-design-vue";
import {log} from "@/interface/Repoter";
const fs=window.require('fs');
const md5 = require("nodejs-md5");
const { shell } = window.require('electron')

let $warning,$store

let dataset={
    patchList:[
      {
        name:"Ventoy wim插件补丁-下载缓存",
        hook:"launch",
        check_needy:async function (cache_dir, _) {
          let right_md5 = "97193526498DB3F1EB7103F2CDF128F1"
          const local_ventoy_wim=cache_dir + "/Burn/ventoy_wimboot.img"
          const local_good_tag=cache_dir + "/Burn/good_ventoy_wimboot"
          //检查好人证
          if(DownloadManager.methods.exist(local_good_tag)) return false
          //排除初始状态
          if (!DownloadManager.methods.exist(local_ventoy_wim)) {
            DownloadManager.methods.mkdir(local_good_tag)
            return false
          }

          //检查缓存中的文件
          let got_md5
          try{
            got_md5 = await DownloadManager.methods.getMD5(local_ventoy_wim)
          }catch (e) {
            console.log(JSON.stringify(e))
            throw "Can't get md5"
          }
          if(got_md5===right_md5){
            //颁发好人证
            DownloadManager.methods.mkdir(local_good_tag)
            return false
          }else{
            return true
          }
        },

        patch:async function (cache_dir, _){
          const local_ventoy_wim=cache_dir + "/Burn/ventoy_wimboot.img"
          const local_good_tag=cache_dir + "/Burn/good_ventoy_wimboot"
          //删除文件
          if(DownloadManager.methods.del(local_ventoy_wim)){
            //颁发好人证
            DownloadManager.methods.mkdir(local_good_tag)
            return true
          }else{
            console.log('fail to delete')
            return false
          }
        }
      },
      {
        name:"Ventoy wim插件补丁-U盘",
        hook:"udisk",
        check_needy:async function(_,u_path){
          let right_md5 = "97193526498DB3F1EB7103F2CDF128F1"
          const u_ventoy_wim=u_path + "/ventoy/ventoy_wimboot.img"
          const u_good_tag=u_path + "/ventoy/good_ventoy_wimboot"
          //检查好人证
          if(DownloadManager.methods.exist(u_good_tag)) return false
          //排除初始状态
          if(!DownloadManager.methods.exist(u_ventoy_wim)){
            DownloadManager.methods.mkdir(u_good_tag)
            return false
          }
          //检查U盘中的文件
          let got_md5
          try{
            got_md5 = await DownloadManager.methods.getMD5(u_ventoy_wim)
          }catch (e) {
            console.log(JSON.stringify(e))
            throw "Can't get md5"
          }
          if(got_md5===right_md5){
            //颁发好人证
            DownloadManager.methods.mkdir(u_good_tag)
            return false
          }else{
            return true
          }
        },
        patch:async function(){
          //弹窗提示
          $warning({
            title: 'ventoy_wimboot插件有更新',
            content: '更新此组件可以解决UEFI启动时分辨率过低的问题',
            okText:'点击查看',
            cancelText:'下次再说',
            onOk() {
              shell.openExternal("https://wiki.edgeless.top/v2/faq/resolution.html")
            },
            maskClosable:true,
            closable:true
          });
          return true
        }
      }
    ],
    cronTab:{
      launch:[],
      udisk:[],
    }
}

function arrange() {
  for (let i=0;i<dataset.patchList.length;i++) {
    let item=dataset.patchList[i]
    if(dataset.cronTab.hasOwnProperty(item.hook)){
      dataset.cronTab[item.hook].push(i)
    }else{
      console.log("Invalid hook:"+item.hook)
    }
  }
}

async function runPatches(hook){
  for (const item of dataset.cronTab[hook]) {
    let res=await executor(item)
    let name=dataset.patchList[item].name
    if(res){
      log("Patched "+name)
    }else{
      log("Failed patching "+name)
    }
  }
}

async function executor(index){
  const cache_dir = $store.state.downloadDir.replaceAll("\\","/")
  const u_disk = $store.state.pluginPath[0] + ":"
  let item=dataset.patchList[index]
  return new Promise(async (resolve) => {
    //检查必要性
    console.log('Check needy ' + item.name)
    let needy=false
    try {
      needy = await item.check_needy(cache_dir, u_disk)
    } catch (err) {
      notification.open({
        message: '补丁检查出错：' + item.name,
        description: JSON.stringify(err)
      })
      resolve(false)
    }

    //执行补丁
    if(needy){
      console.log('Patching ' + item.name)
      let res
      try{
        res=await item.patch(cache_dir, u_disk)
      }catch (err){
        notification.open({
          message:'补丁应用出错：'+item.name,
          description:err.output.toString()
        })
        resolve(false)
      }
      if(!res){
        notification.open({
          message:'补丁应用失败：'+item.name,
          description:'请联系作者解决此问题'
        })
        log("补丁 "+item.name+" 应用失败")
        resolve(false)
      }else{
        notification.open({
          message:'补丁应用成功',
          description:item.name
        })
        log("补丁 "+item.name+" 应用成功")
        resolve(true)
      }
    }else{
      console.log('no needy,pass')
      resolve(true)
    }
  })

}

export default {
  name: "Patch",
  created() {
    //初始化自身
    $warning=this.$warning
    $store=this.$store

    //初始化DownloadManager
    DownloadManager.methods.init(this.$axios,this.$store,this.$root)
    
    //检查是否需要打补丁
    arrange()

    //执行启动时patch
    runPatches("launch")

    //启动时如果U盘就绪则执行U盘插入时patch
    if(fs.existsSync(this.$store.state.pluginPath)){
      runPatches("udisk")
    }

    //监听U盘插入事件，启动U盘插入时patch
    this.$root.eventHub.$on('disk-plugged',()=>{
      runPatches("udisk")
    })
  }
}
</script>