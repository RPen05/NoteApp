<script>
import cloneDeep from 'lodash/cloneDeep';
export default {
  data() {
    return {
      notes: [],
      newNoteContent: "",
      todoList: [],
      noteToDelete: null,
      editedNote: { title: "", todoList: [] },
      undoStack: [],
      redoStack: [],
      isInvertedRedo: false,
      editedNoteTitle: "",
      isTitleEdited: false,
      titleChangeBuffer: "",
      undoTitle: "",
      isOverlayVisible: false,

      //Валидация полей
      isTitleValid: true,
      isTodoValid: true,

      //Флаги для модальных окон
      showNoteForm: false,
      showDeleteNoteModal: false,
      showEditNoteForm: false,
    };
  },
  props: {
    selectedFolderId: {
      type: [String, Number],
      default: null,
    },
    saveNoteToLocalStorage: Function,
  },
  computed:{
    filteredNotes() {
      if (!this.selectedFolderId) return [];
      return this.notes.filter(note => note.folderId === this.selectedFolderId);
    },
  },
  watch: {
    selectedFolderId: 'loadNotesFromLocalStorage',
  },
  methods: {
    loadNotesFromLocalStorage() {
      const notesKey = `notes-${this.selectedFolderId}`;
      const notes = JSON.parse(localStorage.getItem(notesKey)) || [];
      this.notes = [...notes]; // создаем новый массив для обновления
    },

    removeNoteFromLocalStorage(note) {
      const notesKey = `notes-${note.folderId}`;
      const notes = JSON.parse(localStorage.getItem(notesKey)) || [];
      const index = notes.findIndex(n => n.id === note.id);

      if (index !== -1) {
        notes.splice(index, 1);
        localStorage.setItem(notesKey, JSON.stringify(notes));
      }
    },

    saveNote() {
      this.isTitleValid = this.newNoteContent.trim() !== "";
      this.isTodoValid = this.validateTodoList();
      if (this.isTitleValid && this.isTodoValid) {
        if (this.newNoteContent.trim() !== "") {
          const newNote = {
            id: Date.now(),
            folderId: this.selectedFolderId,
            title: this.newNoteContent,
            todoList: this.todoList,
          };
          this.notes.push(newNote);
          this.saveNoteToLocalStorage(newNote);
          this.toggleNoteForm();
          this.newNoteContent = "";
          this.todoList = [];
        }
      }
      this.isOverlayVisible = false;
    },

    deleteNote(note) {
      const index = this.notes.findIndex(n => n.id === note.id);
      if (index !== -1) {
        this.notes.splice(index, 1);
        this.removeNoteFromLocalStorage(note);
      }
    },

    editNote(note) {
      this.editedNote = { id: note.id, folderId: this.selectedFolderId, title: note.title, todoList: [...note.todoList] };
      this.showEditNoteForm = true;
      this.titleChangeBuffer = note.title;
      this.addToUndoStack({ type: "editNoteTitle", title: note.title });
      this.isOverlayVisible = true;
    },

    saveEditedNote() {
      const index = this.notes.findIndex(note => note.id === this.editedNote.id);
      this.notes.splice(index, 1, this.editedNote);
      const notesKey = `notes-${this.selectedFolderId}`;
      localStorage.setItem(notesKey, JSON.stringify(this.notes));
      this.showEditNoteForm = false;
      this.editedNote = { title: "", todoList: [] };
      this.isOverlayVisible = false;
    },

    editNoteTitle(newTitle) {
      if (newTitle !== this.editedNote.title) {
        this.addToUndoStack({ type: "editNoteTitle", title: this.editedNote.title });
      }
      this.editedNote.title = newTitle;
    },

    addTodoCreateForm() { //AddTodo для создания заметки
      const newTodo = { label: "", completed: false };
      this.todoList.push(newTodo);
    },

    addTodo() { //AddTodo для редактирования заметки
      const newTodo = { label: "", completed: false };
      const action = { type: "addTodo", todo: newTodo, index: this.editedNote.todoList.length };
      this.addToUndoStack(action);
      this.editedNote.todoList.push(newTodo);
    },

    addTodoWithText(todo, index) {
      this.editedNote.todoList.splice(index, 0, todo);
      this.addToUndoStack({ type: "removeTodo", todo, index });
    },

    removeTodoCreateForm(index) { //removeTodo при создании заметки
      this.todoList.splice(index, 1);
    },

    removeTodo(index) { //removeTodo при редактировании заметки
      const removedTodo = this.editedNote.todoList.splice(index, 1)[0];
      this.addToUndoStack({
        type: 'removeTodo',
        index,
        todo: removedTodo,
      });
      this.$forceUpdate();
      this.showDeleteTodoModal = false;
    },

    removeTodoWithText(todo, index) {
      const action = { type: "removeTodo", todo, index };
      this.addToUndoStack(action);
      this.editedNote.todoList.splice(index, 1);
    },

    handleTitleInput() {
      if (!this.isTitleEdited && this.editedNote.title !== this.titleChangeBuffer) {
        this.addToUndoStack({
          type: "editNoteTitleChange",
          title: this.titleChangeBuffer,
        });
        this.isTitleEdited = true;
      }
    },

    addToUndoStack(action) {
      const clonedAction = cloneDeep(action);
      this.undoStack.push(clonedAction);
      this.redoStack = [];
    },

    undo() {
      const lastState = this.undoStack.pop();
      if (lastState.type === "editNoteTitleChange") {
        this.editedNote.title = lastState.title;
        this.titleChangeBuffer = lastState.title;
        this.isTitleEdited = false;
      } else {
        this.applyAction(lastState, true);
      }
      this.redoStack.push(this.invertAction(lastState));
      this.undoStack = [];
    },

    invertAction(action) {
      switch (action.type) {
        case "addTodo":
          return { type: "removeTodo", todo: action.todo, index: action.index };
        case "removeTodo":
          return { type: "addTodo", todo: action.todo, index: action.index };
        default:
          return action;
      }
    },

    redo() {
      const nextState = this.redoStack.pop();
      this.undoStack.push(nextState);
      this.applyAction(nextState, true);
      this.redoStack = [];
    },

    applyAction(action, reverse = false) {
      if (reverse) {
        this.redoStack.pop();
        this.undoStack.push(action);
      }
      switch (action.type) {
        case "addTodo":
          reverse ? this.removeTodoWithText(action.todo, action.index) : this.addTodoWithText(action.todo, action.index);
          break;
        case "removeTodo":
          reverse ? this.addTodoWithText(action.todo, action.index) : this.removeTodoWithText(action.todo, action.index);
          break;
        case "editNoteTitle":
          reverse ? this.editNoteTitle(action.title) : this.editNoteTitle(action.title);
          break;
      }
    },

    // Валидация полей
    validateTodoList() {
      return this.todoList.every(todo => todo.label.trim() !== "");
    },
    resetValidation() {
      this.isTitleValid = true;
      this.isTodoValid = true;
    },
    truncateTitle(title, maxLength) {
      if (title.length > maxLength) {
        return title.substring(0, maxLength) + '...';
      }
      return title;
    },


    //Методы для модальных окон

    toggleNoteForm() {
      this.showNoteForm = !this.showNoteForm;
      this.newNoteContent = "";
      this.isOverlayVisible = true;
      this.resetValidation();
    },

    closeNoteForm() {
      this.showNoteForm = false;
      this.newNoteContent = "";
      this.todoList = [];
      this.isOverlayVisible = false;
    },

    openDeleteNoteModal(note) {
      this.showDeleteNoteModal = true;
      this.noteToDelete = note;
    },

    closeDeleteNoteModal() {
      this.showDeleteNoteModal = false;
      this.noteToDelete = null;
    },
    confirmDeleteNote() {
      this.deleteNote(this.noteToDelete);
      this.closeDeleteNoteModal();
    },

    cancelEditNote() {
      this.showEditNoteForm = false;
      this.isOverlayVisible = false;
      this.editedNote = { title: "", todoList: [] };
      this.undoStack = [];
      this.redoStack = [];
    },

    cancelDeleteTodo() {
      this.showDeleteTodoModal = false;
    },
  },
};
</script>
<template>
  <div class="note-container">
    <div class="note-block">
      <!-- Вывод заметок -->
      <div v-if="selectedFolderId" class="note-cards">
        <div v-for="note in filteredNotes" :key="note.id" class="note-card">
          <div class="note-header">
            <span class="note-title" :title="note.title">{{ truncateTitle(note.title, 20) }}</span>
            <div class="note-btns">
              <button class="edit-btn" @click="editNote(note)">
                <img class="edit-img" src="../assets/img/edit.png" alt="">
                <span class="edit-text">Редактировать</span>
              </button>
              <button @click="openDeleteNoteModal(note)" class="delete-btn"><img src="../assets/img/trash.png" alt=""></button>
            </div>
          </div>
          <span v-if="note.todoList.length > 0" class="todo-block-title">Ваши задачи: </span>
          <span v-else class="todo-block-title-alt">Вы можете добавить задачи для этой заметки в режиме редактирования</span>
          <ul v-if="note.todoList.length > 0" class="todo-list">
            <li v-for="(todo, index) in note.todoList.slice(0, 3)" :key="index" class="todo-item">
              <input type="checkbox" :checked="todo.completed" disabled class="todo-checkbox" @change="handleTodoCheckboxChange(index)">
              <span class="todo-label">{{ todo.label }}</span>
            </li>
            <div v-if="note.todoList.length > 3" class="more-todos">Еще {{ note.todoList.length - 3 }} задач(и)</div>
          </ul>
        </div>
      </div>

<!--      Форма создания заметки-->
      <form v-if="showNoteForm" @submit.prevent="saveNote" class="note-form">
        <h3 class="form-title">Создание заметки</h3>
        <input v-model="newNoteContent" placeholder="Введите заголовок заметки" class="form-input">
        <div v-if="!isTitleValid" class="validation-warning">Введите название заметки</div>

        <div v-if="todoList.length > 0" class="todo-list">
          <p>Ваши задачи: </p>
          <ul>
            <li v-for="(todo, index) in todoList" :key="index" class="todo-item">
              <input type="checkbox" v-model="todo.completed" class="todo-checkbox">
              <input v-model="todo.label" placeholder="Введите название" class="todo-label">
              <button @click="removeTodoCreateForm(index)" class="remove-todo-btn">Удалить</button>
            </li>
            <div v-if="!isTodoValid" class="validation-warning">Введите название для всех задач</div>
          </ul>
        </div>
        <button type="button" @click="addTodoCreateForm" class="add-todo-btn ">Создать задачу</button>
        <div class="todo-bottom">
          <button type="submit" class="save-note-btn">Сохранить</button>
          <button type="button" @click="closeNoteForm" class="close-form-btn ">Закрыть</button>
        </div>
      </form>


<!--      Модальное окно удаления заметки-->
      <div v-if="showDeleteNoteModal" class="modal">
        <div class="modal-content">
          <h3>Подтвердите удаление заметки </h3>
          <h3>"{{ noteToDelete.title.slice(0, 20) + (noteToDelete.title.length > 20 ? '...' : '') }}"</h3>
          <button @click="confirmDeleteNote">Удалить</button>
          <button @click="closeDeleteNoteModal">Отмена</button>
        </div>
      </div>


      <!-- Форма редактирования заметки -->
      <form v-if="showEditNoteForm" @submit.prevent="saveEditedNote" class="note-form">
        <h3 class="form-title">Редактирование заметки</h3>
        <label class="form-label" for="editNoteTitle">Заголовок заметки:</label>
        <input class="form-input" v-model="editedNote.title" type="text" id="editNoteTitle" required @input="handleTitleInput">

        <label>Задачи:</label>
        <ul class="todo-list">
          <li v-for="(todo, index) in editedNote.todoList" :key="index" class="todo-item">
            <input v-model="todo.completed" type="checkbox" class="todo-checkbox">
            <input v-model="todo.label" type="text" placeholder="Введите задачу" required class="todo-label">
            <button class="delete-btn" type="button" @click="removeTodo(index)"><img src="../assets/img/trash.png" alt=""></button>

          </li>
        </ul>
        <button type="button" @click="addTodo" class="add-todo-btn ">Добавить задачу</button>

        <div class="todo-bottom">
          <button type="submit" class="save-note-btn" @click="saveEditedNote">Сохранить</button>
          <button type="button" @click="cancelEditNote" class="close-form-btn">Отмена</button>
          <button class="undo-btn" type="button" @click="undo"><img src="../assets/img/undo.png" alt=""></button>
          <button class="redo-btn" type="button" @click="redo"><img src="../assets/img/redo.png" alt=""></button>
        </div>

      </form>
      <div v-if="isOverlayVisible" class="overlay"></div>
    </div>

  </div>
</template>

<style scoped>

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7); /* Здесь можно настроить прозрачность и цвет */
  z-index: 1;
}

.note-container{
  height: calc(100vh - 150px); /* 150px - высота IHeader и IGroupes */
  overflow-y: auto; /* Добавим вертикальный скролл при необходимости */
}


.note-container::-webkit-scrollbar {
  width: 10px; /* Ширина скроллбара */
}

.note-container::-webkit-scrollbar-thumb {
  background-color: #ccc; /* Цвет ползунка */
  border-radius: 5px; /* Скругленные углы ползунка */
}

.note-container::-webkit-scrollbar-track {
  background-color: #f1f1f1; /* Цвет фона скроллбара */
}

.note-block{
  margin-top: 50px;
  margin-left: 50px;
  margin-right: 50px;


}

.note-cards{
  display: flex;
  flex-wrap: wrap;
}

.note-card{
  border: 1px solid #ccc;
  margin-bottom: 100px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  width: calc(33.33% - 20px); /* Ширина карточки - 20px отступы */
  margin-right: 20px; /* Отступ между карточками */
  box-sizing: border-box; /* Учитываем padding и border в расчетах ширины */
  border-radius: 8px;
  box-shadow: 1px 2px rgba(0, 0, 0, 0.1);
  -webkit-transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
  transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.note-card::after{
  content: "";
  border-radius: 8px;
  position: absolute;
  z-index: -1;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  opacity: 0;
  -webkit-transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
  transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.note-card:hover{
  transform: scale(1.05, 1.05);
}

.note-card:hover::after{
  opacity: 1;
}

.note-card:hover .note-btns{
  opacity: 1;
  transition: opacity 0.2s ease-in-out;
}

.note-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 30px;
  margin-left: 15px;
}

.todo-list {
  width: 100%; /* Растягиваем todo list на всю ширину карточки */
  margin-left: 20px;
}

/* Последняя карточка в ряду не должна иметь отступ справа */
.note-card:nth-child(3n) {
  margin-right: 0;
}

.todo-block-title{
  margin-bottom: 20px;
  margin-left: 15px;
}

.todo-block-title-alt{
  font-size: 12px;
  color: #cccccc;
  text-align: center;
  line-height: 1.8;
  margin-top: 15px;

}

.todo-list {
  width: 100%;
  margin-top: 10px; /* Добавим отступ сверху для разделения от заголовка */
  margin-right: 60px;
}

.todo-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.todo-checkbox {
  margin-right: 8px;
}

.todo-label {
  flex-grow: 1;
  word-wrap: break-word; /* Разрыв слов по нужным местам */
  margin-left: 15px;
  border-radius: 8px;
  margin-right: 10px;
}



.form-title{
  margin-bottom: 20px;
  font-size: 20px;
  font-family: 'Prompt', sans-serif;
  position: relative;
}

.note-header{
  margin-bottom: 15px;
  display: flex;

}

.note-btns{
  position: absolute;
  display: flex;
  right: 5%;
  opacity: 0;
}

.edit-btn img, .delete-btn img{
  width: 15px;
  height: 15px;
}

.edit-btn{
  background-color: #1e1f22;
  color: #fff;
  border: none;

  cursor: pointer;
  position: relative;
  overflow: hidden;
  font-size: 10px;
  width: 15px;
  height: 25px;
  border-radius: 10px;
  display: flex; /* Добавлено */
  align-items: center; /* Добавлено */
  transition: all 0.3s ease-in-out; /* Добавлено */
  margin-right: 1px;
}

.edit-btn:hover{
  width: 100px;
  height: 25px;
  padding: 10px 20px;
  transition: all 0.3s ease-in;
}

.edit-btn, .edit-img{
  margin: 0 auto;
  width: 25px;
  height: 25px;
}

.edit-btn .edit-text{
  opacity: 0;
  margin-left: -100%;
  transition: opacity 0.3s ease-in-out, margin-left 0.3s ease-in-out;
}

.edit-btn:hover .edit-img{
  margin-left: -15px;
  margin-right: 10px;
}

.edit-btn:hover .edit-text{
  opacity: 1;
  margin-left: -10px;
}

.delete-btn{
  background-color: transparent;
  border: none;
  cursor: pointer;
  margin-left: 10px;
  margin-top: 3px;
}

.undo-btn, .redo-btn{
  background-color: transparent;
  border: none;
  width: 20px;
  height: 20px;
}

.note-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2px solid #ccc;
  margin: 0 auto; /* Центрируем форму по горизонтали */

  padding: 20px;
  border-radius: 8px;
  width: 80%; /* Ширина формы */
  max-width: 400px; /* Максимальная ширина формы */
  position: fixed; /* Позиционируем форму абсолютно */
  top: 50%; /* Положение сверху по центру */
  left: 50%; /* Положение слева по центру */
  transform: translate(-50%, -50%); /* Центрируем форму по вертикали и горизонтали */
  background-color: #fff; /* Фон формы */
  z-index: 1000; /* Устанавливаем высокий уровень z-index */
  box-shadow: 1px 4px 6px rgba(0, 0, 0, 0.1); /* Добавляем тень */

}

.form-input {
  width: 100%;
  margin-bottom: 10px;
  padding: 8px;
  box-sizing: border-box;
  border-radius: 8px;

}

.form-label{
  font-family: 'Prompt', sans-serif;
  font-size: 15px;
  margin-bottom: 10px;

}

.undo-btn{
  position: absolute;
  top: 12%;
  left: 8%;
  width: 20px;
  height: 20px;
  cursor: pointer;
}


.undo-btn img{
  width: 20px;
  height: 20px;
}

.redo-btn{
  position: absolute;
  top: 12%;
  right: 8%;
  width: 20px;
  height: 20px;
  margin-right: 15px;
  cursor: pointer;
}

.redo-btn img{
  width: 20px;
  height: 20px;
}

.todo-list {
  width: 100%;
}

.todo-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.todo-checkbox {
  margin-right: 8px;
}

.todo-label {
  flex-grow: 1;
  word-wrap: break-word;
}

.add-todo-btn {
  margin-top: 10px;
  cursor: pointer;
  background-color: #1e1f22;
  color: #fff;
  border: none;
  padding: 10px 15px 10px 15px;
  border-radius: 8px;
}

.save-note-btn {
  margin-top: 10px;
  cursor: pointer;
  background-color: #1e1f22;
  color: #fff;
  border: none;
  padding: 10px 15px 10px 15px;
  border-radius: 8px;
  margin-right: 10px;
}

.todo-bottom{
  display: flex;
  justify-content: space-between;
}


.close-form-btn {
  margin-top: 10px;
  cursor: pointer;
  background-color: #1e1f22;
  color: #fff;
  border: none;
  padding: 10px 15px 10px 15px;
  border-radius: 8px;
  margin-left: 10px;
}

.remove-todo-btn{
  cursor: pointer;
  background-color: #1e1f22;
  color: #fff;
  border: none;
  padding: 10px 15px 10px 15px;
  border-radius: 8px;
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

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.validation-warning {
  color: red;
  margin-bottom: 10px;
}

</style>