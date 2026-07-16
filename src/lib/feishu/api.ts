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
export async function getTenantAccessToken(): Promise<string | null> {
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
export function buildFields(data: FeishuAssessmentData): Record<string, unknown> {
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

// ==================== 认证记录写入 ====================

export interface FeishuCertificationData {
  certNo: string;
  certType: string;
  address: string;
  area: number;
  city: string;
  buildingType: string;
  applicantName: string;
  phone: string;
  wallK: number;
  roofK: number;
  windowK: number;
  wallLimit: number;
  roofLimit: number;
  windowLimit: number;
  paymentStatus?: string;
}

function buildCertFields(data: FeishuCertificationData): Record<string, unknown> {
  return {
    '证书编号': data.certNo,
    '认证类型': data.certType,
    '房屋地址': data.address,
    '建筑面积': String(data.area),
    '所在地区': data.city,
    '建筑类型': data.buildingType,
    '申请人姓名': data.applicantName,
    '手机号': data.phone,
    '外墙K值': String(data.wallK),
    '屋面K值': String(data.roofK),
    '外窗K值': String(data.windowK),
    '外墙限值': String(data.wallLimit),
    '屋面限值': String(data.roofLimit),
    '外窗限值': String(data.windowLimit),
    '支付状态': data.paymentStatus || '待支付',
    '申请时间': new Date().toLocaleString('zh-CN'),
    '发证时间': '',
  };
}

export async function writeCertification(
  data: FeishuCertificationData
): Promise<{ success: boolean; recordId?: string; error?: string }> {
  const token = await getTenantAccessToken();
  if (!token) {
    console.warn('[Feishu] tenant_access_token 获取失败，认证记录跳过写入');
    return { success: false, error: 'token_failed' };
  }

  const appToken = process.env.FEISHU_TABLE_APP_TOKEN || '';
  const tableId = process.env.NEXT_PUBLIC_FEISHU_CERT_TABLE_ID || 'tbl8IuarwOjEUSyU';

  if (!appToken) {
    console.warn('[Feishu] FEISHU_TABLE_APP_TOKEN 未配置，认证记录跳过写入');
    return { success: false, error: 'no_config' };
  }

  const fields = buildCertFields(data);
  console.info('[Feishu] 认证记录写入字段:', JSON.stringify(fields));

  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        records: [{ fields }],
      }),
    });

    const json = await resp.json();

    if (json.code === 0 && json.data?.records?.length > 0) {
      const recordId = json.data.records[0].record_id;
      console.info('[Feishu] 认证记录写入成功:', recordId);
      return { success: true, recordId };
    } else {
      console.error('[Feishu] 认证记录写入失败:', json.code, json.msg);
      return { success: false, error: json.msg || 'unknown' };
    }
  } catch (err) {
    console.error('[Feishu] 认证记录写入异常:', err);
    return { success: false, error: 'network_error' };
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

// ==================== 飞书字段值提取工具 ====================

/**
 * 从飞书多维表格字段值中提取文本
 * 飞书文本字段返回格式: [{text: 'xxx', type: 'text'}]
 * 数字字段返回格式: number
 * 其他字段可能返回 string 或其他类型
 */
function extractFeishuFieldValue(field: unknown): string {
  if (field === null || field === undefined) return '';
  if (Array.isArray(field)) {
    return field.map((item: { text?: string }) => item?.text || '').join('');
  }
  if (typeof field === 'string') return field;
  if (typeof field === 'number') return String(field);
  return String(field);
}

// ==================== 认证记录查询 ====================

export interface CertificationRecord {
  certNo: string;
  certType: string;
  address: string;
  area: string;
  city: string;
  buildingType: string;
  applicantName: string;
  phone: string;
  wallK: string;
  roofK: string;
  windowK: string;
  wallLimit: string;
  roofLimit: string;
  windowLimit: string;
  paymentStatus: string;
  issueDate: string;
  score?: string;
}

/**
 * 按证书编号查询认证记录
 */
export async function searchCertification(
  certNo: string
): Promise<{ success: boolean; cert?: CertificationRecord; error?: string }> {
  const token = await getTenantAccessToken();
  if (!token) {
    console.warn('[Feishu] tenant_access_token 获取失败，无法查询认证记录');
    return { success: false, error: 'token_failed' };
  }

  const appToken = process.env.FEISHU_TABLE_APP_TOKEN || '';
  const tableId = process.env.NEXT_PUBLIC_FEISHU_CERT_TABLE_ID || 'tbl8IuarwOjEUSyU';

  if (!appToken) {
    console.warn('[Feishu] FEISHU_TABLE_APP_TOKEN 未配置，无法查询认证记录');
    return { success: false, error: 'no_config' };
  }

  const url = `${FEISHU_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records/search`;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        filter: {
          conjunction: 'and',
          conditions: [
            {
              field_name: '证书编号',
              operator: 'is',
              value: [certNo],
            },
          ],
        },
      }),
    });

    const json = await resp.json();

    if (json.code !== 0) {
      console.error('[Feishu] 查询认证记录失败:', json.code, json.msg);
      return { success: false, error: json.msg || 'search_failed' };
    }

    const items = json.data?.items || [];
    if (items.length === 0) {
      return { success: false, error: 'not_found' };
    }

    const fields = items[0].fields as Record<string, unknown>;
    const cert: CertificationRecord = {
      certNo: extractFeishuFieldValue(fields['证书编号']),
      certType: extractFeishuFieldValue(fields['认证类型']),
      address: extractFeishuFieldValue(fields['房屋地址']),
      area: extractFeishuFieldValue(fields['建筑面积']),
      city: extractFeishuFieldValue(fields['所在地区']),
      buildingType: extractFeishuFieldValue(fields['建筑类型']),
      applicantName: extractFeishuFieldValue(fields['申请人姓名']),
      phone: extractFeishuFieldValue(fields['手机号']),
      wallK: extractFeishuFieldValue(fields['外墙K值']),
      roofK: extractFeishuFieldValue(fields['屋面K值']),
      windowK: extractFeishuFieldValue(fields['外窗K值']),
      wallLimit: extractFeishuFieldValue(fields['外墙限值']),
      roofLimit: extractFeishuFieldValue(fields['屋面限值']),
      windowLimit: extractFeishuFieldValue(fields['外窗限值']),
      paymentStatus: extractFeishuFieldValue(fields['支付状态']),
      issueDate: extractFeishuFieldValue(fields['发证时间']),
    };

    console.info('[Feishu] 查询到认证记录:', cert.certNo);
    return { success: true, cert };
  } catch (err) {
    console.error('[Feishu] 查询认证记录异常:', err);
    return { success: false, error: 'network_error' };
  }
}
