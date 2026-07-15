// Updated: 2026-07-15-v3
import { NextRequest, NextResponse } from 'next/server';

const FEISHU_APP_TOKEN = process.env.NEXT_PUBLIC_FEISHU_APP_TOKEN || 'ATibbU0SJaHxfGs5eOVc9QTpn3c';
const FEISHU_CERT_TABLE_ID = process.env.NEXT_PUBLIC_FEISHU_CERT_TABLE_ID || 'tbl8IuarwOjEUSyU';
const FEISHU_APP_ID = process.env.FEISHU_APP_ID || 'cli_a92be05faf789cd1';
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || 'jO6eBfaOT4BxL65l6yOBaT00tOTu8nri';

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

// 提取字段值 - list API 返回的字段可能是简单值或数组格式
function extractFieldValue(field: unknown): string {
  if (!field) return '';
  // 如果是数组格式 [{text: 'xxx', type: 'text'}]
  if (Array.isArray(field)) {
    return field.map((item: { text?: string }) => item?.text || '').join('');
  }
  // 如果是简单字符串或数字
  if (typeof field === 'string') return field;
  if (typeof field === 'number') return String(field);
  // 其他情况转为字符串
  return String(field);
}

/**
 * GET /api/verify?certNo=RZ-NE-2026-XXXXX
 * 使用飞书 list API 查询认证记录
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
    console.log('[Verify-v3] Got tenant token');

    // 使用 list API + filter 参数
    // 格式: filter=CurrentValue.[字段名]="值" (文本字段需要引号)
    const filterParam = encodeURIComponent(`CurrentValue.[证书编号]="${certNo}"`);
    const listUrl = `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${FEISHU_CERT_TABLE_ID}/records?filter=${filterParam}`;
    
    console.log('[Verify-v3] Calling list API:', listUrl);

    const listRes = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const listData = await listRes.json();
    console.log('[Verify-v3] List API response code:', listData.code);

    if (listData.code !== 0) {
      console.error('[Verify-v3] List API failed:', listData.msg);
      return NextResponse.json(
        { success: false, error: `查询失败: ${listData.msg}` },
        { status: 500 }
      );
    }

    const items = listData.data?.items || [];
    console.log('[Verify-v3] Found records count:', items.length);

    if (items.length === 0) {
      return NextResponse.json({
        success: false,
        error: '未查询到该证书',
      });
    }

    const record = items[0];
    const fields = record.fields || {};
    
    // 调试输出：原始字段数据
    console.log('[Verify-v3] Raw fields:', JSON.stringify(fields));

    // 提取每个字段值
    const cert = {
      certNo: extractFieldValue(fields['证书编号']),
      certType: extractFieldValue(fields['认证类型']),
      address: extractFieldValue(fields['房屋地址']),
      area: extractFieldValue(fields['建筑面积']),
      city: extractFieldValue(fields['所在地区']),
      buildingType: extractFieldValue(fields['建筑类型']),
      applicantName: extractFieldValue(fields['申请人姓名']),
      phone: extractFieldValue(fields['手机号']),
      wallK: extractFieldValue(fields['外墙K值']),
      roofK: extractFieldValue(fields['屋面K值']),
      windowK: extractFieldValue(fields['外窗K值']),
      wallLimit: extractFieldValue(fields['外墙限值']),
      roofLimit: extractFieldValue(fields['屋面限值']),
      windowLimit: extractFieldValue(fields['外窗限值']),
      paymentStatus: extractFieldValue(fields['支付状态']),
      issueDate: extractFieldValue(fields['发证时间']),
    };

    // 调试输出：解析后结果
    console.log('[Verify-v3] Parsed cert:', JSON.stringify(cert));

    return NextResponse.json({
      success: true,
      cert,
    });
  } catch (error) {
    console.error('[Verify-v3] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
