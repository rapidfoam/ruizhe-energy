import { NextRequest, NextResponse } from 'next/server';
import { saveSmsCode } from '@/lib/db/database';

// Check if SMS service is configured
function isSmsConfigured(): boolean {
  return !!(
    process.env.ALIBABA_CLOUD_ACCESS_KEY_ID &&
    process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET &&
    process.env.SMS_SIGN_NAME &&
    process.env.SMS_TEMPLATE_CODE
  );
}

// Generate random 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send SMS via Alibaba Cloud
async function sendSmsViaAlibaba(phone: string, code: string): Promise<boolean> {
  try {
    // Dynamic import to avoid build errors when package is not installed
    const Dysmsapi = await import('@alicloud/dysmsapi20170525');
    const OpenApi = await import('@alicloud/openapi-client');
    const Util = await import('@alicloud/tea-util');
    
    const config = new OpenApi.Config({
      accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    });
    config.endpoint = 'dysmsapi.aliyuncs.com';
    
    const client = new Dysmsapi.default(config);
    
    const sendSmsRequest = new Dysmsapi.SendSmsRequest({
      phoneNumbers: phone,
      signName: process.env.SMS_SIGN_NAME,
      templateCode: process.env.SMS_TEMPLATE_CODE,
      templateParam: JSON.stringify({ code }),
    });
    
    const runtime = new Util.RuntimeOptions({});
    await client.sendSmsWithOptions(sendSmsRequest, runtime);
    
    return true;
  } catch (error) {
    console.error('SMS send error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;
    
    // Validate phone number
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }
    
    const code = generateCode();
    
    if (isSmsConfigured()) {
      // Send real SMS
      const success = await sendSmsViaAlibaba(phone, code);
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to send SMS' },
          { status: 500 }
        );
      }
    }
    
    // Save code to database (for verification)
    saveSmsCode(phone, code);
    
    // In development mode, return the code for testing
    if (!isSmsConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'SMS code sent (development mode)',
        code, // Only return code in development mode
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'SMS code sent',
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
}
