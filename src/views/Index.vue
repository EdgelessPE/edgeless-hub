<template>
<div>
  <a-page-header
      title="Cno，下午好"
      :backIcon="false"
  >
  </a-page-header>
<a-row style="width: 100%">
  <a-col :span="16">
    <a-result title="Edgeless Alpha内测计划用户">
      <template slot="subTitle">
        <a-tag color="red">
          Alpha
        </a-tag>
        <a-tag color="blue">
          3.1.0
        </a-tag>
      </template>
      <template #icon>
        <a-icon type="smile" theme="twoTone" />
      </template>
      <template #extra>
        <a-button>
          检查Alpha更新
        </a-button>
      </template>
    </a-result>
  </a-col>
  <a-col :span="8">
    <a-card title="有3个插件可更新" :bordered="false" style="width: 300px">
      <template slot="extra">
        <a-button type="primary">更新</a-button>
      </template>
        <p>随便看看</p>
        <a-list>
          <a-button slot="loadMore" type="link" icon="reload" @click="openQQLink">
            换一批
          </a-button>
          <a-list-item>
            <a-list-item-meta
                title="PotPlayer"
                description="影音播放"
            >
            </a-list-item-meta>
            <template slot="extra">
              <a-button>安装</a-button>
            </template>
          </a-list-item>
          <a-list-item>
            <a-list-item-meta
                title="360急救箱"
                description="安全急救"
            >
            </a-list-item-meta>
            <template slot="extra">
              <a-button>安装</a-button>
            </template>
          </a-list-item>
          <a-list-item>
            <a-list-item-meta
                title="Audition"
                description="办公编辑"
            >
            </a-list-item-meta>
            <template slot="extra">
              <a-button>安装</a-button>
            </template>
          </a-list-item>
        </a-list>
    </a-card>
  </a-col>
</a-row>
</div>
</template>

<script>
export default {
name: "Index",
  data(){
  return{

  }
  },
  methods:{
    openQQLink(){
      this.$electron.shell.openExternal('https://home.edgeless.top/jump/qqg.html')
    }
  }
}
</script>