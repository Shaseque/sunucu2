const path = require('path')
const fastify = require('fastify')({
  logger: false,
  trustProxy: true
})
const fastifyStatic = require('@fastify/static')
const compress = require('@fastify/compress')
const helmet = require('@fastify/helmet')

fastify.register(compress, {
  global: true,
  brotliOptions: {
    params: {
      [require('zlib').constants.BROTLI_PARAM_QUALITY]: 4
    }
  }
})

fastify.register(helmet, {
  contentSecurityPolicy: false
})

fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/',
  cacheControl: true,
  immutable: true,
  maxAge: '1y'
})

fastify.get('/', (req, reply) => {
  reply.sendFile('index.html')
})

fastify.listen({ port: 3000, host: '0.0.0.0' }, err => {
  if (err) {
    console.error('💥 Server patladı:', err)
    process.exit(1)
  }
  console.log('✅ Shase Tools açık: http://localhost:3000')
})
