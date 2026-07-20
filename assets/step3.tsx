import { Component, useState, useEffect } from 'react'
import { View, Text, Input } from '@tarojs/components'
import { navigateTo, showToast } from '@tarojs/taro'
import {
  ROOF_TYPE_GROUPS,
  ROOF_THICKNESS_MAP,
  COMPOSITE_CORE_MATERIALS,
  ROOF_INS_MATERIALS,
  ROOF_INS_THICKNESS_MAP,
} from '../../utils/constants'
import { RoofType, RoofInsMaterial, CoreMaterial } from '../../types'
import { getEvaluationForm, saveEvaluationForm } from '../../store/evaluation'
import './step.less'

const Step3: Component = () => {
  const [formData, setFormData] = useState(getEvaluationForm)
  const [roofThicknessOptions, setRoofThicknessOptions] = useState<any[]>([])
  const [roofInsThicknessOptions, setRoofInsThicknessOptions] = useState<any[]>([])
  const [isCompositeRoof, setIsCompositeRoof] = useState(false)
  const [showRoofInsThickness, setShowRoofInsThickness] = useState(false)

  useEffect(() => {
    const data = getEvaluationForm()
    setFormData(data)
    // 恢复UI状态
    if (data.roofType) {
      const isComposite = data.roofType === 'color_steel_composite'
      setIsCompositeRoof(isComposite)
      setRoofThicknessOptions(ROOF_THICKNESS_MAP[data.roofType] || [])
      if (!isComposite && data.roofInsMaterial) {
        const isNone = data.roofInsMaterial === 'none'
        const isSpray = data.roofInsMaterial === 'pu_spray' || data.roofInsMaterial === 'water_based_pu_spray'
        setShowRoofInsThickness(!isNone)
        if (!isNone) {
          setRoofInsThicknessOptions(ROOF_INS_THICKNESS_MAP[data.roofInsMaterial] || [])
        }
      }
    }
  }, [])

  const handleRoofTypeChange = (type: RoofType, name: string) => {
    const thicknessOptions = ROOF_THICKNESS_MAP[type] || []
    const isComposite = type === 'color_steel_composite'
    const newData = {
      ...formData,
      roofType: type,
      roofThickness: 0,
      roofInsMaterial: '' as any,
      roofInsulation: '',
      roofInsulationThickness: 0,
      selectedCoreMaterial: '' as any,
    }
    setFormData(newData)
    saveEvaluationForm(newData)
    setRoofThicknessOptions(thicknessOptions)
    setIsCompositeRoof(isComposite)
    setShowRoofInsThickness(false)
    setRoofInsThicknessOptions([])
  }

  const handleRoofThicknessChange = (id: string, value: number, name: string) => {
    const newData = { ...formData, roofThickness: value }
    setFormData(newData)
    saveEvaluationForm(newData)
  }

  const handleCoreMaterialChange = (material: CoreMaterial) => {
    const newData = {
      ...formData,
      selectedCoreMaterial: material,
      roofInsulation: material,
    }
    setFormData(newData)
    saveEvaluationForm(newData)
  }

  const handleRoofInsMaterialChange = (material: RoofInsMaterial) => {
    const isNone = material === 'none'
    const isSpray = material === 'pu_spray' || material === 'water_based_pu_spray'
    const thicknessOptions = ROOF_INS_THICKNESS_MAP[material] || []

    const newData = {
      ...formData,
      roofInsMaterial: material,
      roofInsulation: isNone ? 'none' : '',
      roofInsulationThickness: 0,
    }
    setFormData(newData)
    saveEvaluationForm(newData)
    setShowRoofInsThickness(!isNone)
    setRoofInsThicknessOptions(isNone ? [] : thicknessOptions)
  }

  const handleRoofInsThicknessChange = (id: string, name: string) => {
    const materialId = formData.roofInsMaterial
    const isSpray = materialId === 'pu_spray' || materialId === 'water_based_pu_spray'
    const parts = id.split('_')
    const thicknessValue = parseInt(parts[parts.length - 1]) || 0

    const newData = {
      ...formData,
      roofInsulation: isSpray ? materialId : id,
      roofInsulationThickness: isSpray ? thicknessValue : 0,
    }
    setFormData(newData)
    saveEvaluationForm(newData)
  }

  const handleNext = () => {
    if (!formData.roofType) {
      showToast({ title: '请选择屋面类型', icon: 'none' })
      return
    }
    if (formData.roofThickness === 0) {
      showToast({ title: '请选择屋面厚度', icon: 'none' })
      return
    }
    if (isCompositeRoof) {
      if (!formData.selectedCoreMaterial) {
        showToast({ title: '请选择芯材类型', icon: 'none' })
        return
      }
    } else {
      if (!formData.roofInsMaterial) {
        showToast({ title: '请选择屋面保温材料', icon: 'none' })
        return
      }
      if (showRoofInsThickness && !formData.roofInsulation) {
        showToast({ title: '请选择保温层厚度', icon: 'none' })
        return
      }
    }
    navigateTo({ url: '/pages/evaluate/step4' })
  }

  const handlePrev = () => {
    navigateTo({ url: '/pages/evaluate/step2' })
  }

  // 获取选中的厚度选项ID
  const getSelectedRoofThicknessId = () => {
    const options = ROOF_THICKNESS_MAP[formData.roofType] || []
    const found = options.find((o: any) => o.value === formData.roofThickness)
    return found ? found.id : ''
  }

  return (
    <View className="step-container">
      {/* 进度条 */}
      <View className="progress-section">
        <View className="progress-bar">
          <View className="progress-bar-fill" style="width: 60%"></View>
        </View>
        <View className="step-indicator">
          <View className="step-dot completed">✓</View>
          <View className="step-line completed"></View>
          <View className="step-dot completed">✓</View>
          <View className="step-line completed"></View>
          <View className="step-dot active">3</View>
          <View className="step-line"></View>
          <View className="step-dot">4</View>
          <View className="step-line"></View>
          <View className="step-dot">5</View>
        </View>
        <Text className="step-title">Step 3: 屋面构造</Text>
      </View>

      <View className="form-section">
        {/* 屋面类型 - 分组显示 */}
        <View className="form-item">
          <Text className="form-label">屋面类型</Text>
          {ROOF_TYPE_GROUPS.map((group) => (
            <View key={group.label} style={{ marginBottom: '16rpx' }}>
              <Text style={{ fontSize: '24rpx', color: '#999', display: 'block', marginBottom: '8rpx' }}>{group.label}</Text>
              <View className="selector-grid">
                {group.items.map((item) => (
                  <View
                    key={item.id}
                    className={`selector-item ${formData.roofType === item.id ? 'selected' : ''}`}
                    onClick={() => handleRoofTypeChange(item.id, item.name)}
                  >
                    <Text className="selector-item-text">{item.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* 屋面厚度 - chip选择 */}
        {roofThicknessOptions.length > 0 && (
          <View className="form-item">
            <Text className="form-label">{isCompositeRoof ? '复合板厚度（含芯材）' : '屋面厚度'}</Text>
            <View className="selector-grid">
              {roofThicknessOptions.map((item) => (
                <View
                  key={item.id}
                  className={`selector-item ${getSelectedRoofThicknessId() === item.id ? 'selected' : ''}`}
                  onClick={() => handleRoofThicknessChange(item.id, item.value, item.name)}
                >
                  <Text className="selector-item-text">{item.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 彩钢复合板 → 选芯材 */}
        {isCompositeRoof && (
          <View className="form-item">
            <Text className="form-label">芯材类型</Text>
            <View className="selector-grid">
              {COMPOSITE_CORE_MATERIALS.map((item) => (
                <View
                  key={item.id}
                  className={`selector-item ${formData.selectedCoreMaterial === item.id ? 'selected' : ''}`}
                  onClick={() => handleCoreMaterialChange(item.id)}
                >
                  <Text className="selector-item-text">{item.name}</Text>
                  <Text style={{ fontSize: '22rpx', color: '#999' }}>{item.desc}</Text>
                </View>
              ))}
            </View>
            <Text className="form-hint">复合板芯材内置，无需单独选保温层</Text>
          </View>
        )}

        {/* 非复合板 → 选保温材料 */}
        {!isCompositeRoof && formData.roofType && (
          <View className="form-item">
            <Text className="form-label">屋面保温材料</Text>
            <View className="selector-grid">
              {ROOF_INS_MATERIALS.map((item) => (
                <View
                  key={item.id}
                  className={`selector-item ${formData.roofInsMaterial === item.id ? 'selected' : ''}`}
                  onClick={() => handleRoofInsMaterialChange(item.id)}
                >
                  <Text className="selector-item-text">{item.name}</Text>
                  <Text style={{ fontSize: '22rpx', color: '#999' }}>{item.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 保温层厚度 */}
        {showRoofInsThickness && roofInsThicknessOptions.length > 0 && (
          <View className="form-item">
            <Text className="form-label">保温层厚度</Text>
            <View className="selector-grid">
              {roofInsThicknessOptions.map((item) => (
                <View
                  key={item.id}
                  className={`selector-item ${formData.roofInsulation === item.id || (formData.roofInsulation === formData.roofInsMaterial && formData.roofInsulationThickness === parseInt(item.id.split('_').pop())) ? 'selected' : ''}`}
                  onClick={() => handleRoofInsThicknessChange(item.id, item.name)}
                >
                  <Text className="selector-item-text">{item.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* 按钮区域 */}
      <View className="btn-section">
        <View className="btn-group">
          <View className="btn-secondary" onClick={handlePrev}>‹ 上一步</View>
          <View className="btn-primary" onClick={handleNext}>下一步：外窗类型 ›</View>
        </View>
      </View>
    </View>
  )
}

export default Step3
