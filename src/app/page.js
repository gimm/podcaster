"use client"

import { useState, useEffect, useRef } from "react"

export default function Home() {
    const [mp3List, setMp3List] = useState([])
    const [currentTrack, setCurrentTrack] = useState(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const audioRef = useRef(null)

    // 获取 MP3 列表
    const fetchMp3List = async () => {
        try {
            setIsLoading(true)
            const response = await fetch("/api/mp3")
            const data = await response.json()
            setMp3List(data.mp3Files)
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
    const formatDate = str => str.split('.')[0].replace('T', ' ')

    // 初始加载
    useEffect(() => {
        fetchMp3List()
    }, [])

    const handleSyncPodcast = async () => {
         try {
            setIsLoading(true)
            const response = await fetch("/api/mp3", {
                method: "POST",
            })

            if (response.ok) {
                fetchMp3List()
            } else {
                console.error("添加 MP3 文件失败")
            }
        } catch (error) {
            console.error("添加 MP3 文件失败:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white">
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
                    <button
                        onClick={handleSyncPodcast}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        添加播客
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6">
                {/* 播客封面和简介 */}
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
                                <span className="text-gray-300">已更新 {mp3List.length} 期</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 播放列表 */}
                <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-lg overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <h2 className="text-xl font-bold">最新播客</h2>
                        <button
                            onClick={fetchMp3List}
                            className="p-1.5 rounded-full hover:bg-white/10"
                            title="刷新列表"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-blue-400 animate-spin mb-4"></div>
                            <p className="text-gray-300">加载中...</p>
                        </div>
                    ) : mp3List.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                            <h3 className="text-lg font-medium mb-1">没有找到播客</h3>
                            <p className="text-gray-400">
                                点击顶部的'添加播客'按钮上传新播客
                            </p>
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
                                            className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${
                                                currentTrack && currentTrack.id === track.id && isPlaying
                                                    ? "bg-yellow-500 text-white"
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
                                        <div className="flex-1">
                                            <h3 className="text-lg font-medium mb-1">{track.name}</h3>
                                            <div className="flex items-center text-sm text-gray-400 mb-3">
                                                <span className="mr-3">{formatDate(track.lastModified)}</span>
                                                <span>{formatFileSize(track.size)}</span>
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
                                        <div onClick={() => window.open(track.path, '_blank')}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 7L12 14M12 14L15 11M12 14L9 11" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M16 17H12H8" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"></path> <path d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z" stroke="#ffffff" stroke-width="1.5"></path> </g></svg>
                                            </svg>
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
