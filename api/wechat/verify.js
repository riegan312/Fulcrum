import crypto from 'node:crypto'
import { generateWechatCode, getWechatCodeTtlMinutes } from '../_lib/wechat-code.js'

export const config = {
  api: {
    bodyParser: false,
  },
}

function parseXmlTag(xml, tag) {
  const cdataMatch = xml.match(new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]><\\/${tag}>`))
  if (cdataMatch?.[1] !== undefined) {
    return cdataMatch[1]
  }

  const plainMatch = xml.match(new RegExp(`<${tag}>(.*?)<\\/${tag}>`))
  return plainMatch?.[1] ?? ''
}

function buildTextReply({ toUser, fromUser, content }) {
  const now = Math.floor(Date.now() / 1000)
  return `<xml>
<ToUserName><![CDATA[${toUser}]]></ToUserName>
<FromUserName><![CDATA[${fromUser}]]></FromUserName>
<CreateTime>${now}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[${content}]]></Content>
</xml>`
}

async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

export default function handler(req, res) {
  if (req.method === 'GET') {
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

  if (req.method === 'POST') {
    return readRawBody(req)
      .then((xml) => {
        const msgType = parseXmlTag(xml, 'MsgType')
        const content = parseXmlTag(xml, 'Content').trim()
        const fromUser = parseXmlTag(xml, 'FromUserName')
        const toUser = parseXmlTag(xml, 'ToUserName')

        if (!fromUser || !toUser) {
          return res.status(400).send('Invalid XML body.')
        }

        let reply = '请发送“验证码”获取注册验证码。'

        if (msgType === 'text' && content === '验证码') {
          const code = generateWechatCode()
          const ttl = getWechatCodeTtlMinutes()
          reply = `验证码：${code}（${ttl}分钟内有效）。请回到平台填写完成注册。`
        }

        const xmlReply = buildTextReply({
          toUser: fromUser,
          fromUser: toUser,
          content: reply,
        })

        res.setHeader('Content-Type', 'application/xml; charset=utf-8')
        return res.status(200).send(xmlReply)
      })
      .catch(() => {
        return res.status(500).send('Failed to process message.')
      })
  }

  return res.status(405).send('Method Not Allowed')
}
