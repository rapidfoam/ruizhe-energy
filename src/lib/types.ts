// 表单数据类型定义

import type { ClimateZone } from "./data/climate";
import type { BuildingType } from "./data/building-types";

export interface FormData {
  // Step 1: 城市选择
  city: string;
  climateZone: ClimateZone | null;

  // Step 2: 建筑类型
  buildingType: BuildingType | null;

  // Step 2b: 建筑规模
  buildingArea: number | null; // 占地面积(m²)
  buildingFloors: number | null; // 层数

  // Step 3: 外墙构造
  wallType: string; // 墙体类型ID
  wallThickness: number; // mm
  wallInsulation: string; // 保温材料ID
  wallInsulationThickness: number; // mm

  // Step 4: 屋面构造
  roofType: string; // 屋顶类型ID
  roofThickness: number; // mm
  roofInsulation: string; // 保温材料ID
  roofInsulationThickness: number; // mm

  // Step 5: 外窗配置
  windowConfig: string; // 窗户配置ID
}

export const INITIAL_FORM_DATA: FormData = {
  city: "",
  climateZone: null,
  buildingType: null,
  buildingArea: null,
  buildingFloors: null,
  wallType: "",
  wallThickness: 200,
  wallInsulation: "",
  wallInsulationThickness: 50,
  roofType: "",
  roofThickness: 120,
  roofInsulation: "",
  roofInsulationThickness: 50,
  windowConfig: "",
};

export interface EvaluationResult {
  wallK: number;
  roofK: number;
  windowK: number;
  wallLimit: number;
  roofLimit: number;
  windowLimit: number;
  wallPass: boolean;
  roofPass: boolean;
  windowPass: boolean;
  wallExcess: number;
  roofExcess: number;
  windowExcess: number;
  rating: "A" | "B" | "C" | "D" | "E";
  score: number;
  heatLoss: {
    wall: number;
    roof: number;
    window: number;
    infiltration: number;
  };
  wallLayers: { name: string; thickness: number; resistance: number; lambdaC: number }[];
  roofLayers: { name: string; thickness: number; resistance: number; lambdaC: number }[];
  wallTotalResistance: number;
  roofTotalResistance: number;
  buildingArea?: number | null;
  buildingFloors?: number | null;
  shapeCoefficient?: number | null;
  timestamp: string;
}
