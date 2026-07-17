// POST /api/evaluate - 建筑节能评估计算API
// 接收建筑参数，调用计算引擎返回K值、评级、热损失分布

import { NextResponse } from "next/server";
import { CITIES, CLIMATE_ZONE_LABELS, type ClimateZone } from "@/lib/data/climate";
import { BUILDING_TYPES, getBuildingType, type BuildingType } from "@/lib/data/building-types";
import {
  WALL_TYPES,
  INSULATION_MATERIALS,
  ROOF_TYPES,
  ROOF_INSULATION_MATERIALS,
  WINDOW_CONFIGS,
} from "@/lib/data/materials";
import { getStandardLimits } from "@/lib/data/standards";
import {
  calculateWallK,
  calculateRoofK,
  calculateRating,
  estimateHeatLoss,
} from "@/lib/engine/calculator";
import {
  getTenantAccessToken,
  buildFields,
  type FeishuAssessmentData,
} from "@/lib/feishu/api";

// ── 外部参数 → 内部ID 映射 ──────────────────────────────

// 墙体类型（外部ID与内部ID一致，无需额外映射）
const WALL_TYPE_MAP: Record<string, string> = {
  solid_brick: "solid_brick",
  porous_brick: "porous_brick",
  aerated_concrete_block: "aerated_concrete_block",
  concrete_shear_wall: "concrete_shear_wall",
  hollow_concrete_block: "hollow_concrete_block",
  light_wood_wall: "light_wood_wall",
  light_steel_wall: "light_steel_wall",
};

// 屋面类型映射（外部 → 内部）
const ROOF_TYPE_MAP: Record<string, string> = {
  concrete_flat: "concrete_roof",
  concrete_roof: "concrete_roof",
  timber_roof: "timber_roof",
  wood_roof: "timber_roof",
  plywood_roof: "plywood_roof",
  osb_roof: "osb_roof",
  steel_deck: "steel_deck",
  steel_roof: "steel_deck",
  steel_truss_cement: "steel_truss_cement",
  aac_roof: "aac_roof",
  clay_tile_roof: "clay_tile_roof",
  tile_roof: "clay_tile_roof",
  cement_tile_roof: "cement_tile_roof",
  metal_roof: "metal_roof",
  light_wood_roof: "light_wood_roof",
  light_steel_roof: "light_steel_roof",
};

// 窗户类型映射（外部 → 内部）
const WINDOW_TYPE_MAP: Record<string, string> = {
  // 英文描述式ID（外部API常用）
  aluminum_sg: "single_alu",
  aluminum_dg: "double_alu",
  bridge_alu_dg: "double_bridge_alu",
  bridge_alu_low_e: "double_bridge_low_e",
  bridge_alu_triple: "triple_bridge_low_e",
  upvc_dg: "upvc_double",
  upvc_low_e: "upvc_low_e",
  wood_dg: "wood_double",
  // 内部ID透传（兼容直接传内部ID的场景）
  single_alu: "single_alu",
  double_alu: "double_alu",
  double_bridge_alu: "double_bridge_alu",
  double_bridge_low_e: "double_bridge_low_e",
  triple_bridge_low_e: "triple_bridge_low_e",
  upvc_double: "upvc_double",
  wood_double: "wood_double",
};

// 请求体类型
interface EvaluateRequest {
  city: string;
  buildingType: string;
  residentialSubType?: string | null;
  buildingArea?: number | null;
  buildingFloors?: number | null;
  buildingYear?: number | null;
  wallType: string;
  wallThickness: number;
  wallInsulationType?: string | null;
  wallInsulationThickness?: number | null;
  roofType: string;
  roofInsulationType?: string | null;
  roofInsulationThickness?: number | null;
  windowType: string;
  shapeCoefficient?: number | null;
  windowWallRatio?: number | null;
  phone?: string | null;
}

// ── 辅助函数 ─────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function findCity(name: string) {
  return CITIES.find((c) => c.name === name);
}

function resolveWallType(id: string) {
  const mapped = WALL_TYPE_MAP[id] || id;
  return WALL_TYPES.find((t) => t.id === mapped);
}

function resolveRoofType(id: string) {
  const mapped = ROOF_TYPE_MAP[id] || id;
  return ROOF_TYPES.find((t) => t.id === mapped);
}

function resolveWallInsulation(id: string | null | undefined) {
  if (!id || id === "none" || id === "") return INSULATION_MATERIALS.find((m) => m.id === "none")!;
  return INSULATION_MATERIALS.find((m) => m.id === id);
}

function resolveRoofInsulation(id: string | null | undefined, thickness: number) {
  if (!id || id === "none" || id === "roof_none" || id === "") {
    return ROOF_INSULATION_MATERIALS.find((m) => m.id === "roof_none")!;
  }
  // 外部ID可能是通用名如 "xps_board"，需要拼接厚度生成内部ID如 "roof_xps_60"
  const ROOF_INS_BASE_MAP: Record<string, string> = {
    xps_board: "roof_xps",
    eps_board: "roof_eps",
    rock_wool: "roof_rockwool",
    rockwool: "roof_rockwool",
    pu_board: "roof_pu",
    pu_spray: "roof_pu_spray",
    water_based_pu_spray: "roof_water_based_pu_spray",
  };

  const base = ROOF_INS_BASE_MAP[id];
  if (base) {
    // 喷涂类材料ID不含厚度
    if (base === "roof_pu_spray" || base === "roof_water_based_pu_spray") {
      return ROOF_INSULATION_MATERIALS.find((m) => m.id === base);
    }
    const targetId = `${base}_${thickness}`;
    const found = ROOF_INSULATION_MATERIALS.find((m) => m.id === targetId);
    if (found) return found;
    // 找不到精确匹配，取最接近的厚度
    const available = ROOF_INSULATION_MATERIALS.filter((m) => m.id.startsWith(base + "_"));
    if (available.length > 0) {
      return available.reduce((closest, m) => {
        const mThick = parseInt(m.id.split("_").pop() || "0");
        const closestThick = parseInt(closest.id.split("_").pop() || "0");
        return Math.abs(mThick - thickness) < Math.abs(closestThick - thickness) ? m : closest;
      });
    }
  }

  // 直接按ID查找（内部ID直接使用）
  return ROOF_INSULATION_MATERIALS.find((m) => m.id === id);
}

function resolveWindowConfig(id: string) {
  const mapped = WINDOW_TYPE_MAP[id] || id;
  return WINDOW_CONFIGS.find((w) => w.id === mapped);
}

function getBuildingTypeName(typeId: string, subType?: string | null): string {
  const info = BUILDING_TYPES.find((b) => b.id === typeId);
  if (!info) return typeId;
  if (typeId === "residential" && subType) {
    const subLabels: Record<string, string> = {
      detached: "独栋住宅",
      semi_detached: "联排住宅",
      apartment: "公寓住宅",
      other: "其他住宅",
    };
    return subLabels[subType] || info.name;
  }
  return info.name;
}

function generateSuggestions(
  wallStatus: string, wallExcess: number,
  roofStatus: string, roofExcess: number,
  windowStatus: string, windowExcess: number,
): string {
  const issues: { name: string; excess: number }[] = [];
  if (wallStatus === "fail") issues.push({ name: "外墙", excess: wallExcess });
  if (roofStatus === "fail") issues.push({ name: "屋面", excess: roofExcess });
  if (windowStatus === "fail") issues.push({ name: "外窗", excess: windowExcess });

  if (issues.length === 0) {
    return "各项指标均达标，建筑保温节能性能良好。";
  }

  issues.sort((a, b) => b.excess - a.excess);
  const parts = issues.map((i) => `${i.name}K值超标${round2(i.excess)}%`);
  const main = issues[0];
  return `${parts.join("，")}。${main.name}是最大短板，建议优先加强${main.name}保温。`;
}

// ── 飞书写入（复用 buildFields，无手机号也可写入）────────────

async function writeToFeishu(data: FeishuAssessmentData): Promise<void> {
  const token = await getTenantAccessToken();
  if (!token) {
    console.info("[/api/evaluate] 飞书服务未配置，跳过写入");
    return;
  }

  const appToken = process.env.FEISHU_TABLE_APP_TOKEN;
  const tableId = process.env.FEISHU_TABLE_ID;
  if (!appToken || !tableId) {
    console.info("[/api/evaluate] 表格配置不完整，跳过写入");
    return;
  }

  const fields = buildFields(data);

  const response = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ records: [{ fields }] }),
    }
  );

  const result = await response.json();
  if (result.code !== 0) {
    console.error("[/api/evaluate] 飞书写入失败:", result.msg);
    return;
  }

  const recordId = result.data?.records?.[0]?.record_id;
  console.info("[/api/evaluate] 飞书写入成功, recordId:", recordId);
}

// ── POST Handler ─────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EvaluateRequest;

    // 1. 校验必填字段
    const missing: string[] = [];
    if (!body.city) missing.push("city");
    if (!body.buildingType) missing.push("buildingType");
    if (!body.wallType) missing.push("wallType");
    if (!body.wallThickness) missing.push("wallThickness");
    if (!body.roofType) missing.push("roofType");
    if (!body.windowType) missing.push("windowType");

    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, error: `缺少必填字段: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // 2. 城市 → 气候分区
    const cityInfo = findCity(body.city);
    if (!cityInfo) {
      return NextResponse.json(
        { success: false, error: `未找到城市"${body.city}"，请检查城市名称` },
        { status: 400 }
      );
    }
    const climateZone: ClimateZone = cityInfo.zone;
    const climateZoneLabel = CLIMATE_ZONE_LABELS[climateZone];

    // 3. 建筑类型
    const buildingType = body.buildingType as BuildingType;
    const bInfo = BUILDING_TYPES.find((b) => b.id === buildingType);
    if (!bInfo) {
      return NextResponse.json(
        { success: false, error: `不支持的建筑类型"${body.buildingType}"，可选: residential/office/hotel/factory` },
        { status: 400 }
      );
    }

    // 4. 解析墙体
    const wallType = resolveWallType(body.wallType);
    if (!wallType) {
      return NextResponse.json(
        { success: false, error: `未找到墙体类型"${body.wallType}"` },
        { status: 400 }
      );
    }

    const wallInsulation = resolveWallInsulation(body.wallInsulationType);
    if (!wallInsulation) {
      return NextResponse.json(
        { success: false, error: `未找到墙体保温材料"${body.wallInsulationType}"` },
        { status: 400 }
      );
    }

    const wallInsThickness = body.wallInsulationThickness || 0;

    // 5. 解析屋面
    const roofType = resolveRoofType(body.roofType);
    if (!roofType) {
      return NextResponse.json(
        { success: false, error: `未找到屋面类型"${body.roofType}"` },
        { status: 400 }
      );
    }

    const roofInsulation = resolveRoofInsulation(body.roofInsulationType, body.roofInsulationThickness || 50);
    if (!roofInsulation) {
      return NextResponse.json(
        { success: false, error: `未找到屋面保温材料"${body.roofInsulationType}"` },
        { status: 400 }
      );
    }

    const roofInsThickness = body.roofInsulationThickness || 0;

    // 6. 解析窗户
    const windowCfg = resolveWindowConfig(body.windowType);
    if (!windowCfg) {
      return NextResponse.json(
        { success: false, error: `未找到窗户类型"${body.windowType}"` },
        { status: 400 }
      );
    }

    // 7. 计算K值
    const wallResult = calculateWallK({
      wallType,
      wallThickness: body.wallThickness,
      insulationLayer: wallInsulation,
      insulationThickness: wallInsThickness,
    });

    const roofResult = calculateRoofK({
      roofType,
      roofThickness: body.roofInsulationThickness ? 120 : 120, // 屋面基层默认120mm
      insulationLayer: roofInsulation,
      insulationThickness: roofInsThickness,
    });

    // 8. 获取标准限值
    const limits = getStandardLimits(climateZone, buildingType);

    // 9. 评级
    const ratingResult = calculateRating(
      wallResult.kValue,
      roofResult.kValue,
      windowCfg.kValue,
      limits.wallK,
      limits.roofK,
      limits.windowK
    );

    // 10. 热损失分布
    const heatLoss = estimateHeatLoss(
      wallResult.kValue,
      roofResult.kValue,
      windowCfg.kValue,
      bInfo.wallAreaRatio,
      bInfo.roofAreaRatio,
      bInfo.windowRatio
    );

    // 11. 生成建议
    const suggestions = generateSuggestions(
      ratingResult.wallStatus, ratingResult.wallExcess,
      ratingResult.roofStatus, ratingResult.roofExcess,
      ratingResult.windowStatus, ratingResult.windowExcess,
    );

    // 12. 构建响应
    const buildingTypeName = getBuildingTypeName(buildingType, body.residentialSubType);

    // 计算体形系数
    let shapeCoefficient: number | null = null;
    if (body.shapeCoefficient != null) {
      shapeCoefficient = round2(body.shapeCoefficient);
    } else if (body.buildingArea && body.buildingFloors) {
      const floorHeight = 3;
      const height = body.buildingFloors * floorHeight;
      const perimeter = 4 * Math.sqrt(body.buildingArea);
      const externalArea = perimeter * height + body.buildingArea;
      shapeCoefficient = round2(externalArea / (body.buildingArea * height));
    }

    const responseData = {
      city: body.city,
      climateZone: climateZoneLabel,
      buildingType: buildingTypeName,
      buildingArea: body.buildingArea || null,
      buildingFloors: body.buildingFloors || null,
      shapeCoefficient,
      wallK: round2(wallResult.kValue),
      wallLimit: limits.wallK,
      wallStatus: ratingResult.wallStatus === "pass" ? "达标" : "超标",
      wallOverPercent: round2(ratingResult.wallExcess),
      roofK: round2(roofResult.kValue),
      roofLimit: limits.roofK,
      roofStatus: ratingResult.roofStatus === "pass" ? "达标" : "超标",
      roofOverPercent: round2(ratingResult.roofExcess),
      windowK: round2(windowCfg.kValue),
      windowLimit: limits.windowK,
      windowStatus: ratingResult.windowStatus === "pass" ? "达标" : "超标",
      windowOverPercent: round2(ratingResult.windowExcess),
      rating: ratingResult.rating,
      score: ratingResult.score,
      heatLoss: {
        wall: heatLoss.wall,
        roof: heatLoss.roof,
        window: heatLoss.window,
        other: heatLoss.infiltration,
      },
      suggestions,
    };

    // 13. 异步写入飞书多维表格（不阻塞响应，失败仅记日志）
    const feishuWritePromise = writeToFeishu({
      city: body.city,
      climateZone: climateZoneLabel,
      buildingType: buildingTypeName,
      buildingArea: body.buildingArea || null,
      buildingFloors: body.buildingFloors || null,
      shapeCoefficient,
      wallKValue: round2(wallResult.kValue),
      roofKValue: round2(roofResult.kValue),
      windowKValue: round2(windowCfg.kValue),
      wallLimit: limits.wallK,
      roofLimit: limits.roofK,
      windowLimit: limits.windowK,
      wallCompliant: ratingResult.wallStatus === "pass",
      roofCompliant: ratingResult.roofStatus === "pass",
      windowCompliant: ratingResult.windowStatus === "pass",
      rating: ratingResult.rating,
      score: ratingResult.score,
      phone: body.phone || "",
      wallConstruction: `${wallType.name} ${body.wallThickness}mm${wallInsulation.id !== "none" ? ` + ${wallInsulation.name} ${wallInsThickness}mm` : ""}`,
      roofConstruction: `${roofType.name} 120mm${roofInsulation.id !== "roof_none" ? ` + ${roofInsulation.name} ${roofInsThickness}mm` : ""}`,
      windowType: windowCfg.name,
      referralSource: "",
    }).catch((err) => {
      console.warn("[/api/evaluate] 飞书写入失败（静默处理）:", err);
    });

    // 等待飞书写入完成（最多3秒），但不影响响应
    await Promise.race([
      feishuWritePromise,
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (err) {
    console.error("[/api/evaluate] Error:", err);
    return NextResponse.json(
      { success: false, error: "计算异常，请检查参数后重试" },
      { status: 500 }
    );
  }
}
