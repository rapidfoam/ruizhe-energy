import { NextRequest, NextResponse } from 'next/server';
import { writeAssessmentToFeishu } from '@/lib/feishu/api';

/**
 * POST /api/assessments
 * 保存评估记录（兼容旧接口，内部转发到飞书写入）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 构造墙体/屋面构造描述
    const wallConstruction = body.wallBaseMaterial && body.wallInsulationMaterial
      ? `${body.wallBaseMaterial} + ${body.wallInsulationMaterial} ${body.wallInsulationThickness || 0}mm`
      : '-';
    const roofConstruction = body.roofBaseMaterial && body.roofInsulationMaterial
      ? `${body.roofBaseMaterial} + ${body.roofInsulationMaterial} ${body.roofInsulationThickness || 0}mm`
      : '-';

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
      phone: body.phone || '',
      wallConstruction,
      roofConstruction,
      windowType: body.windowType || '',
    });

    return NextResponse.json({
      success: true,
      recordId: result.recordId || null,
    });
  } catch (error) {
    console.error('Failed to save assessment:', error);
    return NextResponse.json(
      { success: true, recordId: null },
    );
  }
}

/**
 * GET /api/assessments
 * 查询评估记录（占位，返回空列表）
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: [],
  });
}
