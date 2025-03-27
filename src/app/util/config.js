const isDev = process.env.NODE_ENV === 'development'

const PUBLIC_URL = isDev ? '/' : '/podcaster/'

module.exports = {
    isDev,
    PUBLIC_URL,
}