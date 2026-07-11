import { NextRequest, NextResponse } from 'next/server';
import { updateRecordPhone } from '@/lib/feishu/api';
import { sendVerificationCode, generateVerificationCode, isSmsEnabled } from '@/lib/sms/api';

// 内存存储验证码（生产环境应使用 Redis）
const verificationCodes = new Map<string, { code: string; expires: number }>();

/**
 * POST /api/auth/register
 * 统一注册接口
 * 
 * 流程：
 * 1. 短信服务未配置（默认）：直接通过手机号注册，无需验证码
 * 2. 短信服务已配置（ALIBABA_CLOUD_* 环境变量存在）：
 *    - action="send"：发送验证码到手机
 *    - action="verify"：校验验证码并完成注册
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, recordId, action, code } = body;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: '请输入有效的手机号' },
        { status: 400 }
      );
    }

    // 短信服务已启用时，需要验证码流程
    if (isSmsEnabled()) {
      if (action === 'send') {
        const verifyCode = generateVerificationCode();
        const result = await sendVerificationCode(phone, verifyCode);

        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error || '验证码发送失败' },
            { status: 500 }
          );
        }

        // 存储验证码，5分钟有效
        verificationCodes.set(phone, {
          code: verifyCode,
          expires: Date.now() + 5 * 60 * 1000,
        });

        return NextResponse.json({
          success: true,
          message: '验证码已发送',
        });
      }

      if (action === 'verify') {
        const stored = verificationCodes.get(phone);
        if (!stored) {
          return NextResponse.json(
            { success: false, error: '请先获取验证码' },
            { status: 400 }
          );
        }

        if (Date.now() > stored.expires) {
          verificationCodes.delete(phone);
          return NextResponse.json(
            { success: false, error: '验证码已过期，请重新获取' },
            { status: 400 }
          );
        }

        if (stored.code !== code) {
          return NextResponse.json(
            { success: false, error: '验证码错误' },
            { status: 400 }
          );
        }

        // 验证通过，删除验证码
        verificationCodes.delete(phone);
      } else {
        return NextResponse.json(
          { success: false, error: '请提供验证码' },
          { status: 400 }
        );
      }
    }

    // 短信服务未启用或验证码已验证通过，完成注册
    if (recordId) {
      const result = await updateRecordPhone(recordId, phone);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: '注册成功',
      smsEnabled: isSmsEnabled(),
    });
  } catch (error) {
    console.error('Failed to register:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
