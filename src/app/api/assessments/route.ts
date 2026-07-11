import { NextRequest, NextResponse } from 'next/server';
import { createAssessment, getAssessments, AssessmentRecord } from '@/lib/db/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['session_id', 'city', 'climate_zone', 'building_type'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    const record: AssessmentRecord = {
      session_id: body.session_id,
      city: body.city,
      climate_zone: body.climate_zone,
      building_type: body.building_type,
      wall_base_material: body.wall_base_material,
      wall_base_thickness: body.wall_base_thickness,
      wall_insulation_material: body.wall_insulation_material,
      wall_insulation_thickness: body.wall_insulation_thickness,
      wall_k_value: body.wall_k_value,
      wall_standard_limit: body.wall_standard_limit,
      wall_compliant: body.wall_compliant,
      roof_base_material: body.roof_base_material,
      roof_base_thickness: body.roof_base_thickness,
      roof_insulation_material: body.roof_insulation_material,
      roof_insulation_thickness: body.roof_insulation_thickness,
      roof_k_value: body.roof_k_value,
      roof_standard_limit: body.roof_standard_limit,
      roof_compliant: body.roof_compliant,
      window_type: body.window_type,
      window_k_value: body.window_k_value,
      window_standard_limit: body.window_standard_limit,
      window_compliant: body.window_compliant,
      overall_rating: body.overall_rating,
      overall_score: body.overall_score,
      phone: body.phone,
      heat_loss_wall: body.heat_loss_wall,
      heat_loss_roof: body.heat_loss_roof,
      heat_loss_window: body.heat_loss_window,
      heat_loss_ventilation: body.heat_loss_ventilation,
    };
    
    const id = createAssessment(record);
    
    return NextResponse.json({ 
      success: true, 
      id,
      message: 'Assessment saved successfully' 
    });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to save assessment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const rating = searchParams.get('rating') || undefined;
    const phone = searchParams.get('phone') || undefined;
    
    const result = getAssessments({
      page,
      pageSize,
      startDate,
      endDate,
      rating,
      phone,
    });
    
    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}
