import Vue from 'vue'
import VueRouter from 'vue-router'
import Reco from '../views/Recommend.vue'
import Cate from "@/views/Cate"
import Down from "../views/Down.vue"
import Search from "@/views/Search"
import Setting from "@/views/Setting";

Vue.use(VueRouter)

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/Index')
    },
    {
        path: '/reco',
        name: 'Reco',
        component: Reco
    },
    {
        path: '/cate',
        name: 'Cate',
        component: Cate
    },
    {
        path: '/down',
        name: 'Down',
        component: Down
    },
    {
        path: '/search',
        name: 'Search',
        component: Search
    },
    {
        path: '/setting',
        name: 'Setting',
        component: Setting
    },
    {
        path: '/burning',
        name: 'Burning',
        component: () => import("@/views/Burn")
    },
    {
        path: '/wiki',
        name: 'Wiki',
        component: () => import("@/views/Wiki")
    },
    {
        path: '/test',
        name: 'Test',
        component: () => import("@/views/Test")
    },
    {
        path: '/alpha',
        name: 'Alpha',
        component: () => import("@/views/Alpha")
    },
    {
        path: '/update',
        name: 'Update',
        component: () => import("@/views/Update")
    },
    {
        path: '/config',
        name: 'Config',
        component: () => import("@/views/Config")
    },
    {
        path: '/details',
        name: 'Details',
        component: () => import("@/views/Details")
    },
    {
        path: '/licence',
        name: 'Licence',
        component: () => import("@/views/Licence")
    }
]

const router = new VueRouter({
    routes
})

export default router
