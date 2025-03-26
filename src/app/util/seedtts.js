/**
 * 火山引擎语音合成(TTS)接入模块
 * 基于火山引擎大模型语音合成API实现
 */

const axios = require('axios')
const fs = require('fs-extra')
const { processPodcast } = require('./podcast_processor')
const { xyzUploader } = require('./xyz_uploader')
require('dotenv').config()

const API_KEY = process.env.SEEDTTS_API_KEY
const appid = process.env.SEEDTTS_APPID
const voice_type = process.env.SEEDTTS_VOICE_TYPE

const queryTaskAndSave = async (task_id, epTitle, outputFileName) => {
    if (!task_id) {
        throw new Error('task id不能为空')
    }


    const payload = {
        appid,
        task_id,
        taskid: task_id,
    }

    const queryString = new URLSearchParams(payload).toString()
    // console.log('queryString', queryString)
    try {
        // console.log('开始查询任务状态...', task_id)
        // 发送HTTP请求
        const response = await axios.get(`https://openspeech.bytedance.com/api/v1/tts_async/query?${queryString}`, {
            headers: {
                'Content-Type': 'application/json',
                'Resource-Id': 'volc.tts_async.default',
                'Authorization': `Bearer; 9aVv3cIpw8cIBYXnxtinANeDsjhtpY0H`
            },
            responseType: 'json'
        })

        const { audio_url, task_status } = response.data

        if (audio_url) {
            console.log('音频URL:', audio_url)
            const mp3path = await processPodcast(audio_url, outputFileName)


            // 日志函数
            const logger = message => console.log(`[${new Date().toLocaleTimeString()}] ${message}`)

            try {
                console.log('开始上传播客...')

                // 新的简化调用方式
                const result = await xyzUploader(epTitle, mp3path, {
                    // podcastId: '您的播客ID',  // 可选
                    // chromePath: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',  // 例如：C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe
                    // tokenFile: './my-token.json',  // 指定一个自定义token文件路径
                    headless: true,  // 设置为false可以看到浏览器操作过程，便于调试
                    logger: logger
                })

                if (result) {
                    console.log('✅ 播客上传成功!')
                } else {
                    console.log('❌ 播客上传失败')
                }
            } catch (error) {
                console.error('上传过程中发生错误:', error.message)
            }

            return
        }

        if (task_status === 0) {
            console.log('合成中...')
            setTimeout(() => {
                return queryTaskAndSave(task_id, epTitle, outputFileName)
            }, 1000)
        }

        if (task_status === 2) {
            console.log('合成失败...')
            return
        }



    } catch (error) {
        if (error.response) {
            throw new Error(`请求失败: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
        } else if (error.request) {
            throw new Error(`请求未收到响应: ${error.message}`)
        } else {
            throw error
        }
    }
}

const submitTask = async (title, text, outputFileName) => {
    if (!text) {
        throw new Error('文本内容不能为空')
    }


    // 构建请求参数
    const reqid = (Math.random().toString(16) + Date.now()).slice(-24)
    const payload = {
        text,
        appid,
        "reqid": reqid,
        "format": "mp3",
        voice_type,
        "sample_rate": 24000,
        "volume": 1.2,
        "speed": 1,
        "pitch": 1.1,
        "text_type": "ssml"
    }

    try {
        // 发送HTTP请求
        const response = await axios.post('https://openspeech.bytedance.com/api/v1/tts_async/submit', payload, {
            headers: {
                'Content-Type': 'application/json',
                'Resource-Id': 'volc.tts_async.default',
                'Authorization': `Bearer; ${API_KEY}`
            },
            responseType: 'json'
        })

        const {task_id, task_status } = response.data
        if (task_status === 0 && task_id) {
            console.log('任务提交成功，开始查询任务状态...')
            return queryTaskAndSave(task_id, title, outputFileName)
        }

        console.log('合成失败\n\n', response.data)

    } catch (error) {
        if (error.response) {
            throw new Error(`请求失败: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
        } else if (error.request) {
            throw new Error(`请求未收到响应: ${error.message}`)
        } else {
            throw error
        }
    }
}

module.exports = {
    submitTask
}