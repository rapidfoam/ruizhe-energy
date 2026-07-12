import { NextRequest, NextResponse } from 'next/server';
import { writeAssessmentToFeishu } from '@/lib/feishu/api';

/**
 * POST /api/feishu/write
 * 将评估数据写入飞书多维表格
 *
 * 写入失败不影响用户体验，静默处理错误
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证必填字段
    if (!body.phone) {
      return NextResponse.json(
        { success: false, error: '缺少手机号，无法写入' },
        { status: 400 }
      );
    }

    const result = await writeAssessmentToFeishu({
      city: body.city || '',
      climateZone: body.climateZone || '',
      buildingType: body.buildingType || '',
      wallKValue: body.wallKValue ?? 0,
      roofKValue: body.roofKValue ?? 0,
      windowKValue: body.windowKValue ?? 0,
      wallLimit: body.wallLimit ?? 0,
      roofLimit: body.roofLimit ?? 0,
      windowLimit: body.windowLimit ?? 0,
      wallCompliant: body.wallCompliant ?? false,
      roofCompliant: body.roofCompliant ?? false,
      windowCompliant: body.windowCompliant ?? false,
      rating: body.rating || '',
      score: body.score ?? 0,
      phone: body.phone,
      wallConstruction: body.wallConstruction || '',
      roofConstruction: body.roofConstruction || '',
      windowType: body.windowType || '',
    });

    // 无论飞书写入成功与否，都返回 success: true
    // 写入失败静默处理，不影响用户体验
    if (!result.success) {
      console.warn('[Feishu Write] 飞书写入失败，静默处理:', result.error);
    }

    return NextResponse.json({
      success: true,
      feishuRecordId: result.recordId || null,
      feishuWritten: result.success && !!result.recordId,
    });
  } catch (error) {
    // 静默处理所有错误，不影响用户体验
    console.error('[Feishu Write] Unexpected error:', error);
    return NextResponse.json({
      success: true,
      feishuWritten: false,
    });
  }
}
