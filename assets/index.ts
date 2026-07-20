// 建筑类型
export type BuildingType = 'residential' | 'office' | 'hotel' | 'factory'

// 墙体类型
export type WallType = 'solid_brick' | 'porous_brick' | 'aerated_concrete_block' | 'concrete_shear_wall' | 'hollow_concrete_block' | 'light_wood_wall' | 'light_steel_wall'

// 墙体保温类型
export type WallInsulationType = 'eps_board' | 'seps_board' | 'xps_board' | 'pu_board' | 'pu_spray' | 'water_based_pu_spray' | 'pir_board' | 'rock_wool_board' | 'glass_wool_board' | 'phenolic_board' | 'aerated_concrete_insulation' | 'none'

// 屋面类型（对齐小程序）
export type RoofType = 'concrete_flat' | 'concrete_slope' | 'color_steel_composite' | 'color_steel_tile' | 'light_steel_tiled' | 'wood_tiled'

// 屋面保温材料
export type RoofInsMaterial = 'xps' | 'eps' | 'rockwool' | 'pu_board' | 'pu_spray' | 'water_based_pu_spray' | 'none'

// 彩钢复合板芯材
export type CoreMaterial = 'eps_core' | 'pu_core' | 'rockwool_core'

// 窗户类型
export type WindowType = 'single_alu' | 'single_wood' | 'double_alu' | 'double_bridge_alu' | 'double_bridge_low_e' | 'triple_bridge_low_e' | 'upvc_double' | 'upvc_low_e' | 'wood_double'

// 评估表单数据
export interface EvaluationForm {
  // Step1
  city: string
  buildingType: BuildingType
  floorArea: number
  floors: number
  // Step2
  wallType: WallType
  wallInsulationType: WallInsulationType
  wallThickness: number
  wallInsulationThickness: number
  // Step3
  roofType: RoofType
  roofThickness: number
  roofInsMaterial: RoofInsMaterial
  roofInsulation: string
  roofInsulationThickness: number
  selectedCoreMaterial: CoreMaterial
  // Step4
  windowType: WindowType
  // Step5
  phone: string
}

// 评估结果
export interface EvaluationResult {
  success: boolean
  data: {
    city: string
    climateZone: string
    buildingType: string
    wallK: number
    wallLimit: number
    wallStatus: 'pass' | 'fail'
    wallOverPercent: number
    roofK: number
    roofLimit: number
    roofStatus: 'pass' | 'fail'
    roofOverPercent: number
    windowK: number
    windowLimit: number
    windowStatus: 'pass' | 'fail'
    windowOverPercent: number
    rating: 'A' | 'B' | 'C' | 'D' | 'E'
    score: number
    heatLoss: {
      wall: number
      roof: number
      window: number
    }
    suggestions: string[]
  }
}

// 评级颜色
export const RATING_COLORS = {
  A: '#52C41A',
  B: '#1890FF',
  C: '#FA8C16',
  D: '#F5222D',
  E: '#8C8C8C',
} as const

// 评级文字
export const RATING_TEXT = {
  A: '优秀',
  B: '良好',
  C: '合格',
  D: '较差',
  E: '不达标',
} as const
