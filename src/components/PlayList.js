"use client"

import { useState } from "react"

const PlayList = ({ tracks, currentTrack, onPlay, isLoading, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState("")

    // 过滤曲目
    const filteredTracks = tracks.filter(track =>
        track.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // 处理搜索
    const handleSearch = (e) => {
        setSearchTerm(e.target.value)
    }

    // 格式化文件大小
    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B'
        else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        else return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    // 格式化日期
    const formatDate = str => str.split('.')[0].replace('T', ' ')

    return (
        <div className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">我的播客</h2>
                <button
                    onClick={onRefresh}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="刷新列表"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            <div className="mb-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="搜索播客..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-full bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                />
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-indigo-600 dark:border-t-indigo-400 animate-spin mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">加载中...</p>
                </div>
            ) : filteredTracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-lg font-medium mb-1">没有找到播客</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchTerm ? "尝试使用其他关键词搜索" : "点击顶部的'添加播客'按钮上传新播客"}
                    </p>
                </div>
            ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700 -mx-4 sm:-mx-6">
                    {filteredTracks.map(track => (
                        <li
                            key={track.id}
                            className={`py-3 px-4 sm:px-6 flex items-center hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors ${
                                currentTrack && currentTrack.id === track.id
                                    ? "bg-indigo-50 dark:bg-indigo-900/30"
                                    : ""
                            }`}
                            onClick={() => onPlay(track)}
                        >
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mr-3 flex-shrink-0">
                                {currentTrack && currentTrack.id === track.id ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                                    </svg>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-medium truncate">{track.name}</h3>
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    <span className="mr-2">{formatFileSize(track.size)}</span>
                                    <span>{formatDate(track.lastModified)}</span>
                                </div>
                            </div>

                            <button
                                className={`ml-4 p-2 rounded-full ${
                                    currentTrack && currentTrack.id === track.id
                                        ? "text-indigo-600 dark:text-indigo-400"
                                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                }`}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onPlay(track)
                                }}
                            >
                                {currentTrack && currentTrack.id === track.id ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default PlayList