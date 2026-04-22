import { verifyWechatCode } from '../../_lib/wechat-code.js'

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { code } = req.body || {}
  const ok = verifyWechatCode(code)

  if (!ok) {
    return res.status(400).json({ ok: false, error: '验证码无效或已过期。' })
  }

  return res.status(200).json({ ok: true })
}

