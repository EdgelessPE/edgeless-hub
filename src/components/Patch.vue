<template>

</template>

<script>
import DownloadManager from "@/components/DownloadManager";
import cpt from 'crypto';
import {notification} from "ant-design-vue";
import {log} from "@/interface/Repoter";
const fs=window.require('fs');
const md5 = require("nodejs-md5");

async function getMD5(filePath) {
  if(!DownloadManager.methods.exist(filePath)){
    console.log("File not exist:"+filePath)
    throw "file not exist"
  }
  return new Promise(resolve => {
    md5.file(filePath,(err,md)=>{
      if(err){
        console.log(JSON.stringify(err))
        throw "Can't get md5"
      }else{
        console.log(md)
        let res=md.split("= ")[1]
        resolve(res.toUpperCase())
      }
    })
  });
}

export default {
  name: "Patch",
  data(){
    return{
      patchList:[
        {
          name:"Ventoy wim插件补丁-下载缓存",
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
              got_md5 = await getMD5(local_ventoy_wim)
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
          check_needy:async function(_,u_path){
            let right_md5 = "97193526498DB3F1EB7103F2CDF128F1"
            const u_ventoy_wim=u_path + "/Burn/ventoy_wimboot.img"
            const u_good_tag=u_path + "/Burn/good_ventoy_wimboot"
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
              got_md5 = await getMD5(u_ventoy_wim)
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
            this.$warning({
              title: 'ventoy_wim插件有更新',
              content: '更新此组件可以解决UEFI启动时分辨率过低的问题',
              okText:'点击查看',
              cancelText:'下次再说',
              onOk() {
                const { shell } = require('electron')
                shell.openExternal("https://wiki.edgeless.top/v2/faq/resolution.html")
              },
            });
            return true
          }
        }
      ]
    }
  },
  methods:{
    async check_need_patch() {
      let cache_dir = this.$store.state.downloadDir.replaceAll("\\","/")
      let u_disk = this.$store.state.pluginPath[0] + ":"
      for (const item of this.patchList) {
        console.log('Process ' + item.name)
        let needy
        try{
          needy = await item.check_needy(cache_dir, u_disk)
        }catch (err){
          notification.open({
            message:'补丁检查出错：'+item.name,
            description:JSON.stringify(err)
          })
          continue
        }
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
            continue
          }
          if(!res){
            notification.open({
              message:'补丁应用失败：'+item.name,
              description:'请联系作者解决此问题'
            })
            log("补丁 "+item.name+" 应用失败")
          }else{
            notification.open({
              message:'补丁应用成功',
              description:item.name
            })
            log("补丁 "+item.name+" 应用成功")
          }
        }else{
          console.log('no needy')
        }
        console.log('Finish '+item.name)
      }
    }
  },
  created() {
    //初始化DownloadManager
    DownloadManager.methods.init(this.$axios,this.$store,this.$root)
    
    //检查是否需要打补丁
    this.check_need_patch()
  }
}
</script>