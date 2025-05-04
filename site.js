const path = require('path')
const fastify = require('fastify')({
  logger: false, // log kapalı → milisaniyeden tasarruf
  trustProxy: true // CDN varsa kullanışlı
})
const fastifyStatic = require('@fastify/static')
const compress = require('@fastify/compress')
const helmet = require('@fastify/helmet')

// 🚀 GZIP + Brotli aktif
fastify.register(compress, {
  global: true,
  brotliOptions: {
    params: {
      [require('zlib').constants.BROTLI_PARAM_QUALITY]: 4
    }
  }
})

// 🛡️ Basit güvenlik önlemleri
fastify.register(helmet, {
  contentSecurityPolicy: false
})

// 📁 Static dosyalar → cache + immutability
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/',
  cacheControl: true,
  immutable: true,
  maxAge: '1y'
})

// 🏠 Ana sayfa (index.html)
fastify.get('/', (req, reply) => {
  reply.sendFile('index.html')
})

// 🚀 Sunucuyu başlat
fastify.listen({ port: 3000 }, err => {
  if (err) {
    console.error('💥 Server patladı:', err)
    process.exit(1)
  }
  console.log('✅ Shase Tools açık: http://localhost:3000')
})
