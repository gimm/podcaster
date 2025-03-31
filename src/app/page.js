"use client"

import { useState, useEffect, useRef } from "react"
import { PUBLIC_URL } from "./util/config"


const $fetch = (url, ...args) => fetch(`${PUBLIC_URL}${url}`, ...args)

// 添加自定义动画到 Tailwind
const customStyles = `
@keyframes progress {
    0% { width: 0% }
    100% { width: 100% }
}

@keyframes shimmer {
    0% { transform: translateX(-100%) }
    100% { transform: translateX(100%) }
}

.animate-progress {
    animation: progress 2s linear infinite;
}

.animate-shimmer {
    animation: shimmer 2s infinite;
}
`

const MP3_FILE_LIST_KEY = 'mp3FileMapKey'

export default function Home() {
    const [fileNameList, setFileNameList] = useState([])
    const [mp3Generating, setMp3Generating] = useState(null)
    const [total, setTotal] = useState(0)
    const [mp3List, setMp3List] = useState([])
    const [currentTrack, setCurrentTrack] = useState(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const audioRef = useRef(null)
    const [toast, setToast] = useState(null)

    // 从 localStorage 加载数据
    useEffect(() => {
        try {
            const storedList = localStorage.getItem(MP3_FILE_LIST_KEY)
            if (storedList) {
                setFileNameList(JSON.parse(storedList))
            } else {
                fetchMp3List()
            }

            const storedGenerating = localStorage.getItem('mp3Generating')
            if (storedGenerating) {
                setMp3Generating(JSON.parse(storedGenerating))
            }
        } catch (e) {
            console.error("从 localStorage 加载数据失败:", e)
        }
    }, [])

    // 获取 MP3 列表
    const fetchMp3List = async () => {
        try {
            setIsLoading(true)
            const response = await $fetch("api/mp3")
            const data = await response.json()
            setTotal(data.total)
            setMp3List(data.mp3Files.map((x, index) => {
                return {
                    ...x,
                    title: `ep${data.total - index}. ${fileNameList.find(y => y.id === x.id)?.title || x.name}`
                }
            }))

            console.log(data.mp3Files, fileNameList, data.mp3Files.map(x => {
                return {
                    ...x,
                    title: fileNameList.find(y => y.id === x.id)?.title || x.name
                }
            }))

            if (data.mp3Files.some(file => file.id === mp3Generating?.id)) {
                setMp3Generating(null)
                localStorage.setItem('mp3Generating', JSON.stringify(null))
            }

            setIsLoading(false)
        } catch (error) {
            console.error("获取 MP3 列表失败:", error)
            setIsLoading(false)
        }
    }

    // 播放选中的曲目
    const handlePlay = (track) => {
        if (currentTrack && currentTrack.id === track.id) {
            // 如果点击当前播放的曲目，则切换播放/暂停状态
            togglePlay()
        } else {
            // 播放新的曲目
            setCurrentTrack(track)
            setError(null)

            // 在下一个渲染周期中播放
            setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.play()
                        .then(() => {
                            setIsPlaying(true)
                        })
                        .catch(err => {
                            console.error("播放失败:", err)
                            setIsPlaying(false)
                            setError("无法播放此音频文件，请检查文件格式是否正确")
                        })
                }
            }, 0)
        }
    }

    // 切换播放/暂停状态
    const togglePlay = () => {
        if (error) {
            // 如果有错误，尝试重新加载
            setError(null)
            if (audioRef.current) {
                audioRef.current.load()
                audioRef.current.play()
                    .then(() => setIsPlaying(true))
                    .catch(err => {
                        console.error("重新播放失败:", err)
                        setIsPlaying(false)
                        setError("无法播放此音频文件，请检查文件格式是否正确")
                    })
            }
            return
        }

        if (isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play()
                .catch(err => {
                    console.error("播放失败:", err)
                    setError("无法播放此音频文件，请检查文件格式是否正确")
                })
        }
        setIsPlaying(!isPlaying)
    }

    // 处理时间更新
    const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current.currentTime)
    }

    // 处理加载元数据
    const handleLoadedMetadata = () => {
        setDuration(audioRef.current.duration)
    }

    // 处理错误
    const handleError = (e) => {
        console.error("音频加载错误:", e)
        setError("无法播放此音频文件，请检查文件格式是否正确")
        setIsPlaying(false)
    }

    // 处理播放结束
    const handleEnded = () => {
        // 播放下一首
        const currentIndex = mp3List.findIndex(track => track.id === currentTrack.id)
        const nextIndex = (currentIndex + 1) % mp3List.length
        setCurrentTrack(mp3List[nextIndex])
    }

    // 处理进度条变化
    const handleProgressChange = (e, trackId) => {
        if (currentTrack && currentTrack.id === trackId) {
            const newTime = e.target.value
            setCurrentTime(newTime)
            audioRef.current.currentTime = newTime
        }
    }

    // 格式化时间
    const formatTime = (time) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
    }

    // 格式化文件大小
    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B'
        else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        else return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    // 格式化日期
    const formatDate = str => new Date(str).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })

    // 初始加载
    useEffect(() => {
        if (fileNameList?.length === 0) {
            return
        }
        fetchMp3List()
    }, [fileNameList])

    // 添加自动刷新功能
    useEffect(() => {
        let intervalId = null

        // 如果正在生成MP3，设置定时器每3秒刷新一次
        if (mp3Generating) {
            console.log("设置自动刷新定时器")
            intervalId = setInterval(() => {
                console.log("自动刷新MP3列表")
                fetchMp3List()
            }, 10000)
        }

        // 清理函数
        return () => {
            if (intervalId) {
                console.log("清除自动刷新定时器")
                clearInterval(intervalId)
            }
        }
    }, [mp3Generating])

    const handleSyncPodcast = async () => {
        try {
            setIsLoading(true)
            const response = await $fetch("api/mp3", {
                method: "POST",
            })

            if (response.ok) {
                fetchMp3List()
                const data = await response.json()
                if (data.mp3Generating) {
                    setMp3Generating(data.mp3Generating)
                    localStorage.setItem('mp3Generating', JSON.stringify(data.mp3Generating))
                    const newFileNameList = [data.mp3Generating, ...fileNameList].slice(0, 100)
                    localStorage.setItem(MP3_FILE_LIST_KEY, JSON.stringify(newFileNameList))
                    setFileNameList(newFileNameList)
                    setToast({
                        type: 'success',
                        message: `添加成功`
                    })
                } else {
                    throw new Error(data.message)
                }
            } else {
                throw new Error("添加播客失败")
            }
        } catch (error) {
            console.error("添加播客失败:", error)
            setToast({
                type: 'error',
                message: `添加播客失败: ${error.message}`
            })
        } finally {
            setIsLoading(false)
        }
    }

    const getApi = () => {
        const apiUrl = document.getElementById('apiUrl').value
        if (apiUrl) {
            window.localStorage.setItem('isAdmin', apiUrl)
        }
    }

    const isAdmin = localStorage.getItem('isAdmin') === 'true'

    if (!isAdmin) {
        return (
            <div className="min-h-screen text-black bg-white">
                <div className="container mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold mb-4">接口中心</h1>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">接口地址：</span>
                            <input id="apiUrl" type="text" className="flex-1 px-3 py-2 rounded-md bg-gray-800 text-white" />
                            <button className="px-4 py-2 rounded-md bg-blue-500 text-white" onClick={getApi}>获取接口</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white">
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />
            {/* Toast 提示 */}
            {toast && (
                <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in ${
                    toast.type === 'error' ? 'bg-red-500/90' : 'bg-green-500/90'
                }`}>
                    {toast.type === 'error' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    )}
                    <span>{toast.message}</span>
                    <button
                        onClick={() => setToast(null)}
                        className="ml-2 text-white hover:text-gray-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            )}
            {/* 隐藏的音频元素 */}
            {currentTrack && (
                <audio
                    ref={audioRef}
                    src={currentTrack.path}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleEnded}
                    onError={handleError}
                    className="hidden"
                />
            )}

            {/* 顶部导航栏 */}
            <header className="sticky top-0 z-10 backdrop-blur-md bg-black/30 border-b border-white/10">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center text-3xl">
                        🤖
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 text-transparent bg-clip-text">AI 早知道</h1>
                    </div>
                    {mp3Generating ? (
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors">
                            <span className="text-gray-300">生成中...</span>
                        </div>
                    ) : (
                        <button
                            onClick={handleSyncPodcast}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            添加播客
                        </button>
                    )}
                </div>
            </header>

            <main className="container mx-auto px-4 py-6">
                {
                    mp3Generating ? (
                        <div className="p-6 mb-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
                            <div className="flex items-center gap-2 mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                <p className="text-gray-300 relative">
                                    正在生成播客，请稍后...
                                    <span className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 animate-progress"></span>
                                </p>
                            </div>
                            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 text-transparent bg-clip-text relative overflow-hidden">
                                {mp3Generating.title}
                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></span>
                            </h2>
                            <div className="flex items-center gap-3 mt-4">
                                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                            </div>
                        </div>
                    ) : (

                        <div className="mb-8 flex flex-col md:flex-row gap-6 items-center md:items-start">
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 text-transparent bg-clip-text">AI 早知道 🤖</h2>
                                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">人工智能</span>
                                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium">科技前沿</span>
                                    <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-medium">每日更新</span>
                                </div>
                                {/* <p className="text-gray-300 mb-4">
                                    每天5分钟，带你了解AI领域最新动态。从大模型突破到行业应用，从技术解析到未来展望，让你轻松掌握人工智能的发展脉搏。
                                </p> */}
                                <div className="flex items-center gap-4 justify-center md:justify-start">
                                    <div className="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span className="text-gray-300">4.9 (128)</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-gray-300">5-10 分钟</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 100 12A6 6 0 0010 4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-gray-300">已更新 {total} 期</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* 播放列表 */}
                <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-lg overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <h2 className="text-xl font-bold">最新播客</h2>
                        <button
                            onClick={fetchMp3List}
                            className="p-1.5 rounded-full hover:bg-white/10"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>


                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                            <p className="mt-2 text-gray-400">加载中...</p>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center">
                            <p className="text-red-400">{error}</p>
                            <button
                                onClick={fetchMp3List}
                                className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors"
                            >
                                重试
                            </button>
                        </div>
                    ) : mp3List.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-400">暂无播客</p>
                            <button
                                onClick={handleSyncPodcast}
                                className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors flex items-center gap-1 mx-auto"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                添加播客
                            </button>
                        </div>
                    ) : (
                        <ul className="divide-y divide-white/10">
                            {mp3List.map(track => (
                                <li
                                    key={track.id}
                                    className={`p-4 hover:bg-white/5 transition-colors ${
                                        currentTrack && currentTrack.id === track.id
                                            ? "bg-white/10"
                                            : ""
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* 播放按钮 */}
                                        <button
                                            onClick={() => handlePlay(track)}
                                            className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center shadow-md ${
                                                currentTrack && currentTrack.id === track.id && isPlaying
                                                    ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white"
                                                    : "bg-white/10 hover:bg-white/20 text-white"
                                            }`}
                                        >
                                            {currentTrack && currentTrack.id === track.id && isPlaying ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </button>

                                        {/* 播客信息 */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="text-lg font-medium truncate pr-2 flex-1">
                                                    {track.title}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    {/* 复制按钮 */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            // 复制功能代码保持不变
                                                            const copyText = (text) => {
                                                                if (navigator.clipboard && navigator.clipboard.writeText) {
                                                                    return navigator.clipboard.writeText(text)
                                                                        .then(() => true)
                                                                        .catch(() => false)
                                                                }
                                                                try {
                                                                    const textarea = document.createElement('textarea')
                                                                    textarea.value = text
                                                                    textarea.style.position = 'fixed'
                                                                    textarea.style.opacity = '0'
                                                                    document.body.appendChild(textarea)
                                                                    textarea.select()
                                                                    const result = document.execCommand('copy')
                                                                    document.body.removeChild(textarea)
                                                                    return Promise.resolve(result)
                                                                } catch (err) {
                                                                    console.error('复制失败:', err)
                                                                    return Promise.resolve(false)
                                                                }
                                                            }

                                                            // 执行复制操作
                                                            copyText(track.title)
                                                                .then((success) => {
                                                                    if (success) {
                                                                        // 获取按钮元素
                                                                        const button = e.currentTarget
                                                                        if (!button) return

                                                                        // 添加明显的视觉反馈
                                                                        button.classList.add('bg-green-500/30')
                                                                        button.classList.add('text-green-400')
                                                                        button.classList.add('scale-110')
                                                                        button.classList.add('opacity-100')

                                                                        // 2秒后恢复原状
                                                                        setTimeout(() => {
                                                                            button.classList.remove('bg-green-500/30')
                                                                            button.classList.remove('text-green-400')
                                                                            button.classList.remove('scale-110')

                                                                            // 添加淡出效果
                                                                            button.classList.add('transition-opacity')
                                                                            button.classList.add('duration-300')
                                                                        }, 1000)
                                                                    }
                                                                })
                                                        }}
                                                        className="p-1.5 rounded-full hover:bg-white/10 opacity-60 hover:opacity-100 transition-all transform"
                                                        title="复制标题"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                                        </svg>
                                                    </button>

                                                </div>
                                            </div>

                                            <div className="flex items-center text-sm text-gray-400 mb-2">
                                                <span className="mr-3 flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                    </svg>
                                                    {formatDate(track.lastModified)}
                                                </span>
                                                <span className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        // 创建下载链接
                                                        const link = document.createElement('a')
                                                        link.href = track.path
                                                        link.download = `${track.title}.mp3`
                                                        document.body.appendChild(link)
                                                        link.click()
                                                        document.body.removeChild(link)

                                                        // 添加视觉反馈
                                                        const span = e.currentTarget
                                                        span.classList.add('text-blue-400')
                                                        span.classList.add('font-medium')

                                                        // 2秒后恢复
                                                        setTimeout(() => {
                                                            span.classList.remove('text-blue-400')
                                                            span.classList.remove('font-medium')
                                                        }, 1000)
                                                    }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                    {formatFileSize(track.size)}
                                                </span>
                                            </div>

                                            {/* 当前播放的进度条 */}
                                            {currentTrack && currentTrack.id === track.id && (
                                                <div className="mt-2">
                                                    <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        <div
                                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                                            style={{ width: `${(currentTime / duration) * 100}%` }}
                                                        ></div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max={duration || 0}
                                                            value={currentTime}
                                                            onChange={(e) => handleProgressChange(e, track.id)}
                                                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                        <span>{formatTime(currentTime)}</span>
                                                        <span>{formatTime(duration)}</span>
                                                    </div>

                                                    {/* 错误提示 */}
                                                    {error && (
                                                        <div className="mt-2 p-2 bg-red-500/20 text-red-300 rounded-lg text-sm">
                                                            <div className="flex items-center">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                </svg>
                                                                {error}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                            <li>
                                <a href="https://www.xiaoyuzhoufm.com/podcast/67c97140bfa2a84cabe29fe0" target="_blank" className="flex items-center justify-center py-4">查看更多</a>
                            </li>
                        </ul>
                    )}
                </div>
            </main>
        </div>
    )
}
