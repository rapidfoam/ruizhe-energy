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

// 墙体基层材料
export const WALL_MATERIALS: MaterialLayer[] = [
  { id: "solid_brick_240", name: "实心黏土砖墙 240mm", lambda: 0.81, lambdaCorrection: 1.00, lambdaCorrected: 0.81, category: "wall", density: 1800, specificHeat: 1.05, description: "标准黏土实心砖" },
  { id: "solid_brick_370", name: "实心黏土砖墙 370mm", lambda: 0.81, lambdaCorrection: 1.00, lambdaCorrected: 0.81, category: "wall", density: 1800, specificHeat: 1.05, description: "一砖半墙" },
  { id: "porous_brick_240", name: "多孔砖墙(KP1) 240mm", lambda: 0.58, lambdaCorrection: 1.00, lambdaCorrected: 0.58, category: "wall", density: 1400, specificHeat: 1.05, description: "KP1型多孔砖" },
  { id: "aerated_concrete_block_200", name: "加气混凝土砌块 200mm", lambda: 0.19, lambdaCorrection: 1.25, lambdaCorrected: 0.238, category: "wall", density: 600, specificHeat: 1.05, description: "B06级" },
  { id: "aerated_concrete_block_250", name: "加气混凝土砌块 250mm", lambda: 0.19, lambdaCorrection: 1.25, lambdaCorrected: 0.238, category: "wall", density: 600, specificHeat: 1.05, description: "B06级" },
  { id: "aerated_concrete_block_300", name: "加气混凝土砌块 300mm", lambda: 0.19, lambdaCorrection: 1.25, lambdaCorrected: 0.238, category: "wall", density: 600, specificHeat: 1.05, description: "B06级" },
  { id: "concrete_shear_wall_200", name: "钢筋混凝土剪力墙 200mm", lambda: 1.74, lambdaCorrection: 1.00, lambdaCorrected: 1.74, category: "wall", density: 2500, specificHeat: 0.92, description: "现浇混凝土" },
  { id: "concrete_shear_wall_250", name: "钢筋混凝土剪力墙 250mm", lambda: 1.74, lambdaCorrection: 1.00, lambdaCorrected: 1.74, category: "wall", density: 2500, specificHeat: 0.92, description: "现浇混凝土" },
  { id: "hollow_concrete_block_190", name: "混凝土空心砌块 190mm", lambda: 0.80, lambdaCorrection: 1.00, lambdaCorrected: 0.80, category: "wall", density: 1500, specificHeat: 0.92, description: "空心砌块" },
];

// 保温层材料
export const INSULATION_MATERIALS: MaterialLayer[] = [
  { id: "eps_board", name: "模塑聚苯板(EPS)", lambda: 0.041, lambdaCorrection: 1.15, lambdaCorrected: 0.047, category: "insulation", density: 20, combustionClass: "B1/B2", commonThicknesses: [30,40,50,60,80,100,120], description: "EPS" },
  { id: "seps_board", name: "石墨聚苯板(SEPS)", lambda: 0.033, lambdaCorrection: 1.15, lambdaCorrected: 0.038, category: "insulation", density: 20, combustionClass: "B1", commonThicknesses: [30,40,50,60,80,100,120], description: "石墨EPS" },
  { id: "xps_board", name: "挤塑聚苯板(XPS)", lambda: 0.030, lambdaCorrection: 1.10, lambdaCorrected: 0.033, category: "insulation", density: 30, combustionClass: "B1/B2", commonThicknesses: [30,40,50,60,80,100], description: "XPS" },
  { id: "pu_board", name: "聚氨酯保温板(PU)", lambda: 0.024, lambdaCorrection: 1.10, lambdaCorrected: 0.026, category: "insulation", density: 35, combustionClass: "B1/B2", commonThicknesses: [30,40,50,60,80,100], description: "硬质聚氨酯" },
  { id: "pu_spray", name: "喷涂硬泡聚氨酯(PUR)", lambda: 0.024, lambdaCorrection: 1.10, lambdaCorrected: 0.026, category: "insulation", density: 35, combustionClass: "B1/B2", commonThicknesses: [20,30,40,50,60,80], description: "喷涂聚氨酯" },
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

// 屋面基层材料
export const ROOF_MATERIALS: MaterialLayer[] = [
  { id: "concrete_roof_120", name: "钢筋混凝土屋面板 120mm", lambda: 1.74, lambdaCorrection: 1.00, lambdaCorrected: 1.74, category: "roof", density: 2500, description: "现浇混凝土板" },
  { id: "concrete_roof_150", name: "钢筋混凝土屋面板 150mm", lambda: 1.74, lambdaCorrection: 1.00, lambdaCorrected: 1.74, category: "roof", density: 2500, description: "现浇混凝土板" },
];

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
  const mat = INSULATION_MATERIALS.find((m) => m.id === materialId);
  return mat?.commonThicknesses || [30, 40, 50, 60, 80, 100];
}

// 获取墙体基层的默认厚度
export function getWallBaseThickness(materialId: string): number {
  const match = materialId.match(/_(\d+)$/);
  return match ? parseInt(match[1]) : 200;
}

// 获取屋面基层的默认厚度
export function getRoofBaseThickness(materialId: string): number {
  const match = materialId.match(/_(\d+)$/);
  return match ? parseInt(match[1]) : 120;
}
