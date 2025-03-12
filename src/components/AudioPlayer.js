"use client"

import { useState, useRef, useEffect } from "react"

const AudioPlayer = ({ track, onEnded }) => {
    const audioRef = useRef(null)
    const progressRef = useRef(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(0.7)
    const [showVolumeControl, setShowVolumeControl] = useState(false)
    const [error, setError] = useState(null)

    // 当曲目变化时重置播放器
    useEffect(() => {
        if (audioRef.current) {
            // 重置错误状态
            setError(null)

            // 尝试播放
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
    }, [track])

    // 处理播放/暂停
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

    // 处理进度条变化
    const handleProgressChange = (e) => {
        const newTime = e.target.value
        setCurrentTime(newTime)
        audioRef.current.currentTime = newTime
    }

    // 处理进度条点击
    const handleProgressClick = (e) => {
        if (progressRef.current) {
            const rect = progressRef.current.getBoundingClientRect()
            const percent = (e.clientX - rect.left) / rect.width
            const newTime = percent * duration
            setCurrentTime(newTime)
            audioRef.current.currentTime = newTime
        }
    }

    // 处理音量变化
    const handleVolumeChange = (e) => {
        const newVolume = e.target.value
        setVolume(newVolume)
        audioRef.current.volume = newVolume
    }

    // 格式化时间
    const formatTime = (time) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
    }

    // 前进15秒
    const forward15 = () => {
        audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 15, duration)
    }

    // 后退15秒
    const backward15 = () => {
        audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 15, 0)
    }

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center mb-4">
                {/* 专辑封面 */}
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                </div>

                {/* 曲目信息 */}
                <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-xl sm:text-2xl font-bold mb-2 truncate">{track.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">本地播客</p>

                    <audio
                        ref={audioRef}
                        src={track.path}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={onEnded}
                        onError={handleError}
                        className="hidden"
                    />

                    {/* 错误提示 */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 进度条 */}
            <div className="mb-4">
                <div
                    ref={progressRef}
                    className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden cursor-pointer relative"
                    onClick={handleProgressClick}
                >
                    <div
                        className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* 控制按钮 */}
            <div className="flex justify-center items-center gap-4 sm:gap-6">
                {/* 音量控制 */}
                <div className="relative">
                    <button
                        onClick={() => setShowVolumeControl(!showVolumeControl)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {showVolumeControl && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={handleVolumeChange}
                                className="w-24 accent-indigo-600"
                            />
                        </div>
                    )}
                </div>

                {/* 后退15秒 */}
                <button
                    onClick={backward15}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    disabled={error}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <text x="8.5" y="15" fontSize="6" fontWeight="bold">15</text>
                    </svg>
                </button>

                {/* 播放/暂停 */}
                <button
                    onClick={togglePlay}
                    className={`w-14 h-14 rounded-full ${
                        error
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-indigo-600 hover:bg-indigo-700"
                    } text-white flex items-center justify-center shadow-md`}
                >
                    {error ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    ) : isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>

                {/* 前进15秒 */}
                <button
                    onClick={forward15}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    disabled={error}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <text x="8.5" y="15" fontSize="6" fontWeight="bold">15</text>
                    </svg>
                </button>

                {/* 播放速度 */}
                <button
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    disabled={error}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    )
}

export default AudioPlayer