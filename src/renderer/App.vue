<template>
  <div class="player">
    <h1>音乐播放</h1>

    <ul>
      <li v-for="(file, index) in musicFiles" :key="index" @click="playFile(file)">
        {{ file.name }}
      </li>
    </ul>

    <div class="controls">
      <button @click="prev" title="上一首"><i class="fas fa-backward"></i></button>
      <button @click="togglePlay" title="播放/暂停">
        <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
      </button>
      <button @click="next" title="下一首"><i class="fas fa-forward"></i></button>
    </div>

    <div class="progress">
      <span>{{ formatTime(currentTime) }}</span>
      <input type="range" min="0" :max="duration" v-model="progress" @input="seek">
      <span>{{ formatTime(duration) }}</span>
    </div>

    <!--button @click="showEditModal" class="edit-button" title="编辑后端地址">
      <i class="fas fa-cog"></i>
    </button-->
    <!-- 模态框，用于输入新的后端地址 -->
    <div v-if="isModalVisible" class="modal">
      <div class="modal-content">
        <h3>修改后端地址</h3>
        <input v-model="backendAddress" placeholder="请输入后端地址">
        <button @click="saveAddress">保存</button>
        <button @click="closeEditModal">取消</button>
      </div>
    </div>

    <div class="author-info">
      <p>作者: <a href="https://co1d.in">Coldin04</a>  </p>
      <p>可以在程序resources/music文件夹下放入音乐文件</p>
    </div>

    <audio ref="audio" @timeupdate="updateProgress" @loadedmetadata="updateDuration"></audio>
  </div>
</template>

<script>
export default {
  data() {
    return {
      musicFiles: [],
      currentFile: null,
      currentTime: 0,
      duration: 0,
      progress: 0,
      isPlaying: false,
      backendAddress: '', // 初始化为空
      isModalVisible: false,
    };
  },
  mounted() {
    const audio = this.$refs.audio;
    audio.addEventListener('play', () => {
      this.isPlaying = true;
    });
    audio.addEventListener('pause', () => {
      this.isPlaying = false;
    });

    // 监听来自主进程的 'backend-port' 事件
    window.addEventListener('message', (event) => {
      if (event.data.type === 'backend-port') {
        const port = event.data.port;
        console.log(`接收到后端端口: ${port}`);
        setTimeout(() => {
          this.updateBackendAddress(`http://localhost:${port}`);
        }, 10); // 延迟5秒
      }
    });
  },
  methods: {
    showEditModal() {
      this.isModalVisible = true;
    },
    closeEditModal() {
      this.isModalVisible = false;
    },
    saveAddress() {
      this.isModalVisible = false;
      this.fetchMusicFiles();
    },
    async fetchMusicFiles() {
      if (!this.backendAddress) {
        console.warn('后端地址未设置');
        return;
      }
      try {
        const response = await fetch(`${this.backendAddress}/api/music`);
        if (!response.ok) {
          throw new Error('网络响应不是OK');
        }
        this.musicFiles = await response.json();
      } catch (error) {
        console.error('获取音乐文件失败:', error);
      }
    },
    updateBackendAddress(address) {
      this.backendAddress = address;
      this.fetchMusicFiles();
    },
    playFile(file) {
      console.log("正在播放文件:", file.path); // 调试日志
      this.currentFile = file;
      const audio = this.$refs.audio;
      audio.src = file.path;
      audio.play().catch(error => {
        console.error('播放失败:', error);
      });
    },
    togglePlay() {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    },
    play() {
      this.$refs.audio.play().catch(error => {
        console.error('播放失败:', error);
      });
      this.isPlaying = true;
    },
    pause() {
      this.$refs.audio.pause();
      this.isPlaying = false;
    },
    prev() {
      if (!this.currentFile) return;
      const currentIndex = this.musicFiles.findIndex(f => f.path === this.currentFile.path);
      const prevIndex = (currentIndex - 1 + this.musicFiles.length) % this.musicFiles.length;
      this.playFile(this.musicFiles[prevIndex]);
    },
    next() {
      if (!this.currentFile) return;
      const currentIndex = this.musicFiles.findIndex(f => f.path === this.currentFile.path);
      const nextIndex = (currentIndex + 1) % this.musicFiles.length;
      this.playFile(this.musicFiles[nextIndex]);
    },
    updateProgress(event) {
      this.currentTime = event.target.currentTime;
      if (this.duration) {
        this.progress = (this.currentTime / this.duration) * 100;
      }
    },
    updateDuration(event) {
      this.duration = event.target.duration;
    },
    seek() {
      this.$refs.audio.currentTime = this.progress;
    },
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    },
  },
};
</script>

<style>
@import './assets/styles.css';
</style>