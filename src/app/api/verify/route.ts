import { NextRequest, NextResponse } from 'next/server';

const FEISHU_APP_TOKEN = process.env.NEXT_PUBLIC_FEISHU_APP_TOKEN || 'ATibbU0SJaHxfGs5eOVc9QTpn3c';
const FEISHU_CERT_TABLE_ID = process.env.NEXT_PUBLIC_FEISHU_CERT_TABLE_ID || 'tbl8IuarwOjEUSyU';
const FEISHU_APP_ID = process.env.FEISHU_APP_ID || 'cli_a92be05faf789cd1';
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || 'jO6eBfaOT4BxL65l6yOBaT00tOTu8nri';

// 内联的字段值提取函数，处理飞书返回的数组格式
function extractField(field: unknown): string {
  if (!field) return '';
  if (Array.isArray(field)) {
    return field.map((item: { text?: string }) => item?.text || '').join('');
  }
  if (typeof field === 'string') return field;
  if (typeof field === 'number') return String(field);
  return '';
}

// 获取 tenant_access_token
async function getTenantToken(): Promise<string> {
  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: FEISHU_APP_ID,
      app_secret: FEISHU_APP_SECRET,
    }),
  });
  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`获取token失败: ${data.msg}`);
  }
  return data.tenant_access_token;
}

/**
 * GET /api/verify?certNo=RZ-NE-2026-XXXXX
 * 查询飞书认证记录表，按证书编号筛选
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const certNo = searchParams.get('certNo');

    if (!certNo) {
      return NextResponse.json(
        { success: false, error: '缺少证书编号参数' },
        { status: 400 }
      );
    }

    // 获取 token
    const token = await getTenantToken();
    console.log('[Verify] Got tenant token');

    // 调用飞书 search API
    const searchUrl = `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${FEISHU_CERT_TABLE_ID}/records/search`;
    
    const searchRes = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
          conjunction: 'and',
          conditions: [
            {
              field_name: '证书编号',
              operator: 'is',
              value: [certNo],
            },
          ],
        },
      }),
    });

    const searchData = await searchRes.json();
    console.log('[Verify] Feishu search response code:', searchData.code);

    if (searchData.code !== 0) {
      console.error('[Verify] Search failed:', searchData.msg);
      return NextResponse.json(
        { success: false, error: `查询失败: ${searchData.msg}` },
        { status: 500 }
      );
    }

    const items = searchData.data?.items || [];
    console.log('[Verify] Found records count:', items.length);

    if (items.length === 0) {
      return NextResponse.json({
        success: false,
        error: '未查询到该证书',
      });
    }

    const record = items[0];
    const fields = record.fields || {};
    
    // 调试输出：原始字段数据
    console.log('[Verify] Raw fields:', JSON.stringify(fields, null, 2));

    // 使用内联 extractField 提取每个字段
    const cert = {
      certNo: extractField(fields['证书编号']),
      certType: extractField(fields['认证类型']),
      address: extractField(fields['房屋地址']),
      area: extractField(fields['建筑面积']),
      city: extractField(fields['所在地区']),
      buildingType: extractField(fields['建筑类型']),
      applicantName: extractField(fields['申请人姓名']),
      phone: extractField(fields['手机号']),
      wallK: extractField(fields['外墙K值']),
      roofK: extractField(fields['屋面K值']),
      windowK: extractField(fields['外窗K值']),
      wallLimit: extractField(fields['外墙限值']),
      roofLimit: extractField(fields['屋面限值']),
      windowLimit: extractField(fields['外窗限值']),
      paymentStatus: extractField(fields['支付状态']),
      issueDate: extractField(fields['发证时间']),
    };

    // 调试输出：解析后结果
    console.log('[Verify] Parsed cert:', JSON.stringify(cert));

    return NextResponse.json({
      success: true,
      cert,
    });
  } catch (error) {
    console.error('[Verify] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
