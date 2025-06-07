export const REFERRAL_STATUS = {
  ACTIVE: 'ACTIVE',         // 活跃
  INACTIVE: 'INACTIVE',     // 未激活
  EXPIRED: 'EXPIRED'        // 已过期
}

export const REFERRAL_STATUS_MAP = {
  [REFERRAL_STATUS.ACTIVE]: '活跃',
  [REFERRAL_STATUS.INACTIVE]: '未激活',
  [REFERRAL_STATUS.EXPIRED]: '已过期'
}

export const REFERRAL_STATUS_TAG_TYPE = {
  [REFERRAL_STATUS.ACTIVE]: 'success',
  [REFERRAL_STATUS.INACTIVE]: 'info',
  [REFERRAL_STATUS.EXPIRED]: 'danger'
}
