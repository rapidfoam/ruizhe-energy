// ChatAssess Constants and Smart Defaults
import type { ClimateZone, BuildingType, SmartDefaults } from "./types";

export const YEAR_LABELS: Record<string, string> = {
  after2020: "2020年以后",
  "2016_2020": "2016-2020",
  "2011_2015": "2011-2015",
  "2006_2010": "2006-2010",
  before2005: "2005年以前",
  unknown: "不确定",
};

export function getSmartDefaults(zone: ClimateZone, buildingType: BuildingType, year: string): SmartDefaults {
  const isCold = zone === "severe_cold" || zone === "cold";
  const isHotCold = zone === "hot_summer_cold_winter";
  const isHotWarm = zone === "hot_summer_warm_winter";
  const isResidential = buildingType === "residential";

  // Wall defaults
  let wallType = "aerated_concrete_block";
  let wallThickness = 200;
  if (zone === "severe_cold" || zone === "cold") {
    wallType = "concrete_shear_wall";
    wallThickness = 250;
  } else if (isResidential) {
    wallType = "aerated_concrete_block";
    wallThickness = 200;
  }

  // Insulation defaults
  let wallInsulation = "eps_board";
  let wallInsulationThickness = 50;
  if (isCold) {
    wallInsulation = "seps_board";
    wallInsulationThickness = year === "before2005" ? 40 : 60;
  } else if (isHotCold) {
    wallInsulation = "eps_board";
    wallInsulationThickness = year === "before2005" ? 30 : 50;
  } else if (isHotWarm) {
    wallInsulation = "eps_board";
    wallInsulationThickness = 30;
  }

  // Roof defaults
  let roofType = "concrete_roof";
  let roofThickness = 120;
  if (isResidential && (zone === "hot_summer_cold_winter" || zone === "hot_summer_warm_winter")) {
    roofType = "clay_tile_roof";
    roofThickness = 30;
  }

  // Roof insulation defaults
  let roofInsulation = "roof_xps_50";
  let roofInsulationThickness = 50;
  if (isCold) {
    roofInsulation = "roof_xps_60";
    roofInsulationThickness = 60;
  } else if (isHotWarm) {
    roofInsulation = "roof_xps_40";
    roofInsulationThickness = 40;
  }

  // Window defaults
  let windowConfig = "double_bridge_alu";
  if (year === "before2005") {
    windowConfig = "double_alu";
  } else if (year === "after2020" || year === "2016_2020") {
    windowConfig = "double_bridge_low_e";
  }

  return {
    wallType, wallThickness, wallInsulation, wallInsulationThickness,
    roofType, roofThickness, roofInsulation, roofInsulationThickness,
    windowConfig,
  };
}
