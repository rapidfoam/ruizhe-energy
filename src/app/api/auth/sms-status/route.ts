import { NextResponse } from 'next/server';
import { isSmsEnabled } from '@/lib/sms/api';

/**
 * GET /api/auth/sms-status
 * 返回短信验证码服务是否已启用
 * 
 * 当以下环境变量全部配置时返回 smsEnabled: true：
 * - ALIBABA_CLOUD_ACCESS_KEY_ID
 * - ALIBABA_CLOUD_ACCESS_KEY_SECRET
 * - SMS_SIGN_NAME
 * - SMS_TEMPLATE_CODE
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    smsEnabled: isSmsEnabled(),
  });
}
