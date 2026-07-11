// 建筑类型定义

export type BuildingType =
  | "residential"
  | "office"
  | "hotel"
  | "factory";

export interface BuildingTypeInfo {
  id: BuildingType;
  name: string;
  description: string;
  icon: string;
  wallAreaRatio: number; // 外墙面积与建筑面积比
  roofAreaRatio: number; // 屋面面积与建筑面积比
  windowRatio: number; // 外窗面积与外墙面积比（窗墙比）
}

export const BUILDING_TYPES: BuildingTypeInfo[] = [
  {
    id: "residential",
    name: "独栋住宅",
    description: "独立式低层住宅，体形系数较大",
    icon: "home",
    wallAreaRatio: 1.2,
    roofAreaRatio: 0.35,
    windowRatio: 0.25,
  },
  {
    id: "office",
    name: "小型办公楼",
    description: "多层办公建筑，窗墙比偏高",
    icon: "building",
    wallAreaRatio: 0.8,
    roofAreaRatio: 0.2,
    windowRatio: 0.35,
  },
  {
    id: "hotel",
    name: "酒店民宿",
    description: "住宿类建筑，对舒适度要求高",
    icon: "bed",
    wallAreaRatio: 0.9,
    roofAreaRatio: 0.25,
    windowRatio: 0.30,
  },
  {
    id: "factory",
    name: "小型厂房",
    description: "工业厂房，大跨度空间",
    icon: "factory",
    wallAreaRatio: 0.6,
    roofAreaRatio: 0.25,
    windowRatio: 0.15,
  },
];

export function getBuildingType(id: BuildingType): BuildingTypeInfo {
  return BUILDING_TYPES.find((b) => b.id === id)!;
}
