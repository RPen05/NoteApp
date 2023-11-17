  <script>
export default {
  props: {
    selectedFolderName: String,
  },
  methods: {
    toggleNoteForm() {
      this.$emit("toggleNoteForm");
    },
  },
};
  </script>

  <template>
    <div class="header">
      <div class="title">
        <span>{{ selectedFolderName || 'Выберите папку' }}</span>
      </div>
      <button class="create-btn" @click="toggleNoteForm">
        <img src="../assets/img/plus.png" alt="" class="create-img">
        <span class="create-text">Создать</span>
      </button>
    </div>
  </template>

<style scoped>

  .header{
    height: 50px;
    width: auto;
    display: flex;
    justify-content: space-between;
    flex: 1 0 0;
    margin-left: 20px;
    margin-right: 20px;
    align-items: center;

  }
  .title{
    color: #1e1f22;
    font-size: 30px;
    font-weight: 500;
    font-family: 'Prompt', sans-serif;
    margin-left: 30px;
  }

  .create-btn{
    background-color: #1e1f22;
    color: #fff;
    border: none;

    cursor: pointer;
    position: relative;
    overflow: hidden;
    font-size: 16px;
    width: 45px;
    height: 45px;
    border-radius: 10px;
    display: flex; /* Добавлено */
    align-items: center; /* Добавлено */
    transition: all 0.3s ease-in-out; /* Добавлено */
    margin-right: 60px;
  }

  .create-btn:hover{
    width: 146px;
    height: 45px;
    padding: 10px 20px;
  }

  .create-btn .create-img{
    margin: 0 auto;
    transition: margin-right 0.3s ease-in-out;
    width: 35px;
    height: 35px;

  }

  .create-btn .create-text{
    opacity: 0;
    margin-left: -100%;
    transition: opacity 0.3s ease-in-out, margin-left 0.3s ease-in-out;
  }

  .create-btn:hover .create-img{
    margin-right: 5px;
  }

  .create-btn:hover .create-text{
    opacity: 1;
    margin-left: 0;
  }



</style>