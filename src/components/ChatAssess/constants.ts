// ChatAssess Constants - v2
import type { BuildingType } from "@/lib/data/building-types";
import type { ClimateZone } from "@/lib/data/climate";
import type { ChatStep, SmartDefaults, QuickReply } from "./types";
import { CLIMATE_ZONE_LABELS } from "@/lib/data/climate";

export const YEAR_OPTIONS: QuickReply[] = [
  { text: "2020年以后", value: "after2020" },
  { text: "2016-2020年", value: "2016_2020" },
  { text: "2011-2015年", value: "2011_2015" },
  { text: "2006-2010年", value: "2006_2010" },
  { text: "2005年以前", value: "before2005" },
  { text: "不确定", value: "unknown" },
];

export const YEAR_LABELS: Record<string, string> = {
  after2020: "2020年以后",
  "2016_2020": "2016-2020年",
  "2011_2015": "2011-2015年",
  "2006_2010": "2006-2010年",
  before2005: "2005年以前",
  unknown: "不确定",
};

// 建筑类型 - 与form/page.tsx保持一致
export const BUILDING_TYPE_OPTIONS: QuickReply[] = [
  { text: "居住建筑", value: "residential" },
  { text: "办公建筑", value: "office" },
  { text: "酒店建筑", value: "hotel" },
  { text: "工业建筑", value: "factory" },
];

// 居住建筑子类型
export const RESIDENTIAL_SUBTYPE_OPTIONS: QuickReply[] = [
  { text: "独栋/联排别墅", value: "detached" },
  { text: "公寓/单元房", value: "apartment" },
  { text: "其他住宅", value: "other" },
];

// 外墙类型选项（通俗描述）
export const WALL_TYPE_OPTIONS: QuickReply[] = [
  { text: "实心红砖墙", value: "solid_brick" },
  { text: "多孔砖墙", value: "porous_brick" },
  { text: "加气混凝土砌块（灰砖/蒸压砖）", value: "aerated_concrete_block" },
  { text: "钢筋混凝土墙（剪力墙）", value: "concrete_shear_wall" },
  { text: "混凝土空心砌块", value: "hollow_concrete_block" },
  { text: "轻型木结构墙体", value: "light_wood_wall" },
  { text: "轻型钢结构板墙体", value: "light_steel_wall" },
];

// 墙体厚度选项（按墙体类型）
export const WALL_THICKNESS_OPTIONS: Record<string, QuickReply[]> = {
  solid_brick: [
    { text: "240mm（标准砖墙）", value: "240" },
    { text: "370mm（一砖半墙）", value: "370" },
    { text: "490mm（两砖墙）", value: "490" },
  ],
  porous_brick: [
    { text: "240mm", value: "240" },
    { text: "370mm", value: "370" },
  ],
  aerated_concrete_block: [
    { text: "200mm", value: "200" },
    { text: "250mm", value: "250" },
    { text: "300mm", value: "300" },
  ],
  concrete_shear_wall: [
    { text: "180mm", value: "180" },
    { text: "200mm", value: "200" },
    { text: "250mm", value: "250" },
  ],
  hollow_concrete_block: [
    { text: "190mm", value: "190" },
    { text: "290mm", value: "290" },
  ],
  light_wood_wall: [
    { text: "100mm", value: "100" },
    { text: "150mm", value: "150" },
    { text: "200mm", value: "200" },
  ],
  light_steel_wall: [
    { text: "100mm", value: "100" },
    { text: "150mm", value: "150" },
    { text: "200mm", value: "200" },
  ],
};

// 保温层选择
export const WALL_INSULATION_CHOICE_OPTIONS: QuickReply[] = [
  { text: "有保温层", value: "yes" },
  { text: "没有保温层", value: "no" },
  { text: "不确定", value: "estimate" },
];

// 墙体保温材料选项（通俗描述）
export const WALL_INSULATION_TYPE_OPTIONS: QuickReply[] = [
  { text: "EPS聚苯板（白色泡沫板）", value: "eps_board" },
  { text: "SEPS石墨聚苯板（灰色泡沫板）", value: "seps_board" },
  { text: "XPS挤塑板（硬质彩色板）", value: "xps_board" },
  { text: "聚氨酯喷涂（黄色发泡）", value: "pu_spray" },
  { text: "喷涂水性软泡聚氨酯", value: "water_based_pu_spray" },
  { text: "岩棉板（黄色纤维板）", value: "rock_wool_board" },
  { text: "玻璃棉（棉状材料）", value: "glass_wool_board" },
  { text: "其他/不确定", value: "other" },
];

// 保温层厚度选项
export const INSULATION_THICKNESS_OPTIONS: QuickReply[] = [
  { text: "30mm", value: "30" },
  { text: "50mm", value: "50" },
  { text: "60mm", value: "60" },
  { text: "80mm", value: "80" },
  { text: "100mm", value: "100" },
];

// 屋面类型选项
export const ROOF_TYPE_OPTIONS: QuickReply[] = [
  { text: "钢筋混凝土屋面", value: "concrete_roof" },
  { text: "压型钢板屋面", value: "steel_deck" },
  { text: "瓦屋面（黏土瓦/水泥瓦）", value: "clay_tile_roof" },
  { text: "金属屋面板", value: "metal_roof" },
  { text: "加气混凝土屋面板", value: "aac_roof" },
  { text: "木结构屋面", value: "timber_roof" },
];

// 屋面厚度选项
export const ROOF_THICKNESS_OPTIONS: Record<string, QuickReply[]> = {
  concrete_roof: [
    { text: "100mm", value: "100" },
    { text: "120mm", value: "120" },
    { text: "150mm", value: "150" },
  ],
  steel_deck: [
    { text: "80mm", value: "80" },
    { text: "100mm", value: "100" },
    { text: "120mm", value: "120" },
  ],
  clay_tile_roof: [
    { text: "100mm", value: "100" },
    { text: "120mm", value: "120" },
    { text: "150mm", value: "150" },
  ],
  metal_roof: [
    { text: "80mm", value: "80" },
    { text: "100mm", value: "100" },
    { text: "120mm", value: "120" },
  ],
  aac_roof: [
    { text: "150mm", value: "150" },
    { text: "200mm", value: "200" },
  ],
  timber_roof: [
    { text: "100mm", value: "100" },
    { text: "150mm", value: "150" },
    { text: "200mm", value: "200" },
  ],
};

// 屋面保温选择
export const ROOF_INSULATION_CHOICE_OPTIONS: QuickReply[] = [
  { text: "有保温层", value: "yes" },
  { text: "没有保温层", value: "no" },
  { text: "不确定", value: "estimate" },
];

// 屋面保温材料选项
export const ROOF_INSULATION_TYPE_OPTIONS: QuickReply[] = [
  { text: "XPS挤塑板", value: "roof_xps_50" },
  { text: "EPS聚苯板", value: "roof_eps_50" },
  { text: "聚氨酯喷涂", value: "roof_pu_spray" },
  { text: "喷涂水性软泡聚氨酯", value: "roof_water_based_pu_spray" },
  { text: "岩棉板", value: "roof_rockwool_50" },
  { text: "其他/不确定", value: "other" },
];

// 窗框材质选项
export const WINDOW_FRAME_OPTIONS: QuickReply[] = [
  { text: "铝合金", value: "alu" },
  { text: "断桥铝", value: "bridge_alu" },
  { text: "塑钢", value: "upvc" },
  { text: "木框", value: "wood" },
  { text: "不确定", value: "unknown" },
];

// 玻璃类型选项
export const WINDOW_GLASS_OPTIONS: QuickReply[] = [
  { text: "单层玻璃", value: "single" },
  { text: "双层中空", value: "double" },
  { text: "三层/多层", value: "triple" },
  { text: "不确定", value: "unknown" },
];

// 智能默认值
export function getSmartDefaults(zone: ClimateZone, buildingType: BuildingType, year: string): SmartDefaults {
  const isOld = year === "before2005" || year === "unknown";
  const isCold = zone === "severe_cold" || zone === "cold";
  const isHot = zone === "hot_summer_cold_winter" || zone === "hot_summer_warm_winter";

  // 墙体默认值
  let wallType = "aerated_concrete_block";
  let wallThickness = 200;
  let wallInsulation = isCold ? "seps_board" : "eps_board";
  let wallInsulationThickness = isCold ? 60 : isHot ? 40 : 50;

  if (buildingType === "factory") {
    wallType = "concrete_shear_wall";
    wallThickness = 200;
  } else if (buildingType === "office" || buildingType === "hotel") {
    wallType = "concrete_shear_wall";
    wallThickness = 200;
  }

  if (isOld) {
    wallInsulation = "eps_board";
    wallInsulationThickness = 30;
  }

  // 屋面默认值
  let roofType = "concrete_roof";
  let roofThickness = 120;
  let roofInsulation = "roof_xps_50";
  let roofInsulationThickness = isCold ? 60 : 50;

  if (buildingType === "factory") {
    roofType = "steel_deck";
    roofThickness = 100;
    roofInsulation = "roof_rockwool_50";
  }

  if (isOld) {
    roofInsulationThickness = 30;
  }

  // 窗户默认值
  let windowConfig = isCold ? "double_bridge_alu" : isHot ? "upvc_double" : "double_bridge_alu";
  if (isOld) {
    windowConfig = "single_alu";
  }

  return { wallType, wallThickness, wallInsulation, wallInsulationThickness, roofType, roofThickness, roofInsulation, roofInsulationThickness, windowConfig };
}
