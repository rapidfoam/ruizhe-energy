import { NextRequest, NextResponse } from 'next/server';

const WX_APPID = process.env.WX_MINI_APPID || 'wx3086ef5ed0144af7';
const WX_SECRET = process.env.WX_MINI_SECRET || 'c40494bc597f8456b3ba19ec3771c7a7';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ success: false, error: '缺少wx.login code' }, { status: 400 });
    }

    const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${WX_APPID}&secret=${WX_SECRET}&js_code=${code}&grant_type=authorization_code`;
    const wxRes = await fetch(wxUrl);
    const wxData = await wxRes.json();

    if (wxData.errcode) {
      console.error('微信code2Session失败:', wxData);
      return NextResponse.json({ success: false, error: `微信接口错误: ${wxData.errmsg}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, openid: wxData.openid });
  } catch (err) {
    console.error('login API异常:', err);
    return NextResponse.json({ success: false, error: '服务器异常' }, { status: 500 });
  }
}
