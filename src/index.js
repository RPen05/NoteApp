import { createRouter, createWebHistory } from 'vue-router';
import MainPage from "@/components/MainPage.vue";

const routes = [
    {
        path: '/',
        name: 'Main',
        component: MainPage,
        props: true,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;