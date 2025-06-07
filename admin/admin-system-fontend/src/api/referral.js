import request from '@/utils/request'

// 查询推广引用码列表
export function listReferrals(query) {
  return request({
    url: '/api/admin/referrals',
    method: 'get',
    params: query
  })
}

// 创建推广引用码
export function createReferral(data) {
  return request({
    url: '/api/admin/referrals',
    method: 'post',
    data: data
  })
}

// 更新推广引用码状态
export function updateReferralStatus(id, data) {
  return request({
    url: `/api/admin/referrals/${id}/status`,
    method: 'put',
    data: data
  })
}

// 获取推广统计数据
export function getReferralStatistics(params) {
  return request({
    url: '/api/admin/referrals/statistics',
    method: 'get',
    params
  })
}
