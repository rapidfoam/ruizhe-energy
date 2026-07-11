// K值计算引擎 - 依据GB 50176-2016
// 公式: K = 1 / (Ri + Σ(δn / (λn × an)) + Re)
// Ri = 0.11 (内表面换热阻)
// Re = 0.04 (外表面换热阻)

import type { MaterialLayer } from "../data/materials";
import { getWallBaseThickness, getRoofBaseThickness } from "../data/materials";

const RI = 0.11; // 内表面换热阻 (m²·K)/W
const RE = 0.04; // 外表面换热阻 (m²·K)/W

export interface LayerCalculation {
  materialId: string;
  materialName: string;
  thickness: number; // mm
  lambda: number; // W/(m·K)
  correction: number;
  lambdaC: number; // λc = λ × a
  resistance: number; // R = δ / λc
}

export interface KValueResult {
  layers: LayerCalculation[];
  totalResistance: number; // R0 = Ri + ΣR + Re
  kValue: number; // K = 1/R0
  ri: number;
  re: number;
}

export interface WallAssemblyInput {
  baseLayer: MaterialLayer;
  insulationLayer: MaterialLayer;
  insulationThickness: number; // mm
}

export interface RoofAssemblyInput {
  baseLayer: MaterialLayer;
  insulationLayer: MaterialLayer;
  insulationThickness: number; // mm
}

function calcK(layers: { material: MaterialLayer; thickness: number }[]): KValueResult {
  const calcs: LayerCalculation[] = layers.map(({ material, thickness }) => {
    const thicknessM = thickness / 1000;
    const lambdaC = material.lambdaCorrected || material.lambda * material.lambdaCorrection;
    const resistance = lambdaC > 0 ? thicknessM / lambdaC : 0;
    return {
      materialId: material.id,
      materialName: material.name,
      thickness,
      lambda: material.lambda,
      correction: material.lambdaCorrection,
      lambdaC: Math.round(lambdaC * 10000) / 10000,
      resistance: Math.round(resistance * 10000) / 10000,
    };
  });

  const totalResistance = RI + calcs.reduce((s, l) => s + l.resistance, 0) + RE;
  const kValue = totalResistance > 0 ? Math.round((1 / totalResistance) * 10000) / 10000 : 999;

  return { layers: calcs, totalResistance: Math.round(totalResistance * 10000) / 10000, kValue, ri: RI, re: RE };
}

// 水泥砂浆抹灰层 (内外各20mm, λ=0.93 W/(m·K))
// 依据 GB 50176-2016 附录B
const CEMENT_MORTAR: MaterialLayer = {
  id: "cement_mortar",
  name: "水泥砂浆抹灰层",
  lambda: 0.93,
  lambdaCorrection: 1.0,
  lambdaCorrected: 0.93,
  category: "plaster",
  description: "内外抹灰层，各20mm",
};
const CEMENT_MORTAR_THICKNESS = 20; // mm

export function calculateWallK(input: WallAssemblyInput): KValueResult {
  const layers: { material: MaterialLayer; thickness: number }[] = [];
  
  // 外层水泥砂浆抹灰 (20mm)
  layers.push({ material: CEMENT_MORTAR, thickness: CEMENT_MORTAR_THICKNESS });
  
  // 基层墙体
  const baseThickness = getWallBaseThickness(input.baseLayer.id);
  layers.push({ material: input.baseLayer, thickness: baseThickness });

  // 保温层
  if (input.insulationLayer.id !== "none" && input.insulationThickness > 0) {
    layers.push({ material: input.insulationLayer, thickness: input.insulationThickness });
  }
  
  // 内层水泥砂浆抹灰 (20mm)
  layers.push({ material: CEMENT_MORTAR, thickness: CEMENT_MORTAR_THICKNESS });
  
  return calcK(layers);
}

export function calculateRoofK(input: RoofAssemblyInput): KValueResult {
  const layers: { material: MaterialLayer; thickness: number }[] = [];
  
  // 外层水泥砂浆抹灰/找平层 (20mm)
  layers.push({ material: CEMENT_MORTAR, thickness: CEMENT_MORTAR_THICKNESS });
  
  // 基层屋面
  const baseThickness = getRoofBaseThickness(input.baseLayer.id);
  layers.push({ material: input.baseLayer, thickness: baseThickness });

  // 保温层
  if (input.insulationLayer.id !== "roof_none" && input.insulationThickness > 0) {
    layers.push({ material: input.insulationLayer, thickness: input.insulationThickness });
  }
  
  // 内层水泥砂浆抹灰 (20mm)
  layers.push({ material: CEMENT_MORTAR, thickness: CEMENT_MORTAR_THICKNESS });
  
  return calcK(layers);
}

// 热损失分布估算
export interface HeatLossDistribution {
  wall: number;
  roof: number;
  window: number;
  infiltration: number;
}

export function estimateHeatLoss(
  wallK: number, roofK: number, windowK: number,
  wallAreaRatio: number, roofAreaRatio: number, windowRatio: number
): HeatLossDistribution {
  const wallArea = wallAreaRatio;
  const roofArea = roofAreaRatio;
  const windowArea = wallAreaRatio * windowRatio;

  const wallLoss = wallK * wallArea;
  const roofLoss = roofK * roofArea;
  const windowLoss = windowK * windowArea;
  const infiltrationLoss = (wallLoss + roofLoss + windowLoss) * 0.2;

  const total = wallLoss + roofLoss + windowLoss + infiltrationLoss;
  if (total === 0) return { wall: 0, roof: 0, window: 0, infiltration: 0 };

  const wallPct = Math.round((wallLoss / total) * 100);
  const roofPct = Math.round((roofLoss / total) * 100);
  const windowPct = Math.round((windowLoss / total) * 100);

  return {
    wall: wallPct,
    roof: roofPct,
    window: windowPct,
    infiltration: 100 - wallPct - roofPct - windowPct,
  };
}

// 综合评级
export type EnergyRating = "A" | "B" | "C" | "D" | "E";

export interface RatingResult {
  rating: EnergyRating;
  score: number;
  wallStatus: "pass" | "fail";
  roofStatus: "pass" | "fail";
  windowStatus: "pass" | "fail";
  wallExcess: number;
  roofExcess: number;
  windowExcess: number;
}

export function calculateRating(
  wallK: number, roofK: number, windowK: number,
  wallLimit: number, roofLimit: number, windowLimit: number
): RatingResult {
  const wallExcess = ((wallK - wallLimit) / wallLimit) * 100;
  const roofExcess = ((roofK - roofLimit) / roofLimit) * 100;
  const windowExcess = ((windowK - windowLimit) / windowLimit) * 100;

  const wallStatus = wallK <= wallLimit ? "pass" : "fail";
  const roofStatus = roofK <= roofLimit ? "pass" : "fail";
  const windowStatus = windowK <= windowLimit ? "pass" : "fail";

  const wallScore = wallStatus === "pass" ? 100 : Math.max(0, 100 - wallExcess);
  const roofScore = roofStatus === "pass" ? 100 : Math.max(0, 100 - roofExcess);
  const windowScore = windowStatus === "pass" ? 100 : Math.max(0, 100 - windowExcess);

  const score = Math.round((wallScore + roofScore + windowScore) / 3);

  let rating: EnergyRating;
  if (score >= 90) rating = "A";
  else if (score >= 75) rating = "B";
  else if (score >= 60) rating = "C";
  else if (score >= 40) rating = "D";
  else rating = "E";

  return {
    rating, score,
    wallStatus, roofStatus, windowStatus,
    wallExcess: Math.round(wallExcess * 10) / 10,
    roofExcess: Math.round(roofExcess * 10) / 10,
    windowExcess: Math.round(windowExcess * 10) / 10,
  };
}
