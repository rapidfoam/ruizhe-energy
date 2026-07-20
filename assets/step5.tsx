import { Component, useState, useEffect } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import { navigateTo, showLoading, hideLoading, showToast } from '@tarojs/taro'
import { evaluateAPI } from '../../services/api'
import { getEvaluationForm, saveEvaluationForm, saveEvaluationResult } from '../../store/evaluation'
import { EvaluationResult } from '../../types'
import { ROOF_TYPE_GROUPS, ROOF_INS_MATERIALS, COMPOSITE_CORE_MATERIALS, WALL_TYPES, WALL_INSULATION_TYPES, WINDOW_TYPES, BUILDING_TYPES } from '../../utils/constants'
import './step.less'

const Step5: Component = () => {
  const [formData, setFormData] = useState(getEvaluationForm)

  useEffect(() => {
    setFormData(getEvaluationForm())
  }, [])

  const handlePhoneChange = (e) => {
    const newData = { ...formData, phone: e.detail.value }
    setFormData(newData)
    saveEvaluationForm(newData)
  }

  const handlePhoneNumberSubmit = (e) => {
    console.log('获取手机号:', e.detail)
  }

  // 获取名称
  const getName = (list: any[], id: string, label: string = '') => {
    const item = list.find((i: any) => i.id === id)
    return item ? item.name : label || id
  }

  const getRoofTypeName = () => {
    for (const group of ROOF_TYPE_GROUPS) {
      const found = group.items.find((i: any) => i.id === formData.roofType)
      if (found) return found.name
    }
    return formData.roofType || '-'
  }

  const getRoofInsName = () => {
    if (formData.roofType === 'color_steel_composite') {
      const core = COMPOSITE_CORE_MATERIALS.find((i: any) => i.id === formData.selectedCoreMaterial)
      return core ? core.name : '-'
    }
    const mat = ROOF_INS_MATERIALS.find((i: any) => i.id === formData.roofInsMaterial)
    if (!mat) return '-'
    if (mat.id === 'none') return mat.name
    // 找厚度
    const thicknessOptions = (window as any).__ROOF_INS_THICKNESS_MAP
    return mat.name
  }

  const getWallTypeName = () => getName(WALL_TYPES, formData.wallType, formData.wallType)
  const getWallInsName = () => getName(WALL_INSULATION_TYPES, formData.wallInsulationType, formData.wallInsulationType)
  const getWindowName = () => getName(WINDOW_TYPES, formData.windowType, formData.windowType)
  const getBuildingName = () => getName(BUILDING_TYPES, formData.buildingType, formData.buildingType)

  // 获取保温厚度显示
  const getRoofInsThicknessDisplay = () => {
    if (formData.roofInsulationThickness > 0) {
      return formData.roofInsulationThickness + 'mm'
    }
    // 非喷涂材料的厚度从roofInsulation ID提取
    if (formData.roofInsulation && formData.roofInsulation !== 'none') {
      const parts = formData.roofInsulation.split('_')
      const lastPart = parts[parts.length - 1]
      if (/^\d+$/.test(lastPart)) {
        return lastPart + 'mm'
      }
    }
    return '-'
  }

  // 获取屋面厚度显示
  const getRoofThicknessDisplay = () => {
    if (formData.roofThickness > 0) {
      // 彩钢瓦和挂瓦类用mm，其他用m
      if (formData.roofType === 'color_steel_tile' || formData.roofType === 'light_steel_tiled' || formData.roofType === 'wood_tiled') {
        return (formData.roofThickness * 1000) + 'mm'
      }
      return (formData.roofThickness * 1000) + 'mm'
    }
    return '-'
  }

  const handleSubmit = async () => {
    if (!formData.phone) {
      showToast({ title: '请输入手机号', icon: 'none' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    // 构建API提交数据（字段名对齐后端API）
    const submitData = {
      buildingType: formData.buildingType,
      city: formData.city,
      buildingArea: formData.floorArea,
      buildingFloors: formData.floors,
      wallType: formData.wallType,
      wallThickness: formData.wallThickness,
      wallInsulation: formData.wallInsulationType,
      wallInsulationThickness: formData.wallInsulationThickness || undefined,
      roofType: formData.roofType,
      roofThickness: formData.roofThickness,
      roofInsulation: formData.roofInsulation,
      windowType: formData.windowType,
      phone: formData.phone,
    }

    // 喷涂聚氨酯需单独发厚度
    if (formData.roofInsulationThickness > 0) {
      submitData.roofInsulationThickness = formData.roofInsulationThickness
    }

    try {
      showLoading({ title: '评估中...' })
      const evalResult = await evaluateAPI(submitData as any)
      hideLoading()

      if (evalResult.success) {
        saveEvaluationResult(evalResult)
        setResult(evalResult)
        navigateTo({ url: '/pages/report/index' })
      } else {
        showToast({ title: '评估失败，请重试', icon: 'none' })
      }
    } catch (error) {
      hideLoading()
      console.error('评估失败:', error)
      showToast({ title: '网络错误，请检查网络后重试', icon: 'none' })
    }
  }

  const [result, setResult] = useState<EvaluationResult | null>(null)

  const handlePrev = () => {
    navigateTo({ url: '/pages/evaluate/step4' })
  }

  return (
    <View className="step-container">
      {/* 进度条 */}
      <View className="progress-section">
        <View className="progress-bar">
          <View className="progress-bar-fill" style="width: 100%"></View>
        </View>
        <View className="step-indicator">
          <View className="step-dot completed">✓</View>
          <View className="step-line completed"></View>
          <View className="step-dot completed">✓</View>
          <View className="step-line completed"></View>
          <View className="step-dot completed">✓</View>
          <View className="step-line completed"></View>
          <View className="step-dot completed">✓</View>
          <View className="step-line completed"></View>
          <View className="step-dot active">5</View>
        </View>
        <Text className="step-title">Step 5: 提交评估</Text>
      </View>

      {/* 信息确认 */}
      <View className="form-section">
        <View className="form-item">
          <Text className="form-label">基本信息</Text>
          <View className="summary-card">
            <View className="summary-row">
              <Text className="summary-label">建筑类型</Text>
              <Text className="summary-value">{getBuildingName()}</Text>
            </View>
            <View className="summary-row">
              <Text className="summary-label">城市</Text>
              <Text className="summary-value">{formData.city}</Text>
            </View>
            <View className="summary-row">
              <Text className="summary-label">建筑面积</Text>
              <Text className="summary-value">{formData.floorArea} m²</Text>
            </View>
            <View className="summary-row">
              <Text className="summary-label">建筑层数</Text>
              <Text className="summary-value">{formData.floors} 层</Text>
            </View>
          </View>
        </View>

        <View className="form-item">
          <Text className="form-label">外墙构造</Text>
          <View className="summary-card">
            <View className="summary-row">
              <Text className="summary-label">墙体类型</Text>
              <Text className="summary-value">{getWallTypeName()}</Text>
            </View>
            <View className="summary-row">
              <Text className="summary-label">墙体厚度</Text>
              <Text className="summary-value">{formData.wallThickness}mm</Text>
            </View>
            <View className="summary-row">
              <Text className="summary-label">保温材料</Text>
              <Text className="summary-value">{getWallInsName()}</Text>
            </View>
            {formData.wallInsulationThickness > 0 && (
              <View className="summary-row">
                <Text className="summary-label">保温厚度</Text>
                <Text className="summary-value">{formData.wallInsulationThickness}mm</Text>
              </View>
            )}
          </View>
        </View>

        <View className="form-item">
          <Text className="form-label">屋面构造</Text>
          <View className="summary-card">
            <View className="summary-row">
              <Text className="summary-label">屋面类型</Text>
              <Text className="summary-value">{getRoofTypeName()}</Text>
            </View>
            <View className="summary-row">
              <Text className="summary-label">{formData.roofType === 'color_steel_composite' ? '复合板厚度' : '屋面厚度'}</Text>
              <Text className="summary-value">{getRoofThicknessDisplay()}</Text>
            </View>
            <View className="summary-row">
              <Text className="summary-label">{formData.roofType === 'color_steel_composite' ? '芯材类型' : '保温材料'}</Text>
              <Text className="summary-value">{getRoofInsName()}</Text>
            </View>
            {formData.roofType !== 'color_steel_composite' && formData.roofInsMaterial && formData.roofInsMaterial !== 'none' && (
              <View className="summary-row">
                <Text className="summary-label">保温厚度</Text>
                <Text className="summary-value">{getRoofInsThicknessDisplay()}</Text>
              </View>
            )}
          </View>
        </View>

        <View className="form-item">
          <Text className="form-label">外窗类型</Text>
          <View className="summary-card">
            <View className="summary-row">
              <Text className="summary-label">窗户类型</Text>
              <Text className="summary-value">{getWindowName()}</Text>
            </View>
          </View>
        </View>

        {/* 手机号输入 */}
        <View className="form-item">
          <Text className="form-label">手机号（用于接收评估结果）</Text>
          <Input
            type="number"
            className="form-input"
            placeholder="请输入手机号"
            maxlength={11}
            value={formData.phone || ''}
            onInput={handlePhoneChange}
          />
        </View>

        {/* 微信一键获取手机号 */}
        <View className="form-item">
          <Button
            className="wechat-phone-btn"
            open-type="getPhoneNumber"
            onGetPhoneNumber={handlePhoneNumberSubmit}
          >
            微信一键获取手机号
          </Button>
        </View>

        {/* 声明 */}
        <View className="form-item">
          <View className="declaration">
            <Text className="declaration-icon">ℹ️</Text>
            <Text className="declaration-text">
              您的信息将仅用于建筑能效评估服务，我们承诺保护您的隐私安全。
            </Text>
          </View>
        </View>
      </View>

      {/* 按钮区域 */}
      <View className="btn-section">
        <View className="btn-group">
          <Button className="btn-secondary" onClick={handlePrev}>‹ 上一步</Button>
          <Button className="btn-primary" onClick={handleSubmit}>提交评估</Button>
        </View>
      </View>
    </View>
  )
}

export default Step5
