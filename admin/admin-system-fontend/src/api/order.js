import request from '@/utils/request'

// 查询订单列表
export function listOrders(query) {
  return request({
    url: '/api/admin/orders',
    method: 'get',
    params: query
  })
}

// 查询订单详情
export function getOrder(orderId) {
  return request({
    url: `/api/admin/orders/${orderId}`,
    method: 'get'
  })
}

// 更新订单状态
export function updateOrderStatus(orderId, data) {
  return request({
    url: `/api/admin/orders/${orderId}/status`,
    method: 'put',
    data: data
  })
}

// 取消订单
export function cancelOrder(orderId, data) {
  return request({
    url: `/api/admin/orders/${orderId}/cancel`,
    method: 'put',
    data: data
  })
}

// 完成订单
export function completeOrder(orderId) {
  return request({
    url: `/api/admin/orders/${orderId}/complete`,
    method: 'put'
  })
} 