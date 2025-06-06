export const ORDER_STATUS = {
  PENDING: 'PENDING',     // 待接单
  ACCEPTED: 'ACCEPTED',   // 已接单
  PROCESSING: 'PROCESSING', // 施工中
  COMPLETED: 'COMPLETED', // 已完成
  CANCELLED: 'CANCELLED', // 已取消
  DELIVERED: 'DELIVERED'  // 已交付
}

export const ORDER_STATUS_MAP = {
  [ORDER_STATUS.PENDING]: '待接单',
  [ORDER_STATUS.ACCEPTED]: '已接单',
  [ORDER_STATUS.PROCESSING]: '施工中',
  [ORDER_STATUS.COMPLETED]: '已完成',
  [ORDER_STATUS.CANCELLED]: '已取消',
  [ORDER_STATUS.DELIVERED]: '已交付'
}

export const ORDER_STATUS_TAG_TYPE = {
  [ORDER_STATUS.PENDING]: 'warning',
  [ORDER_STATUS.ACCEPTED]: 'info',
  [ORDER_STATUS.PROCESSING]: 'primary',
  [ORDER_STATUS.COMPLETED]: 'success',
  [ORDER_STATUS.CANCELLED]: 'danger',
  [ORDER_STATUS.DELIVERED]: 'success'
}

export const PAYMENT_STATUS = {
  UNPAID: 'UNPAID',   // 未支付
  PAID: 'PAID',      // 已支付
  REFUNDED: 'REFUNDED' // 已退款
}

export const PAYMENT_STATUS_MAP = {
  [PAYMENT_STATUS.UNPAID]: '未支付',
  [PAYMENT_STATUS.PAID]: '已支付',
  [PAYMENT_STATUS.REFUNDED]: '已退款'
}

export const PAYMENT_STATUS_TAG_TYPE = {
  [PAYMENT_STATUS.UNPAID]: 'warning',
  [PAYMENT_STATUS.PAID]: 'success',
  [PAYMENT_STATUS.REFUNDED]: 'info'
}

export const SERVICE_TYPE = {
  UNSURE: 'unsure',  // 不确定
  REPAIR: 'repair',  // 维修
  DRAIN: 'drain'     // 疏通
}

export const SERVICE_TYPE_MAP = {
  [SERVICE_TYPE.UNSURE]: '不确定',
  [SERVICE_TYPE.REPAIR]: '维修',
  [SERVICE_TYPE.DRAIN]: '疏通'
} 