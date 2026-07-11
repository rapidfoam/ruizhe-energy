// 建筑围护结构热工性能限值 - 依据GB 55015-2021
// 数据来源: assets/standards.json

import type { ClimateZone } from "./climate";
import type { BuildingType } from "./building-types";

export interface StandardLimits {
  wallK: number; // 外墙传热系数限值 W/(m²·K)
  roofK: number; // 屋面传热系数限值 W/(m²·K)
  windowK: number; // 外窗传热系数限值 W/(m²·K) - 窗墙比≤0.25时的默认值
  overheadFloorK: number; // 架空楼板限值
  windowK_025_035: number; // 窗墙比0.25-0.35
  windowK_035_045: number; // 窗墙比0.35-0.45
  windowK_gt_045: number; // 窗墙比>0.45
}

// 气候分区key映射
type ZoneKey =
  | "I_severe_cold"
  | "I_severe_cold_B"
  | "I_severe_cold_C"
  | "II_cold_A"
  | "II_cold_B"
  | "III_hot_summer_cold_winter"
  | "IV_hot_summer_warm_winter"
  | "V_temperate";

// 居住建筑限值 (独栋住宅≤3层)
const RESIDENTIAL_LIMITS: Record<string, StandardLimits> = {
  I_severe_cold: { wallK: 0.25, roofK: 0.20, windowK: 1.80, overheadFloorK: 0.25, windowK_025_035: 1.50, windowK_035_045: 1.20, windowK_gt_045: 1.00 },
  I_severe_cold_B: { wallK: 0.30, roofK: 0.20, windowK: 2.00, overheadFloorK: 0.30, windowK_025_035: 1.80, windowK_035_045: 1.50, windowK_gt_045: 1.20 },
  I_severe_cold_C: { wallK: 0.35, roofK: 0.25, windowK: 2.20, overheadFloorK: 0.35, windowK_025_035: 2.00, windowK_035_045: 1.80, windowK_gt_045: 1.50 },
  II_cold_A: { wallK: 0.35, roofK: 0.30, windowK: 2.50, overheadFloorK: 0.35, windowK_025_035: 2.20, windowK_035_045: 1.90, windowK_gt_045: 1.70 },
  II_cold_B: { wallK: 0.45, roofK: 0.35, windowK: 2.80, overheadFloorK: 0.45, windowK_025_035: 2.50, windowK_035_045: 2.20, windowK_gt_045: 1.90 },
  III_hot_summer_cold_winter: { wallK: 0.50, roofK: 0.40, windowK: 2.80, overheadFloorK: 0.50, windowK_025_035: 2.50, windowK_035_045: 2.20, windowK_gt_045: 1.90 },
  IV_hot_summer_warm_winter: { wallK: 0.80, roofK: 0.50, windowK: 3.00, overheadFloorK: 0.80, windowK_025_035: 2.80, windowK_035_045: 2.50, windowK_gt_045: 2.20 },
  V_temperate: { wallK: 0.80, roofK: 0.50, windowK: 3.00, overheadFloorK: 0.60, windowK_025_035: 2.80, windowK_035_045: 2.50, windowK_gt_045: 2.20 },
};

// 甲类公共建筑限值 (小型办公楼、酒店民宿)
const PUBLIC_LIMITS: Record<string, StandardLimits> = {
  I_severe_cold: { wallK: 0.30, roofK: 0.30, windowK: 2.00, overheadFloorK: 0.35, windowK_025_035: 1.80, windowK_035_045: 1.50, windowK_gt_045: 1.20 },
  I_severe_cold_B: { wallK: 0.35, roofK: 0.30, windowK: 2.20, overheadFloorK: 0.40, windowK_025_035: 2.00, windowK_035_045: 1.70, windowK_gt_045: 1.40 },
  I_severe_cold_C: { wallK: 0.40, roofK: 0.35, windowK: 2.50, overheadFloorK: 0.45, windowK_025_035: 2.20, windowK_035_045: 1.90, windowK_gt_045: 1.60 },
  II_cold_A: { wallK: 0.40, roofK: 0.35, windowK: 2.50, overheadFloorK: 0.45, windowK_025_035: 2.20, windowK_035_045: 1.90, windowK_gt_045: 1.70 },
  II_cold_B: { wallK: 0.50, roofK: 0.40, windowK: 2.80, overheadFloorK: 0.50, windowK_025_035: 2.50, windowK_035_045: 2.20, windowK_gt_045: 1.90 },
  III_hot_summer_cold_winter: { wallK: 0.60, roofK: 0.45, windowK: 2.80, overheadFloorK: 0.60, windowK_025_035: 2.50, windowK_035_045: 2.20, windowK_gt_045: 1.90 },
  IV_hot_summer_warm_winter: { wallK: 0.80, roofK: 0.50, windowK: 3.00, overheadFloorK: 0.80, windowK_025_035: 2.80, windowK_035_045: 2.50, windowK_gt_045: 2.20 },
  V_temperate: { wallK: 0.80, roofK: 0.50, windowK: 3.00, overheadFloorK: 0.70, windowK_025_035: 2.80, windowK_035_045: 2.50, windowK_gt_045: 2.20 },
};

// 工业建筑限值 (小型厂房, 体形系数≤0.10)
const INDUSTRIAL_LIMITS: Record<string, StandardLimits> = {
  I_severe_cold: { wallK: 0.55, roofK: 0.45, windowK: 2.70, overheadFloorK: 0.60, windowK_025_035: 2.50, windowK_035_045: 2.20, windowK_gt_045: 2.00 },
  II_cold: { wallK: 0.65, roofK: 0.55, windowK: 3.00, overheadFloorK: 0.70, windowK_025_035: 2.70, windowK_035_045: 2.50, windowK_gt_045: 2.20 },
  III_hot_summer_cold_winter: { wallK: 0.80, roofK: 0.60, windowK: 3.50, overheadFloorK: 0.80, windowK_025_035: 3.20, windowK_035_045: 2.80, windowK_gt_045: 2.50 },
  IV_hot_summer_warm_winter: { wallK: 1.00, roofK: 0.70, windowK: 4.00, overheadFloorK: 1.00, windowK_025_035: 3.50, windowK_035_045: 3.20, windowK_gt_045: 2.80 },
  V_temperate: { wallK: 1.00, roofK: 0.70, windowK: 4.00, overheadFloorK: 0.90, windowK_025_035: 3.50, windowK_035_045: 3.20, windowK_gt_045: 2.80 },
};

// 气候分区 -> 标准key映射
function getZoneKey(zone: ClimateZone): string {
  switch (zone) {
    case "severe_cold": return "I_severe_cold";
    case "cold": return "II_cold_B"; // 取较宽松的IIB子区
    case "hot_summer_cold_winter": return "III_hot_summer_cold_winter";
    case "hot_summer_warm_winter": return "IV_hot_summer_warm_winter";
    case "mild": return "V_temperate";
  }
}

// 建筑类型 -> 标准表映射
function getLimitsTable(type: BuildingType): Record<string, StandardLimits> {
  switch (type) {
    case "residential": return RESIDENTIAL_LIMITS;
    case "office":
    case "hotel": return PUBLIC_LIMITS;
    case "factory": return INDUSTRIAL_LIMITS;
  }
}

export function getStandardLimits(zone: ClimateZone, type: BuildingType): StandardLimits {
  const zoneKey = getZoneKey(zone);
  const table = getLimitsTable(type);
  return table[zoneKey] || table["V_temperate"];
}

export function getStandardLimitsByWindowRatio(
  zone: ClimateZone,
  type: BuildingType,
  windowRatio: number
): number {
  const limits = getStandardLimits(zone, type);
  if (windowRatio <= 0.25) return limits.windowK;
  if (windowRatio <= 0.35) return limits.windowK_025_035;
  if (windowRatio <= 0.45) return limits.windowK_035_045;
  return limits.windowK_gt_045;
}
