/**
 * 飞书多维表格 API 集成
 * 用于将评估数据写入飞书多维表格
 *
 * 环境变量：
 * - FEISHU_APP_ID: 飞书应用 ID
 * - FEISHU_APP_SECRET: 飞书应用密钥
 * - FEISHU_TABLE_APP_TOKEN: 多维表格 App Token
 * - FEISHU_TABLE_ID: 数据表 ID
 */

const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis';

interface TenantTokenResponse {
  code: number;
  msg: string;
  tenant_access_token: string;
  expire: number;
}

// Token 缓存（2小时有效期，提前5分钟刷新）
let cachedToken: string | null = null;
let tokenExpireAt: number = 0;

/**
 * 获取飞书 tenant_access_token（带缓存）
 */
async function getTenantAccessToken(): Promise<string | null> {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;

  if (!appId || !appSecret) {
    console.warn('[Feishu] Missing FEISHU_APP_ID or FEISHU_APP_SECRET');
    return null;
  }

  // 检查缓存的 token 是否仍然有效
  if (cachedToken && Date.now() < tokenExpireAt) {
    return cachedToken;
  }

  try {
    const response = await fetch(`${FEISHU_API_BASE}/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret,
      }),
    });

    const data: TenantTokenResponse = await response.json();

    if (data.code !== 0) {
      console.error('[Feishu] Failed to get tenant token:', data.msg);
      return null;
    }

    cachedToken = data.tenant_access_token;
    // 提前 5 分钟过期
    tokenExpireAt = Date.now() + (data.expire - 300) * 1000;

    return cachedToken;
  } catch (error) {
    console.error('[Feishu] Error getting tenant token:', error);
    return null;
  }
}

/**
 * 飞书多维表格字段映射
 * 字段名必须与多维表格中的列名严格匹配
 */
export interface FeishuAssessmentData {
  city: string;
  climateZone: string;
  buildingType: string;
  wallKValue: number;
  roofKValue: number;
  windowKValue: number;
  wallLimit: number;
  roofLimit: number;
  windowLimit: number;
  wallCompliant: boolean;
  roofCompliant: boolean;
  windowCompliant: boolean;
  rating: string;
  score: number;
  phone: string;
  wallConstruction?: string;
  roofConstruction?: string;
  windowType?: string;
  referralSource?: string;
}

/**
 * 构建飞书表格字段（严格匹配表格列名）
 */
function buildFields(data: FeishuAssessmentData): Record<string, unknown> {
  // 达标判定：综合三个部位（使用简洁文本，匹配飞书select选项）
  const allCompliant = data.wallCompliant && data.roofCompliant && data.windowCompliant;
  const noneCompliant = !data.wallCompliant && !data.roofCompliant && !data.windowCompliant;
  let complianceText: string;
  if (allCompliant) {
    complianceText = '全部达标';
  } else if (noneCompliant) {
    complianceText = '未达标';
  } else {
    complianceText = '部分达标';
  }

  // 评级文本
  const ratingMap: Record<string, string> = {
    'A': 'A 优秀',
    'B': 'B 良好',
    'C': 'C 合格',
    'D': 'D 不合格',
    'E': 'E 不合格',
  };

  // 评估时间：飞书日期字段需要 Unix 毫秒时间戳
  const assessmentTime = Date.now();

  // K值和限值确保为数字类型（飞书数字字段要求）
  const wallK = Number(data.wallKValue);
  const roofK = Number(data.roofKValue);
  const windowK = Number(data.windowKValue);
  const wallLimit = Number(data.wallLimit);
  const roofLimit = Number(data.roofLimit);
  const windowLimit = Number(data.windowLimit);
  const score = Number(data.score);

  // 调试：打印转换后的K值
  console.info('[Feishu] K值转换结果:', JSON.stringify({
    '原始wallKValue': data.wallKValue,
    '转换后wallK': wallK,
    'isNaN': Number.isNaN(wallK),
    '原始roofKValue': data.roofKValue,
    '转换后roofK': roofK,
    '原始windowKValue': data.windowKValue,
    '转换后windowK': windowK,
  }));

  const fields: Record<string, unknown> = {
    '评估时间': assessmentTime,
    '城市': data.city,
    '气候分区': data.climateZone,
    '建筑类型': data.buildingType,
    '外墙K值': Number.isNaN(wallK) ? 0 : wallK,
    '屋面K值': Number.isNaN(roofK) ? 0 : roofK,
    '外窗K值': Number.isNaN(windowK) ? 0 : windowK,
    '外墙限值': Number.isNaN(wallLimit) ? 0 : wallLimit,
    '屋面限值': Number.isNaN(roofLimit) ? 0 : roofLimit,
    '外窗限值': Number.isNaN(windowLimit) ? 0 : windowLimit,
    '达标判定': complianceText,
    '评级': ratingMap[data.rating] || data.rating,
    '评分': score,
    '手机号': data.phone,
    '墙体构造': data.wallConstruction || '-',
    '屋面构造': data.roofConstruction || '-',
    '窗户类型': data.windowType || '-',
    '推荐来源': data.referralSource || '',
  };

  // 调试日志：打印原始数据和转换后的字段
  console.info('[Feishu] 原始K值数据:', {
    wallKValue: data.wallKValue,
    roofKValue: data.roofKValue,
    windowKValue: data.windowKValue,
    wallK,
    roofK,
    windowK,
    wallLimit,
    roofLimit,
    windowLimit,
  });
  console.info('[Feishu] 写入字段:', JSON.stringify(fields, null, 2));

  return fields;
}

/**
 * 写入评估记录到飞书多维表格（batch_create）
 */
export async function writeAssessmentToFeishu(
  data: FeishuAssessmentData
): Promise<{ success: boolean; recordId?: string; error?: string }> {
  // 未注册用户不写入
  if (!data.phone) {
    console.info('[Feishu] 无手机号，跳过飞书写入');
    return { success: true };
  }

  const token = await getTenantAccessToken();
  if (!token) {
    console.info('[Feishu] 飞书服务未配置，跳过数据写入');
    return { success: true };
  }

  const appToken = process.env.FEISHU_TABLE_APP_TOKEN;
  const tableId = process.env.FEISHU_TABLE_ID;

  if (!appToken || !tableId) {
    console.info('[Feishu] 表格配置不完整，跳过数据写入');
    return { success: true };
  }

  const fields = buildFields(data);

  try {
    const requestBody = {
      records: [{ fields }],
    };
    console.info('[Feishu] 发送请求体:', JSON.stringify(requestBody));
    
    const response = await fetch(
      `${FEISHU_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    const result = await response.json();

    if (result.code !== 0) {
      console.error('[Feishu] Failed to write record:', result.msg);
      return { success: false, error: result.msg };
    }

    const recordId = result.data?.records?.[0]?.record_id;
    console.info('[Feishu] Record written successfully:', recordId);
    return { success: true, recordId };
  } catch (error) {
    console.error('[Feishu] Error writing record:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * 更新已有记录的手机号字段
 */
export async function updateRecordPhone(
  recordId: string,
  phone: string
): Promise<{ success: boolean; error?: string }> {
  const token = await getTenantAccessToken();
  if (!token) {
    console.info('[Feishu] 飞书服务未配置，跳过更新手机号');
    return { success: true };
  }

  const appToken = process.env.FEISHU_TABLE_APP_TOKEN;
  const tableId = process.env.FEISHU_TABLE_ID;

  if (!appToken || !tableId) {
    console.info('[Feishu] 表格配置不完整，跳过更新手机号');
    return { success: true };
  }

  try {
    const response = await fetch(
      `${FEISHU_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fields: { '手机号': phone },
        }),
      }
    );

    const result = await response.json();

    if (result.code !== 0) {
      console.error('[Feishu] Failed to update phone:', result.msg);
      return { success: false, error: result.msg };
    }

    return { success: true };
  } catch (error) {
    console.error('[Feishu] Error updating phone:', error);
    return { success: false, error: 'Network error' };
  }
}
