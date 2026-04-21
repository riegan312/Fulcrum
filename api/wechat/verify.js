import crypto from 'node:crypto'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed')
  }

  const signature = typeof req.query?.signature === 'string' ? req.query.signature : ''
  const timestamp = typeof req.query?.timestamp === 'string' ? req.query.timestamp : ''
  const nonce = typeof req.query?.nonce === 'string' ? req.query.nonce : ''
  const echostr = typeof req.query?.echostr === 'string' ? req.query.echostr : ''

  if (!signature || !timestamp || !nonce || !echostr) {
    return res.status(400).send('Missing required query params.')
  }

  const token = process.env.WECHAT_TOKEN || 'fulcrum789'
  const sha1 = crypto
    .createHash('sha1')
    .update([token, timestamp, nonce].sort().join(''))
    .digest('hex')

  if (sha1 === signature) {
    return res.status(200).send(echostr)
  }

  return res.status(401).send('Invalid signature.')
}

