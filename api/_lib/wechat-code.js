import crypto from 'node:crypto'

const CODE_TTL_MINUTES = 5

function codeFromBucket(bucket, secret) {
  const hash = crypto.createHash('sha256').update(`${secret}:${bucket}`).digest('hex')
  const numeric = (parseInt(hash.slice(0, 12), 16) % 1000000).toString().padStart(6, '0')
  return numeric
}

export function generateWechatCode(nowMs = Date.now()) {
  const secret = process.env.WECHAT_CODE_SECRET || process.env.WECHAT_TOKEN || 'fulcrum'
  const bucketSizeMs = CODE_TTL_MINUTES * 60 * 1000
  const bucket = Math.floor(nowMs / bucketSizeMs)
  return codeFromBucket(bucket, secret)
}

export function verifyWechatCode(code, nowMs = Date.now()) {
  if (!/^\d{6}$/.test(String(code || ''))) {
    return false
  }

  const secret = process.env.WECHAT_CODE_SECRET || process.env.WECHAT_TOKEN || 'fulcrum'
  const bucketSizeMs = CODE_TTL_MINUTES * 60 * 1000
  const currentBucket = Math.floor(nowMs / bucketSizeMs)
  const input = String(code)

  // 允许当前桶和前一个桶，兼容时钟偏差
  const validCodes = [
    codeFromBucket(currentBucket, secret),
    codeFromBucket(currentBucket - 1, secret),
  ]

  return validCodes.includes(input)
}

export function getWechatCodeTtlMinutes() {
  return CODE_TTL_MINUTES
}

