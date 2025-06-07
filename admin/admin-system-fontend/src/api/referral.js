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

// 生成推广二维码
export function generateQrcode(data) {
  const apiData = { ...data };
  
  // 设置默认值
  if (!apiData.page) {
    apiData.page = 'pages/index/index';
  }
  
  if (!apiData.width) {
    apiData.width = 280;
  }
  
  if (!apiData.envVersion) {
    apiData.envVersion = 'release';
  }
  
  return request({
    url: '/api/admin/referrals/qrcode',
    method: 'post',
    data: apiData,
    responseType: apiData.saveToFile ? 'blob' : 'json'
  }).then(response => {
    // 校验返回的base64数据
    if (response.data && response.data.base64) {
      // 如果base64数据解码后包含错误信息，转换为错误对象抛出
      try {
        // 从base64中提取内容部分
        const base64Content = response.data.base64.split(',')[1];
        if (base64Content) {
          const decodedData = atob(base64Content);
          // 尝试解析为JSON，检查是否包含错误信息
          try {
            const jsonData = JSON.parse(decodedData);
            if (jsonData.errcode && jsonData.errmsg) {
              return Promise.reject({
                message: `生成二维码失败: ${jsonData.errmsg}`
              });
            }
          } catch (e) {
            // 不是JSON格式，可能是正常的图片数据
          }
        }
      } catch (e) {
        console.warn('解析二维码数据时出错', e);
      }
    }
    return response;
  });
}
