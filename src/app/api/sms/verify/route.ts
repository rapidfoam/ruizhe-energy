import { NextRequest, NextResponse } from 'next/server';
import { verifySmsCode, updateAssessmentPhone } from '@/lib/db/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code, sessionId } = body;
    
    // Validate inputs
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }
    
    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }
    
    // Verify the code
    const isValid = verifySmsCode(phone, code);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }
    
    // Update assessment records with phone number
    if (sessionId) {
      updateAssessmentPhone(sessionId, phone);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Phone verified successfully',
      phone,
    });
  } catch (error) {
    console.error('Error verifying SMS:', error);
    return NextResponse.json(
      { error: 'Failed to verify SMS' },
      { status: 500 }
    );
  }
}
