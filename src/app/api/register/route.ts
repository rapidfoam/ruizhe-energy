import { NextRequest, NextResponse } from 'next/server';
import { updateRecordPhone } from '@/lib/feishu/api';

/**
 * POST /api/register
 * 用户注册，更新飞书多维表格中对应记录的手机号
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, phone, recordId } = body;

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: '请输入有效的手机号' },
        { status: 400 }
      );
    }

    // 如果有 recordId，直接更新飞书记录
    if (recordId) {
      const result = await updateRecordPhone(recordId, phone);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: '注册成功',
        recordId,
      });
    }

    // 如果没有 recordId，返回成功但不更新飞书
    // 这种情况可能是用户在本地预览，没有保存到飞书
    return NextResponse.json({
      success: true,
      message: '注册成功',
    });
  } catch (error) {
    console.error('Failed to register:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
