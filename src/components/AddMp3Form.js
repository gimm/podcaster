"use client"

import { useState, useRef } from "react"

const AddMp3Form = ({ onAddMp3, onCancel }) => {
    const [file, setFile] = useState(null)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState("")
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef(null)

    // 处理文件选择
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        validateAndSetFile(selectedFile)
    }

    // 验证并设置文件
    const validateAndSetFile = (selectedFile) => {
        if (selectedFile && selectedFile.type === "audio/mpeg") {
            setFile(selectedFile)
            setError("")
        } else {
            setFile(null)
            setError("请选择有效的 MP3 文件")
        }
    }

    // 处理拖拽
    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    // 处理拖放
    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0])
        }
    }

    // 处理表单提交
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!file) {
            setError("请选择 MP3 文件")
            return
        }

        setIsUploading(true)

        try {
            await onAddMp3(file)
            setFile(null)
            setError("")
        } catch (error) {
            setError("上传文件失败")
        } finally {
            setIsUploading(false)
        }
    }

    // 触发文件选择对话框
    const openFileSelector = () => {
        fileInputRef.current.click()
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">添加新播客</h2>
                <button
                    onClick={onCancel}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div
                    className={`mb-4 border-2 border-dashed rounded-lg p-6 text-center ${
                        dragActive
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                            : "border-gray-300 dark:border-gray-700"
                    }`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".mp3,audio/mpeg"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {file ? (
                        <div className="py-4">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                                </svg>
                            </div>
                            <p className="text-lg font-medium mb-1">{file.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                            <button
                                type="button"
                                onClick={() => setFile(null)}
                                className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                                重新选择
                            </button>
                        </div>
                    ) : (
                        <div className="py-8">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="mb-2 text-lg font-medium">
                                拖放 MP3 文件到这里，或者
                                <button
                                    type="button"
                                    onClick={openFileSelector}
                                    className="text-indigo-600 dark:text-indigo-400 hover:underline ml-1"
                                >
                                    浏览文件
                                </button>
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                支持 MP3 格式，最大文件大小 50MB
                            </p>
                        </div>
                    )}
                </div>

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

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={!file || isUploading}
                        className={`flex-1 py-2.5 px-4 rounded-lg ${
                            !file || isUploading
                                ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                                : "bg-yellow-600 hover:bg-yellow-700 text-white"
                        }`}
                    >
                        {isUploading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                上传中...
                            </span>
                        ) : "上传播客"}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default AddMp3Form