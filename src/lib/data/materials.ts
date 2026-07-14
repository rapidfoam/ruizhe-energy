// 常用建筑材料热工参数库 - 依据GB 50176-2016 附录B
// 数据来源: assets/materials.json

export interface MaterialLayer {
  id: string;
  name: string;
  lambda: number; // 导热系数 λ (W/(m·K))
  lambdaCorrection: number; // 修正系数 a
  lambdaCorrected: number; // λc = λ × a
  category: "wall" | "roof" | "plaster" | "insulation";
  description?: string;
  density?: number;
  specificHeat?: number;
  combustionClass?: string;
  commonThicknesses?: number[];
}

// 墙体基层材料类型（不含厚度）
export interface WallType {
  id: string;
  name: string;
  lambda: number;
  lambdaCorrection: number;
  lambdaCorrected: number;
  density: number;
  description: string;
  thicknesses: number[]; // mm
}

export const WALL_TYPES: WallType[] = [
  { id: "solid_brick", name: "实心黏土砖墙", lambda: 0.81, lambdaCorrection: 1.00, lambdaCorrected: 0.81, density: 1800, description: "标准黏土实心砖", thicknesses: [240, 370] },
  { id: "porous_brick", name: "多孔砖墙(KP1)", lambda: 0.58, lambdaCorrection: 1.00, lambdaCorrected: 0.58, density: 1400, description: "KP1型多孔砖", thicknesses: [240] },
  { id: "aerated_concrete_block", name: "加气混凝土砌块", lambda: 0.19, lambdaCorrection: 1.25, lambdaCorrected: 0.238, density: 600, description: "B06级", thicknesses: [200, 250, 300] },
  { id: "concrete_shear_wall", name: "钢筋混凝土剪力墙", lambda: 1.74, lambdaCorrection: 1.00, lambdaCorrected: 1.74, density: 2500, description: "现浇混凝土", thicknesses: [200, 250] },
  { id: "hollow_concrete_block", name: "混凝土空心砌块", lambda: 0.80, lambdaCorrection: 1.00, lambdaCorrected: 0.80, density: 1500, description: "空心砌块", thicknesses: [190] },
  { id: "light_wood_wall", name: "轻型木结构墙体", lambda: 0.14, lambdaCorrection: 1.10, lambdaCorrected: 0.154, density: 500, description: "木龙骨+OSB板+石膏板", thicknesses: [90, 120, 140] },
  { id: "light_steel_wall", name: "轻型钢结构板墙体", lambda: 0.20, lambdaCorrection: 1.10, lambdaCorrected: 0.22, density: 800, description: "轻钢龙骨+水泥纤维板", thicknesses: [100, 120, 150] },
];

// 墙体基层材料（保留兼容，用于计算引擎）
export const WALL_MATERIALS: MaterialLayer[] = WALL_TYPES.flatMap((t) =>
  t.thicknesses.map((th) => ({
    id: `${t.id}_${th}`,
    name: `${t.name} ${th}mm`,
    lambda: t.lambda,
    lambdaCorrection: t.lambdaCorrection,
    lambdaCorrected: t.lambdaCorrected,
    category: "wall" as const,
    density: t.density,
    description: t.description,
  }))
);

// 保温层材料
export const INSULATION_MATERIALS: MaterialLayer[] = [
  { id: "eps_board", name: "模塑聚苯板(EPS)", lambda: 0.041, lambdaCorrection: 1.15, lambdaCorrected: 0.047, category: "insulation", density: 20, combustionClass: "B1/B2", commonThicknesses: [30,40,50,60,80,100,120], description: "EPS" },
  { id: "seps_board", name: "石墨聚苯板(SEPS)", lambda: 0.033, lambdaCorrection: 1.15, lambdaCorrected: 0.038, category: "insulation", density: 20, combustionClass: "B1", commonThicknesses: [30,40,50,60,80,100,120], description: "石墨EPS" },
  { id: "xps_board", name: "挤塑聚苯板(XPS)", lambda: 0.030, lambdaCorrection: 1.10, lambdaCorrected: 0.033, category: "insulation", density: 30, combustionClass: "B1/B2", commonThicknesses: [30,40,50,60,80,100], description: "XPS" },
  { id: "pu_board", name: "聚氨酯保温板(PU)", lambda: 0.024, lambdaCorrection: 1.10, lambdaCorrected: 0.026, category: "insulation", density: 35, combustionClass: "B1/B2", commonThicknesses: [30,40,50,60,80,100], description: "硬质聚氨酯" },
  { id: "pu_spray", name: "喷涂硬质聚氨酯(PUR)", lambda: 0.024, lambdaCorrection: 1.10, lambdaCorrected: 0.026, category: "insulation", density: 35, combustionClass: "B1/B2", commonThicknesses: [20,30,40,50,60,80], description: "喷涂聚氨酯硬泡，无缝密封" },
  { id: "water_based_pu_spray", name: "喷涂水性软泡聚氨酯(开孔)", lambda: 0.038, lambdaCorrection: 1.10, lambdaCorrected: 0.042, category: "insulation", density: 10, combustionClass: "B1", commonThicknesses: [30,40,50,60,80,100,120], description: "水性软泡聚氨酯喷涂，环保开孔结构" },
  { id: "pir_board", name: "聚异氰脲酸酯板(PIR)", lambda: 0.023, lambdaCorrection: 1.10, lambdaCorrected: 0.025, category: "insulation", density: 40, combustionClass: "B1", commonThicknesses: [30,40,50,60,80,100], description: "PIR" },
  { id: "rock_wool_board", name: "岩棉板", lambda: 0.040, lambdaCorrection: 1.20, lambdaCorrected: 0.048, category: "insulation", density: 80, combustionClass: "A", commonThicknesses: [40,50,60,80,100,120], description: "A级防火" },
  { id: "glass_wool_board", name: "玻璃棉板", lambda: 0.040, lambdaCorrection: 1.20, lambdaCorrected: 0.048, category: "insulation", density: 48, combustionClass: "A", commonThicknesses: [40,50,60,80,100], description: "A级防火" },
  { id: "phenolic_board", name: "酚醛泡沫板", lambda: 0.033, lambdaCorrection: 1.15, lambdaCorrected: 0.038, category: "insulation", density: 50, combustionClass: "B1", commonThicknesses: [30,40,50,60,80], description: "酚醛" },
  { id: "aerated_concrete_insulation", name: "加气混凝土保温板", lambda: 0.16, lambdaCorrection: 1.25, lambdaCorrected: 0.20, category: "insulation", density: 500, combustionClass: "A", commonThicknesses: [60,80,100,120], description: "无机保温" },
  { id: "none", name: "无保温层", lambda: 0, lambdaCorrection: 1.0, lambdaCorrected: 0, category: "insulation", description: "不设保温" },
];

// 抹灰层材料
export const PLASTER_MATERIALS: MaterialLayer[] = [
  { id: "cement_plaster", name: "水泥砂浆", lambda: 0.93, lambdaCorrection: 1.00, lambdaCorrected: 0.93, category: "plaster", density: 1800, description: "1:3水泥砂浆" },
  { id: "lime_cement_plaster", name: "混合砂浆", lambda: 0.87, lambdaCorrection: 1.00, lambdaCorrected: 0.87, category: "plaster", density: 1700, description: "水泥石灰砂浆" },
  { id: "polymer_plaster", name: "抗裂砂浆", lambda: 0.93, lambdaCorrection: 1.00, lambdaCorrected: 0.93, category: "plaster", density: 1800, description: "抹面胶浆" },
];

// 屋面基层材料类型（不含厚度）
export interface RoofType {
  id: string;
  name: string;
  lambda: number;
  lambdaCorrection: number;
  lambdaCorrected: number;
  density: number;
  description: string;
  thicknesses: number[]; // mm
}

export const ROOF_TYPES: RoofType[] = [
  { id: "concrete_roof", name: "钢筋混凝土屋面板", lambda: 1.74, lambdaCorrection: 1.00, lambdaCorrected: 1.74, density: 2500, description: "现浇混凝土板", thicknesses: [100, 120, 150, 180] },
  { id: "timber_roof", name: "实木屋面板", lambda: 0.17, lambdaCorrection: 1.10, lambdaCorrected: 0.187, density: 600, description: "实木拼板屋面", thicknesses: [50, 80] },
  { id: "plywood_roof", name: "胶合板屋面板", lambda: 0.17, lambdaCorrection: 1.10, lambdaCorrected: 0.187, density: 650, description: "木结构基层常用", thicknesses: [18] },
  { id: "osb_roof", name: "OSB定向刨花板", lambda: 0.13, lambdaCorrection: 1.10, lambdaCorrected: 0.143, density: 650, description: "木结构基层常用", thicknesses: [18, 25] },
  { id: "steel_deck", name: "压型钢板组合楼板", lambda: 1.74, lambdaCorrection: 1.00, lambdaCorrected: 1.74, density: 2000, description: "钢承板+混凝土", thicknesses: [50, 80, 100] },
  { id: "steel_truss_cement", name: "钢结构桁架+水泥纤维板", lambda: 0.35, lambdaCorrection: 1.10, lambdaCorrected: 0.385, density: 1400, description: "轻钢屋面系统", thicknesses: [20, 30] },
  { id: "aac_roof", name: "加气混凝土屋面板", lambda: 0.19, lambdaCorrection: 1.25, lambdaCorrected: 0.238, density: 600, description: "轻质屋面板", thicknesses: [100, 150] },
  { id: "clay_tile_roof", name: "黏土瓦屋面(含挂瓦条)", lambda: 0.84, lambdaCorrection: 1.00, lambdaCorrected: 0.84, density: 1900, description: "坡屋面瓦系统，等效厚度约30mm", thicknesses: [30] },
  { id: "cement_tile_roof", name: "水泥瓦屋面(含挂瓦条)", lambda: 0.92, lambdaCorrection: 1.00, lambdaCorrected: 0.92, density: 2100, description: "坡屋面瓦系统，等效厚度约30mm", thicknesses: [30] },
  { id: "metal_roof", name: "金属屋面板(含檩条)", lambda: 58.2, lambdaCorrection: 1.00, lambdaCorrected: 58.2, density: 7850, description: "彩钢板/铝镁锰板，金属热阻忽略", thicknesses: [5] },
  { id: "light_wood_roof", name: "轻型木结构屋顶", lambda: 0.14, lambdaCorrection: 1.10, lambdaCorrected: 0.154, density: 500, description: "木龙骨+OSB板+防水卷材", thicknesses: [120, 150, 180] },
  { id: "light_steel_roof", name: "轻型钢结构板屋顶", lambda: 0.20, lambdaCorrection: 1.10, lambdaCorrected: 0.22, density: 800, description: "轻钢龙骨+水泥纤维板+防水", thicknesses: [100, 120, 150] },
];

// 屋面基层材料（保留兼容，用于计算引擎）
export const ROOF_MATERIALS: MaterialLayer[] = ROOF_TYPES.flatMap((t) =>
  t.thicknesses.map((th) => ({
    id: `${t.id}_${th}`,
    name: `${t.name} ${th}mm`,
    lambda: t.lambda,
    lambdaCorrection: t.lambdaCorrection,
    lambdaCorrected: t.lambdaCorrected,
    category: "roof" as const,
    density: t.density,
    description: t.description,
  }))
);

// 屋面保温层材料
export const ROOF_INSULATION_MATERIALS: MaterialLayer[] = [
  { id: "roof_xps_40", name: "XPS挤塑板 40mm", lambda: 0.030, lambdaCorrection: 1.15, lambdaCorrected: 0.035, category: "insulation", description: "屋面专用" },
  { id: "roof_xps_50", name: "XPS挤塑板 50mm", lambda: 0.030, lambdaCorrection: 1.15, lambdaCorrected: 0.035, category: "insulation", description: "屋面专用" },
  { id: "roof_xps_60", name: "XPS挤塑板 60mm", lambda: 0.030, lambdaCorrection: 1.15, lambdaCorrected: 0.035, category: "insulation", description: "屋面专用" },
  { id: "roof_xps_80", name: "XPS挤塑板 80mm", lambda: 0.030, lambdaCorrection: 1.15, lambdaCorrected: 0.035, category: "insulation", description: "屋面专用" },
  { id: "roof_eps_50", name: "EPS聚苯板 50mm", lambda: 0.041, lambdaCorrection: 1.25, lambdaCorrected: 0.051, category: "insulation", description: "屋面用" },
  { id: "roof_eps_60", name: "EPS聚苯板 60mm", lambda: 0.041, lambdaCorrection: 1.25, lambdaCorrected: 0.051, category: "insulation", description: "屋面用" },
  { id: "roof_eps_80", name: "EPS聚苯板 80mm", lambda: 0.041, lambdaCorrection: 1.25, lambdaCorrected: 0.051, category: "insulation", description: "屋面用" },
  { id: "roof_rockwool_50", name: "岩棉板 50mm", lambda: 0.040, lambdaCorrection: 1.25, lambdaCorrected: 0.050, category: "insulation", description: "屋面专用" },
  { id: "roof_rockwool_60", name: "岩棉板 60mm", lambda: 0.040, lambdaCorrection: 1.25, lambdaCorrected: 0.050, category: "insulation", description: "屋面专用" },
  { id: "roof_rockwool_80", name: "岩棉板 80mm", lambda: 0.040, lambdaCorrection: 1.25, lambdaCorrected: 0.050, category: "insulation", description: "屋面专用" },
  { id: "roof_pu_50", name: "聚氨酯板 50mm", lambda: 0.024, lambdaCorrection: 1.15, lambdaCorrected: 0.028, category: "insulation", description: "屋面专用" },
  { id: "roof_pu_60", name: "聚氨酯板 60mm", lambda: 0.024, lambdaCorrection: 1.15, lambdaCorrected: 0.028, category: "insulation", description: "屋面专用" },
  { id: "roof_pu_80", name: "聚氨酯板 80mm", lambda: 0.024, lambdaCorrection: 1.15, lambdaCorrected: 0.028, category: "insulation", description: "屋面专用" },
  { id: "roof_pu_spray", name: "喷涂硬质聚氨酯(PUR)", lambda: 0.024, lambdaCorrection: 1.10, lambdaCorrected: 0.026, category: "insulation", commonThicknesses: [30,40,50,60,80,100], description: "屋面喷涂硬泡聚氨酯，无缝密封" },
  { id: "roof_water_based_pu_spray", name: "喷涂水性软泡聚氨酯(开孔)", lambda: 0.038, lambdaCorrection: 1.10, lambdaCorrected: 0.042, category: "insulation", commonThicknesses: [30,40,50,60,80,100,120], description: "屋面水性软泡聚氨酯喷涂，环保开孔结构" },
  { id: "roof_none", name: "无保温层", lambda: 0, lambdaCorrection: 1.0, lambdaCorrected: 0, category: "insulation", description: "不设保温" },
];

// 外窗配置
export interface WindowConfig {
  id: string;
  name: string;
  kValue: number;
  frameMaterial: string;
  glassType: string;
  layers: number;
  description: string;
}

export const WINDOW_CONFIGS: WindowConfig[] = [
  { id: "single_alu", name: "单层铝合金窗", kValue: 6.40, frameMaterial: "铝合金", glassType: "单层普通玻璃", layers: 1, description: "无断桥，保温性差" },
  { id: "single_wood", name: "单层玻璃木窗", kValue: 4.50, frameMaterial: "木", glassType: "单层普通玻璃", layers: 1, description: "传统木窗" },
  { id: "double_alu", name: "双层铝合金窗(无断桥)", kValue: 3.80, frameMaterial: "铝合金", glassType: "双层普通中空玻璃", layers: 2, description: "普通中空玻璃6+12A+6" },
  { id: "double_bridge_alu", name: "断桥铝合金中空窗", kValue: 2.80, frameMaterial: "断桥铝合金", glassType: "双层中空玻璃", layers: 2, description: "断桥+中空6+12A+6" },
  { id: "double_bridge_low_e", name: "断桥Low-E中空窗", kValue: 1.80, frameMaterial: "断桥铝合金", glassType: "Low-E中空玻璃", layers: 2, description: "断桥+Low-E中空" },
  { id: "triple_bridge_low_e", name: "Low-E三玻两腔窗", kValue: 1.20, frameMaterial: "断桥铝合金", glassType: "Low-E三玻两腔", layers: 3, description: "断桥+Low-E三玻两腔" },
  { id: "upvc_double", name: "塑钢中空窗", kValue: 2.50, frameMaterial: "塑钢", glassType: "双层中空玻璃", layers: 2, description: "UPVC框+中空玻璃" },
  { id: "upvc_low_e", name: "Low-E塑钢窗", kValue: 1.50, frameMaterial: "塑钢", glassType: "Low-E中空玻璃", layers: 2, description: "UPVC框+Low-E中空" },
  { id: "wood_double", name: "中空玻璃木窗", kValue: 2.20, frameMaterial: "木", glassType: "双层中空玻璃", layers: 2, description: "实木框+中空玻璃" },
];

// 厚度选择器辅助函数 - 根据保温材料ID获取可选厚度
export function getInsulationThicknesses(materialId: string): number[] {
  const mat = INSULATION_MATERIALS.find((m) => m.id === materialId)
    || ROOF_INSULATION_MATERIALS.find((m) => m.id === materialId);
  return mat?.commonThicknesses || [30, 40, 50, 60, 80, 100];
}

// 获取墙体基层的默认厚度
export function getWallBaseThickness(materialId: string): number {
  const match = materialId.match(/_(\d+)$/);
  return match ? parseInt(match[1]) : 200;
}

// 获取屋面基层的默认厚度
export function getRoofBaseThickness(materialId: string): number {
  // 特殊处理：瓦屋面（含挂瓦条）等效厚度约30mm
  if (materialId === "clay_tile_roof" || materialId === "cement_tile_roof") {
    return 30;
  }
  // 特殊处理：金属屋面板（按檩条间距折算，等效厚度约50mm）
  if (materialId === "metal_roof_5") {
    return 50;
  }
  // 其他材料从ID中提取厚度
  const match = materialId.match(/_(\d+)$/);
  return match ? parseInt(match[1]) : 120;
}
