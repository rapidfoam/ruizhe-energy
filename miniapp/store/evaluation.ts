import Taro from '@tarojs/taro'
import { EvaluationForm, EvaluationResult } from '../types'

// 存储键名
const STORAGE_KEY = 'ruizhu_evaluation'

// 获取评估表单数据
export const getEvaluationForm = (): EvaluationForm => {
  try {
    const data = Taro.getStorageSync(STORAGE_KEY)
    if (data) {
      return { ...getDefaultForm(), ...JSON.parse(data) }
    }
  } catch (e) {
    console.error('获取评估表单失败:', e)
  }
  return getDefaultForm()
}

// 保存评估表单数据
export const saveEvaluationForm = (form: EvaluationForm): void => {
  try {
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(form))
  } catch (e) {
    console.error('保存评估表单失败:', e)
  }
}

// 获取评估结果
export const getEvaluationResult = (): EvaluationResult | null => {
  try {
    const data = Taro.getStorageSync(`${STORAGE_KEY}_result`)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('获取评估结果失败:', e)
  }
  return null
}

// 保存评估结果
export const saveEvaluationResult = (result: EvaluationResult): void => {
  try {
    Taro.setStorageSync(`${STORAGE_KEY}_result`, JSON.stringify(result))
  } catch (e) {
    console.error('保存评估结果失败:', e)
  }
}

// 重置评估数据
export const resetEvaluationData = (): void => {
  try {
    Taro.removeStorageSync(STORAGE_KEY)
    Taro.removeStorageSync(`${STORAGE_KEY}_result`)
  } catch (e) {
    console.error('重置评估数据失败:', e)
  }
}

// 默认表单数据
export const getDefaultForm = (): EvaluationForm => ({
  city: '',
  buildingType: '' as any,
  floorArea: 0,
  floors: 0,
  wallType: '' as any,
  wallInsulationType: '' as any,
  wallThickness: 0,
  wallInsulationThickness: 0,
  roofType: '' as any,
  roofThickness: 0,
  roofInsMaterial: '' as any,
  roofInsulation: '',
  roofInsulationThickness: 0,
  selectedCoreMaterial: '' as any,
  windowType: '' as any,
  phone: '',
})
