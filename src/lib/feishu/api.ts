/**
 * 飞书多维表格 API 集成
 * 用于将评估数据写入飞书多维表格
 */

const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis';

interface TenantTokenResponse {
  code: number;
  msg: string;
  tenant_access_token: string;
  expire: number;
}

interface FeishuRecord {
  record_id?: string;
  fields: Record<string, unknown>;
}

interface FeishuListResponse {
  code: number;
  msg: string;
  data: {
    items: FeishuRecord[];
    total: number;
    page_token?: string;
    has_more: boolean;
  };
}

let cachedToken: string | null = null;
let tokenExpireAt: number = 0;

/**
 * 获取飞书 tenant_access_token
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
 * 新增评估记录到飞书多维表格
 */
export async function createAssessmentRecord(data: {
  city: string;
  climateZone: string;
  buildingType: string;
  wallBaseMaterial?: string;
  wallInsulationMaterial?: string;
  wallInsulationThickness?: number;
  wallKValue: number;
  wallLimit: number;
  wallCompliant: boolean;
  roofBaseMaterial?: string;
  roofInsulationMaterial?: string;
  roofInsulationThickness?: number;
  roofKValue: number;
  roofLimit: number;
  roofCompliant: boolean;
  windowType?: string;
  windowKValue: number;
  windowLimit: number;
  windowCompliant: boolean;
  rating: string;
  score: number;
  phone?: string;
}): Promise<{ success: boolean; recordId?: string; error?: string }> {
  const token = await getTenantAccessToken();
  if (!token) {
    return { success: false, error: 'Failed to get Feishu access token' };
  }

  const appToken = process.env.FEISHU_TABLE_APP_TOKEN;
  const tableId = process.env.FEISHU_TABLE_ID;

  if (!appToken || !tableId) {
    console.warn('[Feishu] Missing FEISHU_TABLE_APP_TOKEN or FEISHU_TABLE_ID');
    return { success: false, error: 'Missing table configuration' };
  }

  // 构建字段映射
  const fields: Record<string, unknown> = {
    '评估时间': new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    '城市': data.city,
    '气候分区': data.climateZone,
    '建筑类型': data.buildingType,
    '外墙构造': data.wallBaseMaterial && data.wallInsulationMaterial
      ? `${data.wallBaseMaterial} + ${data.wallInsulationMaterial} ${data.wallInsulationThickness || 0}mm`
      : '-',
    '外墙K值': data.wallKValue,
    '外墙限值': data.wallLimit,
    '外墙判定': data.wallCompliant ? '达标' : '超标',
    '屋面构造': data.roofBaseMaterial && data.roofInsulationMaterial
      ? `${data.roofBaseMaterial} + ${data.roofInsulationMaterial} ${data.roofInsulationThickness || 0}mm`
      : '-',
    '屋面K值': data.roofKValue,
    '屋面限值': data.roofLimit,
    '屋面判定': data.roofCompliant ? '达标' : '超标',
    '外窗类型': data.windowType || '-',
    '外窗K值': data.windowKValue,
    '外窗限值': data.windowLimit,
    '外窗判定': data.windowCompliant ? '达标' : '超标',
    '综合评级': data.rating,
    '评分': data.score,
    '手机号': data.phone || '',
  };

  try {
    const response = await fetch(
      `${FEISHU_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ fields }),
      }
    );

    const result = await response.json();

    if (result.code !== 0) {
      console.error('[Feishu] Failed to create record:', result.msg);
      return { success: false, error: result.msg };
    }

    return { success: true, recordId: result.data?.record?.record_id };
  } catch (error) {
    console.error('[Feishu] Error creating record:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * 更新评估记录的手机号
 */
export async function updateRecordPhone(
  recordId: string,
  phone: string
): Promise<{ success: boolean; error?: string }> {
  const token = await getTenantAccessToken();
  if (!token) {
    return { success: false, error: 'Failed to get Feishu access token' };
  }

  const appToken = process.env.FEISHU_TABLE_APP_TOKEN;
  const tableId = process.env.FEISHU_TABLE_ID;

  if (!appToken || !tableId) {
    return { success: false, error: 'Missing table configuration' };
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
      console.error('[Feishu] Failed to update record:', result.msg);
      return { success: false, error: result.msg };
    }

    return { success: true };
  } catch (error) {
    console.error('[Feishu] Error updating record:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * 查询评估记录列表
 */
export async function listAssessmentRecords(options?: {
  pageToken?: string;
  pageSize?: number;
  filter?: string;
}): Promise<{ success: boolean; data?: FeishuListResponse['data']; error?: string }> {
  const token = await getTenantAccessToken();
  if (!token) {
    return { success: false, error: 'Failed to get Feishu access token' };
  }

  const appToken = process.env.FEISHU_TABLE_APP_TOKEN;
  const tableId = process.env.FEISHU_TABLE_ID;

  if (!appToken || !tableId) {
    return { success: false, error: 'Missing table configuration' };
  }

  const params = new URLSearchParams();
  if (options?.pageToken) params.set('page_token', options.pageToken);
  if (options?.pageSize) params.set('page_size', String(options.pageSize));
  if (options?.filter) params.set('filter', options.filter);

  try {
    const response = await fetch(
      `${FEISHU_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const result: FeishuListResponse = await response.json();

    if (result.code !== 0) {
      console.error('[Feishu] Failed to list records:', result.msg);
      return { success: false, error: result.msg };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('[Feishu] Error listing records:', error);
    return { success: false, error: 'Network error' };
  }
}
