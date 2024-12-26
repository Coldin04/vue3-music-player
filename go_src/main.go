package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"
	"unicode/utf8"
)

/*type Config struct {
	FrontendPort string `yaml:"frontend_port"`
	BackendPort  string `yaml:"backend_port"`
}
*/

type MusicFile struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

func getRandomPort() (int, error) {
	rand.Seed(time.Now().UnixNano())
	for i := 0; i < 100; i++ { // 尝试100次
		port := rand.Intn(65535-49152) + 49152
		ln, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
		if err == nil {
			ln.Close()
			return port, nil
		}
	}
	return 0, fmt.Errorf("无法找到可用端口")
}

func main() {

	if !utf8.ValidString(os.Getenv("LANG")) {
		os.Setenv("LANG", "zh_CN.UTF-8")
	}

	//生成随机端口
	BackendPort, err := getRandomPort()
	if err != nil {
		log.Fatalf("无法找到可用端口: %v", err)
	}

	fmt.Println("Port:", BackendPort)

	// 处理 /api/music 请求
	http.HandleFunc("/api/music", func(w http.ResponseWriter, r *http.Request) {
		// 设置 CORS 头
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			return
		}

		musicDir := "./resources/music"
		files, err := os.ReadDir(musicDir)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var musicFiles []MusicFile
		for _, file := range files {
			if !file.IsDir() {
				// 构建可访问的 URL 路径
				path := "http://localhost:" + strconv.Itoa(BackendPort) + "/music/" + filepath.Base(file.Name())
				musicFiles = append(musicFiles, MusicFile{
					Name: file.Name(),
					Path: path,
				})
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(musicFiles)
	})

	// 提供 /music/ 路径下的静态文件
	fs := http.FileServer(http.Dir("./resources/music"))
	http.Handle("/music/", http.StripPrefix("/music/", fs))

	// 启动后端服务器
	log.Printf("后端服务器正在运行在端口 %d", BackendPort)
	err = http.ListenAndServe(":"+strconv.Itoa(BackendPort), nil)
	if err != nil {
		log.Fatalf("后端服务器启动失败: %v", err)
	}
}
