import { BuildingType, WallType, WallInsulationType, RoofType, RoofInsMaterial, CoreMaterial, WindowType } from '../types'

// 城市列表
export const CITIES = [
  '北京', '上海', '广州', '深圳', '长沙', '武汉', '成都', '重庆',
  '杭州', '南京', '合肥', '南昌', '福州', '郑州', '济南', '西安',
  '昆明', '贵阳', '哈尔滨', '长春', '沈阳', '呼和浩特', '乌鲁木齐',
  '拉萨', '兰州', '太原', '石家庄', '天津', '南宁', '海口',
]

// 建筑类型选项
export const BUILDING_TYPES: { id: BuildingType; name: string; icon: string }[] = [
  { id: 'residential', name: '独栋住宅', icon: 'home' },
  { id: 'office', name: '小型办公楼', icon: 'office' },
  { id: 'hotel', name: '酒店民宿', icon: 'hotel' },
  { id: 'factory', name: '小型厂房', icon: 'factory' },
]

// 墙体类型选项
export const WALL_TYPES: { id: WallType; name: string }[] = [
  { id: 'solid_brick', name: '实心砖墙' },
  { id: 'porous_brick', name: '多孔砖墙' },
  { id: 'aerated_concrete_block', name: '蒸压加气混凝土砌块' },
  { id: 'concrete_shear_wall', name: '钢筋混凝土剪力墙' },
  { id: 'hollow_concrete_block', name: '混凝土空心砌块' },
  { id: 'light_wood_wall', name: '轻木结构墙体' },
  { id: 'light_steel_wall', name: '轻钢龙骨墙体' },
]

// 墙体保温类型选项
export const WALL_INSULATION_TYPES: { id: WallInsulationType; name: string }[] = [
  { id: 'eps_board', name: 'EPS板' },
  { id: 'seps_board', name: 'SEPS板' },
  { id: 'xps_board', name: 'XPS板' },
  { id: 'pu_board', name: '聚氨酯板' },
  { id: 'pu_spray', name: '聚氨酯喷涂' },
  { id: 'water_based_pu_spray', name: '水性聚氨酯喷涂' },
  { id: 'pir_board', name: 'PIR板' },
  { id: 'rock_wool_board', name: '岩棉板' },
  { id: 'glass_wool_board', name: '玻璃棉板' },
  { id: 'phenolic_board', name: '酚醛板' },
  { id: 'aerated_concrete_insulation', name: '加气混凝土保温' },
  { id: 'none', name: '无保温' },
]

// ==================== 屋面类型分组（对齐小程序） ====================
export const ROOF_TYPE_GROUPS: { label: string; items: { id: RoofType; name: string }[] }[] = [
  {
    label: '混凝土类',
    items: [
      { id: 'concrete_flat', name: '混凝土平屋面' },
      { id: 'concrete_slope', name: '混凝土坡屋面' },
    ],
  },
  {
    label: '彩钢类',
    items: [
      { id: 'color_steel_composite', name: '彩钢复合板屋面' },
      { id: 'color_steel_tile', name: '彩钢瓦屋面' },
    ],
  },
  {
    label: '挂瓦类',
    items: [
      { id: 'light_steel_tiled', name: '轻钢挂瓦坡屋面' },
      { id: 'wood_tiled', name: '木质挂瓦坡屋面' },
    ],
  },
]

// ==================== 屋面厚度（按类型动态匹配） ====================
export const ROOF_THICKNESS_MAP: Record<string, { id: string; value: number; name: string }[]> = {
  concrete_flat: [
    { id: 'rc100', value: 0.10, name: '100mm' },
    { id: 'rc120', value: 0.12, name: '120mm' },
    { id: 'rc150', value: 0.15, name: '150mm' },
    { id: 'rc200', value: 0.20, name: '200mm' },
  ],
  concrete_slope: [
    { id: 'rcs100', value: 0.10, name: '100mm' },
    { id: 'rcs120', value: 0.12, name: '120mm' },
    { id: 'rcs150', value: 0.15, name: '150mm' },
    { id: 'rcs200', value: 0.20, name: '200mm' },
  ],
  color_steel_composite: [
    { id: 'csc50', value: 0.05, name: '50mm' },
    { id: 'csc75', value: 0.075, name: '75mm' },
    { id: 'csc100', value: 0.10, name: '100mm' },
    { id: 'csc120', value: 0.12, name: '120mm' },
    { id: 'csc150', value: 0.15, name: '150mm' },
  ],
  color_steel_tile: [
    { id: 'cst06', value: 0.0006, name: '0.6mm' },
    { id: 'cst08', value: 0.0008, name: '0.8mm' },
    { id: 'cst10', value: 0.001, name: '1.0mm' },
  ],
  light_steel_tiled: [
    { id: 'lst12', value: 0.012, name: '12mm' },
    { id: 'lst15', value: 0.015, name: '15mm' },
    { id: 'lst18', value: 0.018, name: '18mm' },
  ],
  wood_tiled: [
    { id: 'wt15', value: 0.015, name: '15mm' },
    { id: 'wt18', value: 0.018, name: '18mm' },
    { id: 'wt20', value: 0.020, name: '20mm' },
    { id: 'wt25', value: 0.025, name: '25mm' },
  ],
}

// ==================== 彩钢复合板芯材 ====================
export const COMPOSITE_CORE_MATERIALS: { id: CoreMaterial; name: string; desc: string }[] = [
  { id: 'eps_core', name: 'EPS夹芯板', desc: '经济实用' },
  { id: 'pu_core', name: 'PU夹芯板', desc: '保温最优' },
  { id: 'rockwool_core', name: '岩棉夹芯板', desc: 'A级防火' },
]

// ==================== 屋面保温材料（非复合板屋面使用） ====================
export const ROOF_INS_MATERIALS: { id: RoofInsMaterial; name: string; desc: string }[] = [
  { id: 'xps', name: 'XPS挤塑板', desc: '闭孔结构防潮' },
  { id: 'eps', name: 'EPS聚苯板', desc: '性价比高' },
  { id: 'rockwool', name: '岩棉板', desc: 'A级防火' },
  { id: 'pu_board', name: '聚氨酯板', desc: '导热系数最低' },
  { id: 'pu_spray', name: '聚氨酯喷涂', desc: '无缝无冷桥' },
  { id: 'water_based_pu_spray', name: '水性聚氨酯喷涂', desc: '环保零甲醛' },
  { id: 'none', name: '无保温', desc: '不设保温层' },
]

// ==================== 屋面保温厚度映射 ====================
export const ROOF_INS_THICKNESS_MAP: Record<string, { id: string; name: string }[]> = {
  xps: [
    { id: 'roof_xps_40', name: '40mm' },
    { id: 'roof_xps_50', name: '50mm' },
    { id: 'roof_xps_60', name: '60mm' },
    { id: 'roof_xps_80', name: '80mm' },
  ],
  eps: [
    { id: 'roof_eps_50', name: '50mm' },
    { id: 'roof_eps_60', name: '60mm' },
    { id: 'roof_eps_80', name: '80mm' },
  ],
  rockwool: [
    { id: 'roof_rockwool_50', name: '50mm' },
    { id: 'roof_rockwool_60', name: '60mm' },
    { id: 'roof_rockwool_80', name: '80mm' },
  ],
  pu_board: [
    { id: 'roof_pu_50', name: '50mm' },
    { id: 'roof_pu_60', name: '60mm' },
    { id: 'roof_pu_80', name: '80mm' },
  ],
  pu_spray: [
    { id: 'roof_pus_30', name: '30mm' },
    { id: 'roof_pus_40', name: '40mm' },
    { id: 'roof_pus_50', name: '50mm' },
    { id: 'roof_pus_60', name: '60mm' },
    { id: 'roof_pus_80', name: '80mm' },
    { id: 'roof_pus_100', name: '100mm' },
  ],
  water_based_pu_spray: [
    { id: 'roof_wpus_30', name: '30mm' },
    { id: 'roof_wpus_40', name: '40mm' },
    { id: 'roof_wpus_50', name: '50mm' },
    { id: 'roof_wpus_60', name: '60mm' },
    { id: 'roof_wpus_80', name: '80mm' },
    { id: 'roof_wpus_100', name: '100mm' },
  ],
}

// 窗户类型选项
export const WINDOW_TYPES: { id: WindowType; name: string }[] = [
  { id: 'single_alu', name: '铝合金单玻' },
  { id: 'single_wood', name: '木窗单玻' },
  { id: 'double_alu', name: '铝合金双玻' },
  { id: 'double_bridge_alu', name: '断桥铝合金双玻' },
  { id: 'double_bridge_low_e', name: '断桥铝合金Low-E双玻' },
  { id: 'triple_bridge_low_e', name: '断桥铝合金三玻Low-E' },
  { id: 'upvc_double', name: '塑钢双玻' },
  { id: 'upvc_low_e', name: '塑钢Low-E双玻' },
  { id: 'wood_double', name: '木窗双玻' },
]

// 厚度选项（毫米）
export const THICKNESS_OPTIONS = [100, 120, 150, 180, 200, 220, 240, 250, 300, 350, 400]

// 保温厚度选项（毫米）
export const INSULATION_THICKNESS_OPTIONS = [20, 25, 30, 40, 50, 60, 80, 100]
