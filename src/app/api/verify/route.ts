import { NextRequest, NextResponse } from 'next/server';
import { searchCertification } from '@/lib/feishu/api';

/**
 * GET /api/verify?certNo=RZ-NE-2026-XXXXX
 * 查询认证记录
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

    // 格式校验
    if (!/^RZ-(NE|AC)-\d{4}-\d{5}$/.test(certNo)) {
      return NextResponse.json(
        { success: false, error: '证书编号格式错误' },
        { status: 400 }
      );
    }

    const result = await searchCertification(certNo);

    if (result.success && result.cert) {
      return NextResponse.json({
        success: true,
        cert: result.cert,
      });
    }

    return NextResponse.json({
      success: false,
      error: '未查询到该证书',
    });
  } catch (error) {
    console.error('[Verify] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
