/**
 * 阿里云短信服务 API 预留模块
 *
 * 当以下环境变量配置后，将启用真实短信验证码服务：
 * - ALIBABA_CLOUD_ACCESS_KEY_ID: 阿里云 AccessKey ID
 * - ALIBABA_CLOUD_ACCESS_KEY_SECRET: 阿里云 AccessKey Secret
 * - SMS_SIGN_NAME: 短信签名（如"睿筑科技"）
 * - SMS_TEMPLATE_CODE: 短信模板 Code（如 SMS_123456789）
 *
 * 未配置时，sendVerificationCode() 返回 { success: true, mock: true }，
 * 表示跳过验证码直接通过。
 */

const SMS_ENABLED = !!(
  process.env.ALIBABA_CLOUD_ACCESS_KEY_ID &&
  process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET &&
  process.env.SMS_SIGN_NAME &&
  process.env.SMS_TEMPLATE_CODE
);

/**
 * 发送短信验证码
 * @param phone 手机号
 * @param code 验证码（6位数字）
 */
export async function sendVerificationCode(
  phone: string,
  code: string
): Promise<{ success: boolean; mock?: boolean; error?: string }> {
  // 未配置短信服务时，直接返回成功（跳过验证码）
  if (!SMS_ENABLED) {
    console.info('[SMS] 短信服务未配置，跳过验证码发送');
    return { success: true, mock: true };
  }

  try {
    // 阿里云短信 API 调用（预留实现）
    // 实际部署时需安装 @alicloud/dysmsapi20170525 和 @alicloud/openapi-client
    const response = await fetch('https://dysmsapi.aliyuncs.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-acs-action': 'SendSms',
        'x-acs-version': '2017-05-25',
      },
      body: JSON.stringify({
        PhoneNumbers: phone,
        SignName: process.env.SMS_SIGN_NAME,
        TemplateCode: process.env.SMS_TEMPLATE_CODE,
        TemplateParam: JSON.stringify({ code }),
      }),
    });

    const data = await response.json();

    if (data.Code === 'OK') {
      return { success: true };
    }

    console.error('[SMS] 发送失败:', data.Message);
    return { success: false, error: data.Message || '短信发送失败' };
  } catch (error) {
    console.error('[SMS] 网络错误:', error);
    return { success: false, error: '网络错误，请稍后重试' };
  }
}

/**
 * 生成6位数字验证码
 */
export function generateVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * 检查短信服务是否已启用
 */
export function isSmsEnabled(): boolean {
  return SMS_ENABLED;
}
