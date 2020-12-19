import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Cate from "@/components/Cate"

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path:'/cate',
    name:'Cate',
    component: Cate
  }
]

const router = new VueRouter({
  routes
})

export default router
