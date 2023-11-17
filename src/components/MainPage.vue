<script>
import IHeader from '@/components/IHeader.vue';
import IGroupes from '@/components/IGroupes.vue';
import NoteBlock from "@/components/NoteBlock.vue";

export default {
  components: {
    IHeader,
    IGroupes,
    NoteBlock,
  },
  data() {
    return {
      selectedFolderId: null,
      selectedFolderName: null,
    };
  },
 methods:{
   handleFolderSelected(selectedFolder) {
     if (selectedFolder) {
       this.selectedFolderId = selectedFolder.id;
       this.selectedFolderName = selectedFolder.name;
     }
   },
   toggleNoteForm() {
     this.$refs.noteBlock.toggleNoteForm();
   },
   saveNoteToLocalStorage(newNote) {
     const notesKey = `notes-${this.selectedFolderId}`;
     const notes = JSON.parse(localStorage.getItem(notesKey)) || [];
     notes.push(newNote);
     localStorage.setItem(notesKey, JSON.stringify(notes));
   },

 },
};
</script>
<template>
  <div>
    <router-view/>
    <div class="container-static">
      <div class="container-left">
        <IGroupes @folderSelected="handleFolderSelected"/>
      </div>
      <div class="container-right">
        <IHeader :selectedFolderName="selectedFolderName" @toggleNoteForm="toggleNoteForm"  />
        <NoteBlock :selectedFolderId="String(selectedFolderId)" :saveNoteToLocalStorage="saveNoteToLocalStorage" ref="noteBlock" />
      </div>
    </div>
  </div>


</template>

<style scoped>
.container-static{
  display: flex;
  justify-content: space-between;
}
.container-left{
  flex: 1;
}
.container-right{
  flex: 4;
}

</style>