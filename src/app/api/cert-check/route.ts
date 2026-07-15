import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/cert-check?certNo=RZ-NE-2026-XXXXX
 * 全新路径，完全内联逻辑，不依赖任何外部模块
 */

// 内联辅助函数：提取飞书字段值
function extractField(field: unknown): string {
  if (!field) return '';
  if (Array.isArray(field)) {
    // 飞书text字段返回 [{text: 'xxx', type: 'text'}]
    const first = field[0];
    if (first && typeof first === 'object' && 'text' in first) {
      return (first as { text: string }).text || '';
    }
    return field.map(f => String(f)).join('');
  }
  if (typeof field === 'string') return field;
  if (typeof field === 'number') return String(field);
  return '';
}

// 内联：获取 tenant_access_token
async function getTenantToken(): Promise<string> {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error('Missing FEISHU_APP_ID or FEISHU_APP_SECRET');
  }

  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });

  const data = await res.json();
  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`Failed to get tenant token: ${data.msg}`);
  }
  return data.tenant_access_token;
}

export async function GET(request: NextRequest) {
  const certNo = request.nextUrl.searchParams.get('certNo')?.trim();
  
  if (!certNo) {
    return NextResponse.json(
      { success: false, error: '缺少证书编号参数' },
      { status: 400 }
    );
  }

  try {
    // Step 1: 获取 token
    const token = await getTenantToken();

    // Step 2: 调用飞书 search API
    const appToken = process.env.FEISHU_TABLE_APP_TOKEN || 'ATibbU0SJaHxfGs5eOVc9QTpn3c';
    const tableId = process.env.NEXT_PUBLIC_FEISHU_CERT_TABLE_ID || 'tbl8IuarwOjEUSyU';

    const searchUrl = `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/search`;
    
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
    console.log('[CertCheck] Feishu response:', JSON.stringify(searchData));

    if (searchData.code !== 0) {
      console.error('[CertCheck] Feishu API error:', searchData.msg);
      return NextResponse.json(
        { success: false, error: '飞书API调用失败' },
        { status: 500 }
      );
    }

    const items = searchData.data?.items || [];
    if (items.length === 0) {
      return NextResponse.json({ success: false, error: '未查询到该证书' });
    }

    // Step 3: 解析字段（完全内联提取逻辑）
    const fields = items[0].fields;
    console.log('[CertCheck] Raw fields:', JSON.stringify(fields));

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

    console.log('[CertCheck] Parsed cert:', JSON.stringify(cert));

    return NextResponse.json({ success: true, cert });
  } catch (error) {
    console.error('[CertCheck] Error:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
