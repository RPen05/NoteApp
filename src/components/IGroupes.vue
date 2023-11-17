<script>
export default {
  data() {
    return {
      folders: [],
      selectedFolderId: null,
      selectedFolderName: null,
      showCreateFolderModal: false,
      showDeleteFolderModal: false,
      newFolderName: "",
      folderToDeleteId: null,
      showEditFolderModal: false,
      editedFolderId: null,
      editedFolderName: "",
    };
  },
  methods: {
    createFolder() {
      const newFolder = {
        id: Date.now(),
        name: this.newFolderName,
      };
      this.folders.push(newFolder);
      this.saveFoldersToLocalStorage();
      this.showCreateFolderModal = false;
      this.newFolderName = "";
    },
    deleteFolder(folderId) {
      this.folders = this.folders.filter((folder) => folder.id !== folderId);
      this.saveFoldersToLocalStorage();
      const notesKey = `notes-${folderId}`;
      localStorage.removeItem(notesKey);
      this.closeDeleteFolderModal();
      this.$emit('folderDeleted');
    },
    selectFolder(folderId) {
      this.selectedFolderId = folderId;
      const selectedFolder = this.folders.find(folder => folder.id === folderId);
      this.$emit('folderSelected', selectedFolder);

    },

    saveFoldersToLocalStorage() {
      localStorage.setItem("folders", JSON.stringify(this.folders));
    },
    loadFoldersFromLocalStorage() {
      const storedFolders = localStorage.getItem("folders");
      this.folders = storedFolders ? JSON.parse(storedFolders) : [];
    },
    openDeleteFolderModal(folderId) {
      this.folderToDeleteId = folderId;
      this.showDeleteFolderModal = true;
    },

    closeDeleteFolderModal() {
      this.folderToDeleteId = null;
      this.showDeleteFolderModal = false;
    },
    getFolderNameById(folderId) {
      const folder = this.folders.find(folder => folder.id === folderId);
      return folder ? folder.name : '';
    },
    confirmDeleteFolder() {
      this.deleteFolder(this.folderToDeleteId);
      this.showDeleteFolderModal = false;
    },
    openEditFolderModal(folderId, folderName) {
      this.showEditFolderModal = true;
      this.editedFolderId = folderId;
      this.editedFolderName = folderName || "";
    },
    editFolder() {
      const editedFolderIndex = this.folders.findIndex(folder => folder.id === this.editedFolderId);
      if (editedFolderIndex !== -1) {
        this.folders[editedFolderIndex].name = this.editedFolderName;
        this.saveFoldersToLocalStorage();
      }
      this.showEditFolderModal = false;
    },
    limitFolderName(inputName) {
      const input = inputName === 'newFolder' ? this.newFolderName : this.editedFolderName;
      if (input.length > 14) {
        if (inputName === 'newFolder') {
          this.newFolderName = input.slice(0, 14);
        } else {
          this.editedFolderName = input.slice(0, 14);
        }
      }
    },
  },
  created() {
    this.loadFoldersFromLocalStorage();
  },
};
</script>

<template>
  <div class="section-folders">
    <div class="folders-header">
      <div class="title">Папки</div>
      <button class="create-btn" @click="showCreateFolderModal = true">
        <img src="../assets/img/plus_black.png" alt="" class="create-img">
      </button>
    </div>

    <ul>
      <li v-for="folder in folders" :key="folder.id" :class="{ 'selected-folder': folder.id === selectedFolderId }">
        <div class="folder-content" @click="selectFolder(folder.id)">
          <img src="../assets/img/folder.png" alt="">
          {{folder.name}}
        </div>
        <button class="edit-folder" @click="openEditFolderModal(folder.id, folder.name)"><img class="img-edit" src="../assets/img/edit.png" alt=""></button>
        <button class="delete"  @click="openDeleteFolderModal(folder.id)"><img class="img-delete" src="../assets/img/trash.png" alt=""></button>
      </li>
    </ul>

    <!-- Модальное окно создания папки -->
    <div class="modal" v-if="showCreateFolderModal">
      <div class="modal-content">
        <h3>Создать новую папку</h3>
        <input v-model="newFolderName" placeholder="Введите название папки" class="create-folder-input" @input="() => limitFolderName('newFolder')">
        <button @click="createFolder">Создать</button>
        <button @click="showCreateFolderModal = false">Отмена</button>
      </div>
    </div>

    <!-- Модальное окно подтверждения удаления папки -->
    <div class="modal" v-if="showDeleteFolderModal">
      <div class="modal-content">
        <h3>Подтвердите удаление папки "{{ getFolderNameById(folderToDeleteId) }}"</h3>
        <button @click="confirmDeleteFolder">Удалить</button>
        <button @click="showDeleteFolderModal = false">Отмена</button>
      </div>
    </div>

    <!-- Модальное окно редактирования папки -->
    <div class="modal" v-if="showEditFolderModal">
      <div class="modal-content">
        <h3>Изменить название папки</h3>
        <input class="edit-folder-input" v-model="editedFolderName" placeholder="Новое название" @input="() => limitFolderName('editedFolder')">
        <button @click="editFolder">Сохранить</button>
        <button @click="showEditFolderModal = false">Отмена</button>
      </div>
    </div>
  </div>

</template>

<style scoped>
.selected-folder {
  background-color: #f0f0f0; /* Цвет фона для выделенной папки */
  border-radius: 4px;
  padding: 5px;
}
.section-folders{
  //border-top: 1px solid #cccccc;
  border-right: 1px solid #cccccc;
    //border-top-right-radius: 8px;
  width: 300px;
  height: 770px;
  position: relative;
}



.folders-header{
  height: 50px;
  width: auto;
  display: flex;
  justify-content: space-between;
  margin-left: 20px;
  margin-right: 20px;
  align-items: center;

  border-bottom: 1px solid #cccccc;
  border-right: 1px solid #cccccc;
  border-bottom-right-radius: 8px;
  //border-bottom-left-radius: 8px;
  padding-bottom: 10px;
  width: 280px;
}
.title{
  color: #1e1f22;
  font-size: 30px;
  font-weight: 500;
  font-family: 'Prompt', sans-serif;
}

.create-btn{
  background-color: transparent;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  margin-top: 10px;
}

.create-btn img{
  width: 25px;
  height: 25px;
}


li{
  display: flex;
  justify-content: space-between;
  list-style: none;

  margin-bottom: 20px;
  font-size: 18px;
  margin-right: 10px;
  align-items: center;
  position: relative;
}

.img-delete{
  display: none;
  position: absolute;
  right: 5px;
  bottom: 5px;
}

li:hover .img-delete{
  display: block;
}

li:hover .img-edit{
  display: block;
}

li img{
  width: 25px;
  height: 25px;
  margin-right: 10px;
}

li .delete, .edit-folder{
  background-color: transparent;
  border: none;
  cursor: pointer;
}


.edit-folder{

  width: 25px;
  height: 25px;

}

.img-edit{
  display: none;
  position: absolute;
  right: 40px;
  bottom: 5px;
}

.edit-folder .img-edit{
  width: 18px;
  height: 18px;

}

.delete .img-delete{
  width: 18px;
  height: 18px;
}
.folder-content{
  display: flex;
  align-items: center;
  cursor: pointer;

}

.modal-content{
  border: 1px solid #cccccc;
  border-radius: 8px;
  padding: 10px 15px 10px 15px;
  width: 250px;
  text-align: center;
position: relative;

}

.close img{
  width: 15px;
  height: 15px;
}


.modal-header label{
  position: absolute;
  top: 20px;
}

.modal-content button{
  margin-left: 10px;
  border: none;
  background-color: #1e1f22;
  border-radius: 8px;
  margin-top: 10px;
  padding: 5px 10px 5px 10px;
  cursor: pointer;
  color: #ffffff;

}

.modal-input input{
  border: none;
  border-bottom: 1px solid #cccccc;
}

.create-folder-input{
  border-radius: 8px;
  padding: 8px 8px 8px 8px;
}

.edit-folder-input{
  border-radius: 8px;
  padding: 8px 8px 8px 8px;
}

</style>