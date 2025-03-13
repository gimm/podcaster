
const axios = require('axios')
const cheerio = require('cheerio')

/**
 * 获取 Readhub 每日早报内容并提取话题链接文本
 */
const fetchReadhubDaily = async () => {
    try {
        // 设置请求头，模拟浏览器访问
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
        }

        // 发送请求获取 HTML 内容
        const response = await axios.get('https://readhub.cn/daily', { headers })
        const html = response.data

        // 使用 cheerio 加载 HTML
        const $ = cheerio.load(html)

        // 查找所有指向话题的链接元素
        const topicLinks = $('article div[class*="style_title"]')

        // 提取链接文本
        const topicList = topicLinks.map((index, element) => {
            return {
                title: $(element).text().trim().slice(2),
                summary: $(element).next().text().trim(),
            }
        }).get()

        // 输出结果
        console.log('找到话题链接数量:', topicList.length)
        topicList.forEach(({ title, summary }, index) => {
            console.log(`${index + 1}. ${title}\n${summary}\n`)
        })

        return topicList
    } catch (error) {
        console.error('获取 Readhub 每日早报内容失败:', error.message)
        return []
    }
}

// 执行函数
// fetchReadhubDaily()

module.exports = {
    fetchReadhubDaily
}
