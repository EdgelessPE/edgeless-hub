import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Cate from "@/views/Cate"
import Down from "../views/Down.vue"
import Search from "@/views/Search"
import Setting from "@/views/Setting";

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: ()=>import('@/views/Index')
  },
  {
    path:'/cate',
    name:'Cate',
    component: Cate
  },
  {
    path:'/down',
    name:'Down',
    component: Down
  },
  {
    path:'/search',
    name:'Search',
    component: Search
  },
  {
    path:'/setting',
    name:'Setting',
    component: Setting
  },
  {
    path:'/burning',
    name:'Burning',
    component: ()=>import("@/views/Burn")
  },
  {
    path:'/wiki',
    name:'Wiki',
    component: ()=>import("@/views/Wiki")
  },
  {
    path:'/test',
    name:'Test',
    component: ()=>import("@/views/Test")
  }
]

const router = new VueRouter({
  routes
})

export default router
