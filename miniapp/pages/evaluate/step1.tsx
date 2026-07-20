import { Component, useState, useEffect } from 'react'
import { View, Text, Input, Picker } from '@tarojs/components'
import { navigateTo, showToast } from '@tarojs/taro'
import { CITIES, BUILDING_TYPES, BUILDING_SHAPES } from '../../utils/constants'
import { BuildingType, BuildingShape } from '../../types'
import { getEvaluationForm, saveEvaluationForm } from '../../store/evaluation'
import './step.less'

const Step1: Component = () => {
  const [formData, setFormData] = useState(getEvaluationForm)

  useEffect(() => {
    setFormData(getEvaluationForm())
  }, [])

  const handleCityChange = (e) => {
    const index = e.detail.value
    const newData = { ...formData, city: CITIES[index] }
    setFormData(newData)
    saveEvaluationForm(newData)
  }

  const handleBuildingTypeChange = (type: BuildingType) => {
    const newData = { ...formData, buildingType: type }
    setFormData(newData)
    saveEvaluationForm(newData)
  }

  const handleBuildingShapeChange = (e) => {
    const index = e.detail.value
    const newData = { ...formData, buildingShape: BUILDING_SHAPES[index].id }
    setFormData(newData)
    saveEvaluationForm(newData)
  }

  const handleFloorAreaChange = (e) => {
    const value = parseInt(e.detail.value) || 0
    const newData = { ...formData, floorArea: value }
    setFormData(newData)
    saveEvaluationForm(newData)
  }

  const handleFloorsChange = (e) => {
    const value = parseInt(e.detail.value) || 1
    const newData = { ...formData, floors: value }
    setFormData(newData)
    saveEvaluationForm(newData)
  }

  const handleNext = () => {
    if (!formData.city) {
      showToast({ title: '请选择城市', icon: 'none' })
      return
    }
    if (!formData.buildingType) {
      showToast({ title: '请选择建筑类型', icon: 'none' })
      return
    }
    if (!formData.floorArea || formData.floorArea <= 0) {
      showToast({ title: '请输入有效的建筑面积', icon: 'none' })
      return
    }
    if (formData.floorArea > 10000) {
      showToast({ title: '建筑面积不能超过10000m²', icon: 'none' })
      return
    }
    if (!formData.floors || formData.floors <= 0) {
      showToast({ title: '请输入有效的楼层数', icon: 'none' })
      return
    }
    if (formData.floors > 10) {
      showToast({ title: '楼层数不能超过10层', icon: 'none' })
      return
    }
    navigateTo({
      url: '/pages/evaluate/step2',
    })
  }

  const cityIndex = CITIES.indexOf(formData.city)
  const shapeIndex = BUILDING_SHAPES.findIndex(s => s.id === formData.buildingShape)

  return (
    <View className="step-container">
      {/* 进度条 */}
      <View className="progress-section">
        <View className="progress-bar">
          <View className="progress-bar-fill" style="width: 20%"></View>
        </View>
        <View className="step-indicator">
          <View className="step-dot active">1</View>
          <View className="step-line"></View>
          <View className="step-dot">2</View>
          <View className="step-line"></View>
          <View className="step-dot">3</View>
          <View className="step-line"></View>
          <View className="step-dot">4</View>
          <View className="step-line"></View>
          <View className="step-dot">5</View>
        </View>
        <Text className="step-title">Step 1: 基础信息</Text>
      </View>

      {/* 城市选择 */}
      <View className="form-section">
        <View className="form-item">
          <Text className="form-label">所在城市</Text>
          <Picker
            mode="selector"
            range={CITIES}
            onChange={handleCityChange}
            value={cityIndex >= 0 ? cityIndex : 0}
          >
            <View className="picker-view">
              <Text className={formData.city ? 'picker-value' : 'picker-placeholder'}>
                {formData.city || '请选择城市'}
              </Text>
              <Text className="picker-arrow">›</Text>
            </View>
          </Picker>
        </View>

        {/* 建筑类型 */}
        <View className="form-item">
          <Text className="form-label">建筑类型</Text>
          <View className="selector-grid">
            {BUILDING_TYPES.map((type) => (
              <View
                key={type.id}
                className={`selector-item ${formData.buildingType === type.id ? 'selected' : ''}`}
                onClick={() => handleBuildingTypeChange(type.id)}
              >
                <Text className="selector-item-icon">
                  {type.id === 'residential' ? '🏠' :
                   type.id === 'office' ? '🏢' :
                   type.id === 'hotel' ? '🏨' : '🏭'}
                </Text>
                <Text className="selector-item-text">{type.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 建筑形状 */}
        <View className="form-item">
          <Text className="form-label">建筑形状</Text>
          <Picker
            mode="selector"
            range={BUILDING_SHAPES}
            rangeKey="name"
            onChange={handleBuildingShapeChange}
            value={shapeIndex >= 0 ? shapeIndex : 0}
          >
            <View className="picker-view">
              <Text className={formData.buildingShape ? 'picker-value' : 'picker-placeholder'}>
                {BUILDING_SHAPES.find(s => s.id === formData.buildingShape)?.name || '请选择建筑形状'}
              </Text>
              <Text className="picker-arrow">›</Text>
            </View>
          </Picker>
        </View>

        {/* 建筑面积 */}
        <View className="form-item">
          <Text className="form-label">建筑面积 (m²)</Text>
          <Input
            type="number"
            className="form-input"
            placeholder="请输入建筑面积"
            value={formData.floorArea || ''}
            onInput={handleFloorAreaChange}
          />
        </View>

        {/* 楼层数 */}
        <View className="form-item">
          <Text className="form-label">楼层数</Text>
          <Input
            type="number"
            className="form-input"
            placeholder="请输入楼层数"
            value={formData.floors || ''}
            onInput={handleFloorsChange}
          />
        </View>
      </View>

      {/* 下一步按钮 */}
      <View className="btn-section">
        <Button className="btn-primary" onClick={handleNext}>
          下一步：外墙构造 ›
        </Button>
      </View>
    </View>
  )
}

export default Step1
