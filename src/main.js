import { createApp } from 'vue'
import App from './App.vue'

import router from "@/index";
import MainPage from "@/components/MainPage.vue";
import IHeader from "@/components/IHeader.vue";
import IGroupes from "@/components/IGroupes.vue";
import NoteBlock from "@/components/NoteBlock.vue";


const app = createApp(App);
app.use(router);
app.component('MainPage', MainPage);
app.component('IHeader', IHeader);
app.component('IGroupes', IGroupes);
app.component('NoteBlock', NoteBlock);



app.mount('#app');