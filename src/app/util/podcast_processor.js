const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { exec } = require('child_process')
const { promisify } = require('util')

const execPromise = promisify(exec)

// 配置参数
const config = {
    backgroundMusic: path.resolve('./public/bg.mp3'),
    tempPodcastFile: './temp_podcast.mp3',
    fadeInDuration: 1,        // 渐入时长（秒）
    fadeOutDuration: 3,       // 渐出时长（秒）
    bgMusicVolume: 0.1,       // 背景音乐音量（播客播放时）
    endingDuration: 5,        // 结尾背景音乐持续时间（秒）
    introMusicDuration: 10,   // 背景音乐播放多久后开始播客内容（秒）
    volumeTransitionDuration: 2  // 背景音乐音量变化的过渡时长（秒）
}

// 创建一个函数式编程的管道
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x)

// 检查文件是否存在
const checkFileExists = filePath => {
    return new Promise((resolve, reject) => {
        fs.access(filePath, fs.constants.F_OK, err => {
            if (err) {
                reject(new Error(`文件 ${filePath} 不存在`))
            } else {
                resolve(filePath)
            }
        })
    })
}

// 检查 FFmpeg 是否安装
const checkFFmpeg = async () => {
    try {
        await execPromise('ffmpeg -version')
        console.log('FFmpeg 已安装')
        return true
    } catch (error) {
        console.error('错误: FFmpeg 未安装。请安装 FFmpeg 后再运行此程序。')
        console.error('安装指南: https://ffmpeg.org/download.html')
        return false
    }
}

// 下载播客
const downloadPodcast = async (url, outputPath) => {
    try {
        console.log('正在下载播客...')
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        })

        const writer = fs.createWriteStream(outputPath)
        response.data.pipe(writer)

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log('播客下载完成')
                resolve(outputPath)
            })
            writer.on('error', reject)
        })
    } catch (error) {
        console.error('下载播客时出错:', error.message)
        throw error
    }
}

// 获取音频文件时长（秒）
const getAudioDuration = async (audioPath) => {
    try {
        const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
        const { stdout } = await execPromise(command)
        return parseFloat(stdout.trim())
    } catch (error) {
        console.error('获取音频时长时出错:', error.message)
        throw error
    }
}

// 合并音频文件（带平滑渐变效果）
const mergeAudioFiles = async (bgMusicPath, podcastPath, outputPath) => {
    try {
        console.log('正在处理音频文件...')

        // 获取音频文件时长
        const bgDuration = await getAudioDuration(bgMusicPath)
        const podcastDuration = await getAudioDuration(podcastPath)

        console.log(`背景音乐时长: ${bgDuration}秒`)
        console.log(`播客时长: ${podcastDuration}秒`)

        // 计算需要循环的次数（确保背景音乐足够长）
        // 总时长 = 前奏(10秒) + 播客时长 + 结尾时长
        const totalDuration = config.introMusicDuration + podcastDuration + config.endingDuration
        const loopCount = Math.ceil(totalDuration / bgDuration) + 1 // 多加一次以确保足够长

        console.log(`需要循环背景音乐 ${loopCount} 次`)

        // 创建临时文件夹
        const tempDir = path.resolve('public/temp')
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }

        // 临时文件路径
        const loopedBgPath = path.join(tempDir, 'looped_bg.mp3')

        // 1. 创建循环的背景音乐
        const loopCommand = `ffmpeg -y -stream_loop ${loopCount - 1} -i "${bgMusicPath}" -c copy "${loopedBgPath}"`
        await execPromise(loopCommand)
        console.log('背景音乐循环处理完成')

        // 2. 使用更简单的方法实现音频混合和淡入淡出效果
        // 避免复杂的音量表达式，改用更可靠的方法

        // 临时文件路径
        const bgProcessedPath = path.join(tempDir, 'bg_processed.mp3')
        const podcastDelayedPath = path.join(tempDir, 'podcast_delayed.mp3')

        // 处理背景音乐：添加淡入淡出效果
        const bgProcessCommand = `ffmpeg -y -i "${loopedBgPath}" -af "afade=t=in:st=0:d=${config.fadeInDuration},afade=t=out:st=${totalDuration-config.fadeOutDuration}:d=${config.fadeOutDuration},atrim=0:${totalDuration}" "${bgProcessedPath}"`
        await execPromise(bgProcessCommand)

        // 创建延迟的播客文件（添加10秒静音前缀）
        const podcastDelayCommand = `ffmpeg -y -i "${podcastPath}" -af "adelay=${config.introMusicDuration*1000}|${config.introMusicDuration*1000},afade=t=in:st=0:d=${config.fadeInDuration}" "${podcastDelayedPath}"`
        await execPromise(podcastDelayCommand)

        // 3. 使用音量自动调整滤镜混合音频
        // sidechaincompress 滤镜可以在播客声音出现时自动降低背景音乐音量
        const finalCommand = `ffmpeg -y -i "${bgProcessedPath}" -i "${podcastDelayedPath}" -filter_complex "
            [0:a]volume=1[bg];
            [1:a]volume=1[podcast];
            [bg][podcast]amix=inputs=2:duration=longest:weights=0.2 1[out]
        " -map "[out]" "${outputPath}"`

        await execPromise(finalCommand)
        console.log(`音频合并完成，输出文件: ${outputPath}`)

        // 清理临时文件
        fs.unlinkSync(loopedBgPath)
        fs.unlinkSync(bgProcessedPath)
        fs.unlinkSync(podcastDelayedPath)
        if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
            fs.rmdirSync(tempDir)
        }

        return outputPath
    } catch (error) {
        console.error('合并音频时出错:', error.message)
        throw error
    }
}

// 主函数
const processPodcast = async (podcastUrl, outputFileName) => {
    try {
        // 检查 FFmpeg 是否安装
        const ffmpegInstalled = await checkFFmpeg()
        if (!ffmpegInstalled) {
            return
        }

        // 检查背景音乐是否存在
        await checkFileExists(config.backgroundMusic)

        // 下载播客
        await downloadPodcast(podcastUrl, config.tempPodcastFile)
        console.log('播客下载完成', outputFileName, 1111)
        // 合并音频
        await mergeAudioFiles(config.backgroundMusic, config.tempPodcastFile, outputFileName)

        // 清理临时文件
        fs.unlinkSync(config.tempPodcastFile)
        console.log('处理完成！最终文件保存为:', path.resolve(outputFileName))
        return path.resolve(outputFileName)
    } catch (error) {
        console.error('处理播客时出错:', error.message)

        // 清理可能存在的临时文件
        if (fs.existsSync(config.tempPodcastFile)) {
            fs.unlinkSync(config.tempPodcastFile)
        }
    }
}

// 仅当直接运行此文件时才执行主函数
if (require.main === module) {
    processPodcast()
} else {
    // 作为模块导入时，导出函数
    module.exports = {
        processPodcast,
        downloadPodcast,
        mergeAudioFiles,
        checkFileExists,
        checkFFmpeg
    }
}