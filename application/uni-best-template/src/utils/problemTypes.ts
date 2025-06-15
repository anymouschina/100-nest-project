// 问题类型配置
export const PROBLEM_TYPES = [
  { value: 'waterproof', label: '防水补漏' },
  { value: 'wallRenovation', label: '墙面翻新' },
  { value: 'tileRepair', label: '瓷砖修复' },
  { value: 'localRenovation', label: '局部改造' },
  { value: 'other', label: '其它维修' },
  { value: 'materialPurchase', label: '材料选购' },
]

// 子类型选项映射
export const SUB_TYPE_OPTIONS_MAP = {
  // 防水补漏的子类型
  waterproof: [
    { value: 'bathroom', label: '卫生间' },
    { value: 'kitchen', label: '厨房' },
    { value: 'window', label: '窗户' },
    { value: 'exteriorWall', label: '外墙' },
    { value: 'roof', label: '屋面' },
    { value: 'basement', label: '地下室' },
    { value: 'other', label: '其它' },
  ],
  // 墙面翻新的子类型
  wallRenovation: [
    { value: 'wholeHouse', label: '全屋翻新' },
    { value: 'partial', label: '局部翻新' },
    { value: 'repair', label: '墙面维修' },
    { value: 'other', label: '其它' },
  ],
  // 瓷砖修复的子类型
  tileRepair: [
    { value: 'hollow', label: '瓷砖空鼓' },
    { value: 'falling', label: '瓷砖脱落' },
    { value: 'broken', label: '瓷砖破损' },
    { value: 'recolor', label: '瓷砖改色' },
    { value: 'other', label: '其它' },
  ],
  // 局部改造的子类型
  localRenovation: [
    { value: 'kitchenBathroom', label: '厨卫改造' },
    { value: 'balcony', label: '阳台改造' },
    { value: 'livingRoom', label: '客厅改造' },
    { value: 'bedroom', label: '房间改造' },
    { value: 'other', label: '其它' },
  ],
  // 材料选购的子类型
  materialPurchase: [
    { value: 'waterproof', label: '防水' },
    { value: 'repair', label: '修缮' },
    { value: 'paint', label: '涂料' },
    { value: 'putty', label: '腻子' },
    { value: 'other', label: '其它' },
  ],
  // 其他问题没有子类型
  other: [],
} as const

// 获取问题类型标签
export const getProblemTypeLabel = (value: string): string => {
  const problemType = PROBLEM_TYPES.find((item) => item.value === value)
  return problemType?.label || value
}

// 获取子类型标签名称
export const getSubTypeLabel = (problemType: string): string => {
  const labelMap: Record<string, string> = {
    waterproof: '问题位置',
    wallRenovation: '翻新类型',
    tileRepair: '瓷砖问题',
    localRenovation: '改造类型',
    materialPurchase: '材料类型',
  }
  return labelMap[problemType] || '类型'
}

// 获取子类型的中文标签
export const getSubTypeLabels = (problemType: string, subTypes: string[] | string): string[] => {
  // 如果subTypes是字符串，先转换为数组
  const subTypeArray = Array.isArray(subTypes)
    ? subTypes
    : typeof subTypes === 'string'
      ? subTypes.split(',').map((s) => s.trim())
      : []

  if (!subTypeArray.length || !problemType) {
    return []
  }

  const subTypeOptions = SUB_TYPE_OPTIONS_MAP[problemType] || []

  return subTypeArray
    .map((subType) => {
      const option = subTypeOptions.find((opt) => opt.value === subType)
      return option?.label || subType
    })
    .filter(Boolean)
}

// 格式化问题描述，包含服务类型和子类型
export const formatProblemDescription = (
  serviceType: string,
  sceneTypes: string[] | string,
  description?: string,
): string => {
  const serviceTypeName = getServiceTypeName(serviceType)
  const subTypeLabels = getSubTypeLabels(serviceType, sceneTypes)

  let result = `服务类型：${serviceTypeName}`

  if (subTypeLabels.length > 0) {
    const subTypeLabel = getSubTypeLabel(serviceType)
    result += `\n${subTypeLabel}：${subTypeLabels.join('、')}`
  }

  if (description && description.trim()) {
    result += `\n问题描述：${description}`
  }

  return result
}

// 获取服务类型名称（兼容旧的服务类型值）
export const getServiceTypeName = (type: string): string => {
  // 新的问题类型映射
  const newTypeLabel = getProblemTypeLabel(type)
  if (newTypeLabel !== type) {
    return newTypeLabel
  }

  // 兼容旧的服务类型
  const legacyServiceTypeMap: Record<string, string> = {
    repair: '防水补漏',
    new: '新房防水施工',
    drain: '疏通管道',
    unsure: '上门勘测',
  }

  return legacyServiceTypeMap[type] || type
}
