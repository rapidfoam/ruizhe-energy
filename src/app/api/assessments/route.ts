import { NextRequest, NextResponse } from 'next/server';
import { createAssessmentRecord, listAssessmentRecords } from '@/lib/feishu/api';

/**
 * POST /api/assessments
 * 保存评估记录到飞书多维表格
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await createAssessmentRecord({
      city: body.city,
      climateZone: body.climateZone,
      buildingType: body.buildingType,
      wallBaseMaterial: body.wallBaseMaterial,
      wallInsulationMaterial: body.wallInsulationMaterial,
      wallInsulationThickness: body.wallInsulationThickness,
      wallKValue: body.wallKValue,
      wallLimit: body.wallLimit,
      wallCompliant: body.wallCompliant,
      roofBaseMaterial: body.roofBaseMaterial,
      roofInsulationMaterial: body.roofInsulationMaterial,
      roofInsulationThickness: body.roofInsulationThickness,
      roofKValue: body.roofKValue,
      roofLimit: body.roofLimit,
      roofCompliant: body.roofCompliant,
      windowType: body.windowType,
      windowKValue: body.windowKValue,
      windowLimit: body.windowLimit,
      windowCompliant: body.windowCompliant,
      rating: body.rating,
      score: body.score,
      phone: body.phone,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recordId: result.recordId || null,
    });
  } catch (error) {
    console.error('Failed to save assessment:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/assessments
 * 查询评估记录列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageToken = searchParams.get('page_token') || undefined;
    const pageSize = searchParams.get('page_size') ? parseInt(searchParams.get('page_size')!) : 20;
    const filter = searchParams.get('filter') || undefined;

    const result = await listAssessmentRecords({
      pageToken,
      pageSize,
      filter,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Failed to list assessments:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
