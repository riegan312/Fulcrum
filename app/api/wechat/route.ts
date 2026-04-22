import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const signature = searchParams.get('signature') || ''
  const timestamp = searchParams.get('timestamp') || ''
  const nonce = searchParams.get('nonce') || ''
  const echostr = searchParams.get('echostr') || ''

  if (!signature || !timestamp || !nonce || !echostr) {
    return new NextResponse('Missing required query params.', { status: 400 })
  }

  const token = process.env.WECHAT_TOKEN || ''
  if (!token) {
    return new NextResponse('WECHAT_TOKEN is not configured.', { status: 500 })
  }

  const raw = [token, timestamp, nonce].sort().join('')
  const sha1 = createHash('sha1').update(raw).digest('hex')

  if (sha1 === signature) {
    // 必须原样返回 echostr，微信服务器才会通过校验
    return new NextResponse(echostr, { status: 200 })
  }

  return new NextResponse('Invalid signature.', { status: 401 })
}
