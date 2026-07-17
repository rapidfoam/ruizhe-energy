import { NextRequest, NextResponse } from 'next/server';

const WX_APPID = process.env.WX_MINI_APPID || 'wx3086ef5ed0144af7';
const WX_SECRET = process.env.WX_MINI_SECRET || 'c40494bc597f8456b3ba19ec3771c7a7';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 300000) {
    return cachedToken.token;
  }

  const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WX_APPID}&secret=${WX_SECRET}`;
  const res = await fetch(tokenUrl);
  const data = await res.json();

  if (data.errcode) {
    throw new Error(`获取access_token失败: ${data.errmsg}`);
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 7200) * 1000
  };

  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ success: false, error: '缺少getPhoneNumber code' }, { status: 400 });
    }

    const accessToken = await getAccessToken();
    const phoneUrl = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`;
    const phoneRes = await fetch(phoneUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    const phoneData = await phoneRes.json();

    if (phoneData.errcode !== 0) {
      console.error('获取手机号失败:', phoneData);
      return NextResponse.json({ success: false, error: `微信接口错误: ${phoneData.errmsg}` }, { status: 400 });
    }

    const phoneInfo = phoneData.phone_info;
    return NextResponse.json({
      success: true,
      phoneNumber: phoneInfo.phoneNumber,
      purePhoneNumber: phoneInfo.purePhoneNumber,
      countryCode: phoneInfo.countryCode
    });
  } catch (err) {
    console.error('getphone API异常:', err);
    return NextResponse.json({ success: false, error: '服务器异常' }, { status: 500 });
  }
}
