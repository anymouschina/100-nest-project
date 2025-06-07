import request from '@/utils/request'

// 查询推广引用码列表
export function listReferrals(query) {
  return request({
    url: '/api/admin/referrals',
    method: 'get',
    params: query
  }).then(response => {
    // 将响应数据中的code字段转换为refCode
    if (response && response.data) {
      response.data = response.data.map(item => {
        return {
          ...item,
          refCode: item.code
        };
      });
    }
    return response;
  })
}

// 创建推广引用码
export function createReferral(data) {
  // 后端API期望code字段，但前端使用refCode
  const apiData = { ...data };
  
  return request({
    url: '/api/admin/referrals',
    method: 'post',
    data: apiData
  })
}

// 更新推广引用码状态
export function updateReferralStatus(id, data) {
  // 如果前端传入了refCode字段，需要转换为code字段
  const apiData = { ...data };
  if (data.refCode) {
    apiData.code = data.refCode;
    delete apiData.refCode;
  }
  
  return request({
    url: `/api/admin/referrals/${id}`,
    method: 'put',
    data: apiData
  })
}

// 获取推广统计数据
export function getReferralStatistics(params) {
  return request({
    url: '/api/admin/referrals/statistics',
    method: 'get',
    params
  }).then(response => {
    // 将响应数据中的code字段转换为refCode
    if (response && response.data && response.data.rankings) {
      response.data.rankings = response.data.rankings.map(item => {
        return {
          ...item,
          refCode: item.code
        };
      });
    }
    return response;
  })
}
