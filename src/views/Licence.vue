<template>
  <a-list bordered :data-source="list">
    <a-list-item slot="renderItem" slot-scope="item, index">
      <a v-on:click="open(item.link)">{{ item.name }}</a>
    </a-list-item>
    <div slot="header">
      开放源代码许可
    </div>
  </a-list>
</template>

<script>
const { shell } = window.require('electron')
export default {
  name: "Licence",
  data(){
    return{
      list:[
        {
          name:"Node.js",
          link:"https://github.com/nodejs/node/blob/master/LICENSE"
        },
        {
          name:"Chromium",
          link:"https://github.com/chromium/chromium/blob/master/LICENSE"
        },
        {
          name:"Electron",
          link:"https://github.com/electron/electron/blob/main/LICENSE"
        },
        {
          name:"Vue.js",
          link:"https://github.com/vuejs/vue/blob/dev/LICENSE"
        },
        {
          name:"Ant Design Vue",
          link:"https://github.com/vueComponent/ant-design-vue/blob/next/LICENSE"
        },
      ]
    }
  },
  methods:{
    open(url){
      shell.openExternal(url)
    }
  }
}
</script>