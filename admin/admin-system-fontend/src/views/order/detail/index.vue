<template>
  <div class="app-container">
    <el-card v-loading="loading" class="box-card">
      <template #header>
        <div class="card-header">
          <span>订单详情</span>
          <div>
            <el-button icon="Back" @click="goBack">返回</el-button>
            <el-button 
              v-if="orderInfo.status === ORDER_STATUS.PENDING" 
              type="success" 
              icon="Check"
              @click="handleUpdateStatus(ORDER_STATUS.ACCEPTED)"
            >接单</el-button>
            <el-button 
              v-if="orderInfo.status === ORDER_STATUS.ACCEPTED" 
              type="warning" 
              icon="Tools"
              @click="handleUpdateStatus(ORDER_STATUS.PROCESSING)"
            >施工</el-button>
            <el-button 
              v-if="orderInfo.status === ORDER_STATUS.PROCESSING" 
              type="success" 
              icon="Check"
              @click="handleUpdateStatus(ORDER_STATUS.COMPLETED)"
            >完成</el-button>
            <el-button 
              v-if="['PENDING', 'ACCEPTED'].includes(orderInfo.status)" 
              type="danger" 
              icon="Close"
              @click="handleCancel"
            >取消</el-button>
          </div>
        </div>
      </template>
      
      <el-descriptions title="订单信息" :column="2" border>
        <el-descriptions-item label="订单ID">{{ orderInfo.orderId }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="ORDER_STATUS_TAG_TYPE[orderInfo.status]">
            {{ ORDER_STATUS_MAP[orderInfo.status] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付状态">
          <el-tag :type="PAYMENT_STATUS_TAG_TYPE[orderInfo.paymentStatus]">
            {{ PAYMENT_STATUS_MAP[orderInfo.paymentStatus] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="订单金额">¥{{ orderInfo.total || 0 }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ parseTime(orderInfo.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ parseTime(orderInfo.updatedAt) }}</el-descriptions-item>
        <el-descriptions-item label="买家地址" v-if="orderInfo.buyerAddress">
          {{ orderInfo.buyerAddress }}
        </el-descriptions-item>
        <el-descriptions-item label="取消原因" v-if="orderInfo.cancelReason">
          {{ orderInfo.cancelReason }}
        </el-descriptions-item>
        <el-descriptions-item label="取消时间" v-if="orderInfo.cancelledAt">
          {{ parseTime(orderInfo.cancelledAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="完成时间" v-if="orderInfo.completedAt">
          {{ parseTime(orderInfo.completedAt) }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <el-descriptions title="用户信息" :column="2" border>
        <el-descriptions-item label="用户ID">{{ orderInfo.userId }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ orderInfo.user?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机号码">{{ orderInfo.appointmentInfo?.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ orderInfo.user?.email || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <el-descriptions title="服务信息" :column="2" border>
        <el-descriptions-item label="服务类型">{{ SERVICE_TYPE_MAP[orderInfo.appointmentInfo?.serviceType] || '-' }}</el-descriptions-item>
        <el-descriptions-item label="场景类型">{{ orderInfo.appointmentInfo?.sceneType?.join(', ') || '-' }}</el-descriptions-item>
        <el-descriptions-item label="预约ID">{{ orderInfo.appointmentId }}</el-descriptions-item>
        <el-descriptions-item label="跟进次数">{{ orderInfo.followUpCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="最后跟进时间" v-if="orderInfo.lastFollowUpAt">
          {{ parseTime(orderInfo.lastFollowUpAt) }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <el-descriptions title="地址信息" :column="1" border>
        <el-descriptions-item label="联系人">{{ orderInfo.appointmentInfo?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ orderInfo.appointmentInfo?.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="详细地址">
          {{ orderInfo.appointmentInfo?.region || '' }}{{ orderInfo.appointmentInfo?.address || '' }}
        </el-descriptions-item>
        <el-descriptions-item label="位置信息">{{ orderInfo.appointmentInfo?.location || '-' }}</el-descriptions-item>
        <el-descriptions-item label="经纬度" v-if="orderInfo.appointmentInfo?.latitude && orderInfo.appointmentInfo?.longitude">
          {{ orderInfo.appointmentInfo?.latitude }}, {{ orderInfo.appointmentInfo?.longitude }}
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="orderInfo.appointmentInfo?.latitude && orderInfo.appointmentInfo?.longitude" class="map-container">
        <div id="map" style="height: 300px; margin-top: 15px;"></div>
      </div>

      <!-- 预约图片展示 -->
      <el-divider v-if="orderInfo.appointmentInfo?.imageUrls && orderInfo.appointmentInfo.imageUrls.length > 0" />
      
      <div v-if="orderInfo.appointmentInfo?.imageUrls && orderInfo.appointmentInfo.imageUrls.length > 0">
        <h3>预约现场图片</h3>
        
        <el-image
          v-for="(url, index) in formatImageUrls(orderInfo.appointmentInfo.imageUrls)"
          :key="index"
          :src="url"
          :preview-src-list="formatImageUrls(orderInfo.appointmentInfo.imageUrls)"
          fit="cover"
          style="width: 100px; height: 100px; margin-right: 10px; margin-bottom: 10px;"
        />
      </div>

      <el-divider v-if="orderInfo.items && orderInfo.items.length > 0" />

      <el-table 
        v-if="orderInfo.items && orderInfo.items.length > 0 && orderInfo.items[0].productId" 
        :data="orderInfo.items" 
        style="width: 100%; margin-top: 15px;"
      >
        <el-table-column label="商品名称" prop="product.name" />
        <el-table-column label="商品单价" prop="product.price">
          <template #default="scope">
            ¥{{ scope.row.product?.price || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="数量" prop="quantity" />
        <el-table-column label="小计">
          <template #default="scope">
            ¥{{ (scope.row.product?.price || 0) * (scope.row.quantity || 0) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 取消订单对话框 -->
    <el-dialog title="取消订单" v-model="cancelDialogVisible" width="500px" append-to-body>
      <el-form ref="cancelFormRef" :model="cancelForm" label-width="80px">
        <el-form-item label="取消原因" prop="cancelReason">
          <el-input
            v-model="cancelForm.cancelReason"
            type="textarea"
            placeholder="请输入取消原因"
            :rows="4"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitCancel">确 定</el-button>
        <el-button @click="cancelDialogVisible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="OrderDetail">
import { getOrder, updateOrderStatus, cancelOrder } from "@/api/order";
import { parseTime } from '@/utils/mei-mei';
import { 
  ORDER_STATUS, 
  ORDER_STATUS_MAP, 
  ORDER_STATUS_TAG_TYPE,
  PAYMENT_STATUS,
  PAYMENT_STATUS_MAP,
  PAYMENT_STATUS_TAG_TYPE,
  SERVICE_TYPE,
  SERVICE_TYPE_MAP
} from '@/constants/orderStatus';

const route = useRoute();
const router = useRouter();
const { proxy } = getCurrentInstance();

const orderId = ref(null);
const loading = ref(true);
const orderInfo = ref({});
const cancelDialogVisible = ref(false);
const cancelForm = ref({
  cancelReason: ''
});

/** 返回按钮操作 */
function goBack() {
  router.go(-1);
}

/** 获取订单详情 */
function getOrderDetail(id) {
  loading.value = true;
  getOrder(id).then(response => {
    // 适配新的API响应结构
    if (response.code === 200) {
      // 新的响应结构
      orderInfo.value = response;
    } else {
      // 兼容旧的响应结构
      orderInfo.value = response.data || response || {};
    }
    
    loading.value = false;
    console.log('订单详情:', orderInfo.value);
    
    // 如果有地图信息，初始化地图
    if (orderInfo.value.appointmentInfo?.latitude && orderInfo.value.appointmentInfo?.longitude) {
      nextTick(() => {
        initMap();
      });
    }
  }).catch(error => {
    console.error('获取订单详情失败:', error);
    loading.value = false;
  });
}

/** 初始化地图 */
function initMap() {
  // 此处应该实现地图初始化逻辑
  // 如果需要使用第三方地图库如高德地图、百度地图等，需要先引入相应的SDK
  console.log('地图初始化');
}

/** 格式化图片URL，确保使用完整的URL地址 */
function formatImageUrls(urls) {
  if (!urls || !Array.isArray(urls)) return [];
  
  return urls.map(url => {
    // 如果URL已经是完整的绝对URL（以http或https开头），则直接返回
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // 如果URL是相对路径，添加基础URL前缀
    // 使用环境变量中的API基础URL或默认使用当前域名
    const baseApiUrl = import.meta.env.VITE_APP_BASE_API || '';
    
    // 如果URL以/开头，则直接拼接，否则添加/
    return `${baseApiUrl}${url.startsWith('/') ? url : '/' + url}`;
  });
}

/** 更新订单状态 */
function handleUpdateStatus(status) {
  const statusText = ORDER_STATUS_MAP[status];
  
  proxy.$modal.confirm(`确认将订单状态修改为"${statusText}"吗？`).then(() => {
    updateOrderStatus(orderInfo.value.orderId, { status }).then(res => {
      proxy.$modal.msgSuccess("操作成功");
      getOrderDetail(orderId.value);
    });
  }).catch(() => {});
}

/** 取消订单按钮操作 */
function handleCancel() {
  cancelForm.value.cancelReason = '';
  cancelDialogVisible.value = true;
}

/** 提交取消订单 */
function submitCancel() {
  if (!cancelForm.value.cancelReason) {
    proxy.$modal.msgError("请输入取消原因");
    return;
  }
  
  cancelOrder(orderInfo.value.orderId, {
    cancelReason: cancelForm.value.cancelReason
  }).then(res => {
    proxy.$modal.msgSuccess("取消订单成功");
    cancelDialogVisible.value = false;
    getOrderDetail(orderId.value);
  });
}

onMounted(() => {
  orderId.value = route.params.orderId;
  console.log('当前路由:', route);
  console.log('URL参数:', route.params);
  console.log('订单ID:', orderId.value);
  if (orderId.value) {
    getOrderDetail(orderId.value);
  } else {
    proxy.$modal.msgError("订单ID不能为空");
  }
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-divider {
  margin: 24px 0;
}

.map-container {
  margin-top: 20px;
}
</style> 