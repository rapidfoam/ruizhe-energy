import { NextRequest, NextResponse } from 'next/server';
import { writeCertification } from '@/lib/feishu/api';
import { generateCertNo } from '@/lib/utils';

/**
 * POST /api/certify
 * 处理认证申请，生成证书编号并写入飞书认证记录表
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证必填字段
    if (!body.address || !body.area || !body.applicantName || !body.phone) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 生成证书编号
    const certType = body.certType || 'energy';
    const certNo = generateCertNo(certType);

    // 写入飞书认证记录表
    const result = await writeCertification({
      certNo,
      certType: certType === 'energy' ? '筑能·建筑节能评估' : '筑静·建筑隔音评估',
      address: body.address,
      area: Number(body.area),
      city: body.city || '',
      buildingType: body.buildingType || '',
      applicantName: body.applicantName,
      phone: body.phone,
      wallK: Number(body.wallK) || 0,
      roofK: Number(body.roofK) || 0,
      windowK: Number(body.windowK) || 0,
      wallLimit: Number(body.wallLimit) || 0,
      roofLimit: Number(body.roofLimit) || 0,
      windowLimit: Number(body.windowLimit) || 0,
      paymentStatus: '已支付',
    });

    if (!result.success) {
      console.warn('[Certify] 飞书写入失败，静默处理:', result.error);
    }

    return NextResponse.json({
      success: true,
      certNo,
      feishuRecordId: result.recordId || null,
      feishuWritten: result.success && !!result.recordId,
    });
  } catch (error) {
    console.error('[Certify] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
