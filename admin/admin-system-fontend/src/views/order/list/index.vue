<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="订单状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择订单状态" clearable>
          <el-option
            v-for="(value, key) in ORDER_STATUS"
            :key="key"
            :label="ORDER_STATUS_MAP[value]"
            :value="value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="服务类型" prop="serviceType">
        <el-select v-model="queryParams.serviceType" placeholder="请选择服务类型" clearable>
          <el-option
            v-for="(value, key) in SERVICE_TYPE"
            :key="key"
            :label="SERVICE_TYPE_MAP[value]"
            :value="value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="支付状态" prop="paymentStatus">
        <el-select v-model="queryParams.paymentStatus" placeholder="请选择支付状态" clearable>
          <el-option
            v-for="(value, key) in PAYMENT_STATUS"
            :key="key"
            :label="PAYMENT_STATUS_MAP[value]"
            :value="value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="用户ID" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户ID"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="手机号码" prop="phone">
        <el-input
          v-model="queryParams.phone"
          placeholder="请输入手机号码"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="dateRange">
        <el-date-picker
          v-model="dateRange"
          value-format="YYYY-MM-DD"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['system:order:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="orderList">
      <el-table-column label="订单ID" align="center" prop="orderId" />
      <el-table-column label="用户信息" align="center" min-width="120">
        <template #default="scope">
          <div>姓名: {{ scope.row.user?.name || '-' }}</div>
          <div>手机: {{ scope.row.appointmentInfo?.phone || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="服务信息" align="center" min-width="120">
        <template #default="scope">
          <div>类型: {{ SERVICE_TYPE_MAP[scope.row.serviceType] || '-' }}</div>
          <div>场景: {{ scope.row.appointmentInfo?.sceneType?.join(', ') || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="地址" align="center" min-width="180">
        <template #default="scope">
          <el-tooltip
            :content="scope.row.appointmentInfo?.region + scope.row.appointmentInfo?.address"
            placement="top"
            :show-after="500"
          >
            <div class="ellipsis">{{ scope.row.appointmentInfo?.region || '' }}{{ scope.row.appointmentInfo?.address || '' }}</div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="订单金额" align="center" prop="total">
        <template #default="scope">
          ¥{{ scope.row.total || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="订单状态" align="center">
        <template #default="scope">
          <el-tag :type="ORDER_STATUS_TAG_TYPE[scope.row.status]">
            {{ ORDER_STATUS_MAP[scope.row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="支付状态" align="center">
        <template #default="scope">
          <el-tag :type="PAYMENT_STATUS_TAG_TYPE[scope.row.paymentStatus]">
            {{ PAYMENT_STATUS_MAP[scope.row.paymentStatus] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createdAt" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createdAt) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="280" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-link type="primary" :underline="false" @click="handleDetail(scope.row)" style="margin-right: 10px">查看</el-link>
          <el-link 
            v-if="scope.row.status === ORDER_STATUS.PENDING" 
            type="success" 
            :underline="false" 
            @click="handleUpdateStatus(scope.row, ORDER_STATUS.ACCEPTED)" 
            style="margin-right: 10px"
          >接单</el-link>
          <el-link 
            v-if="scope.row.status === ORDER_STATUS.ACCEPTED" 
            type="warning" 
            :underline="false" 
            @click="handleUpdateStatus(scope.row, ORDER_STATUS.PROCESSING)" 
            style="margin-right: 10px"
          >施工</el-link>
          <el-link 
            v-if="scope.row.status === ORDER_STATUS.PROCESSING" 
            type="success" 
            :underline="false" 
            @click="handleUpdateStatus(scope.row, ORDER_STATUS.COMPLETED)" 
            style="margin-right: 10px"
          >完成</el-link>
          <el-link 
            v-if="['PENDING', 'ACCEPTED'].includes(scope.row.status)" 
            type="danger" 
            :underline="false" 
            @click="handleCancel(scope.row)"
          >取消</el-link>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.page"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

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

<script setup name="OrderList">
import { listOrders, updateOrderStatus, cancelOrder } from "@/api/order";
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

const router = useRouter();
const { proxy } = getCurrentInstance();

const orderList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const dateRange = ref([]);
const cancelDialogVisible = ref(false);

const queryParams = ref({
  page: 1,
  pageSize: 10,
  status: undefined,
  userId: undefined,
  phone: undefined,
  serviceType: undefined,
  paymentStatus: undefined
});

const cancelForm = ref({
  orderId: null,
  cancelReason: ''
});

/** 查询订单列表 */
function getList() {
  loading.value = true;
  const query = {
    ...queryParams.value,
    createdAtStart: dateRange.value?.[0],
    createdAtEnd: dateRange.value?.[1]
  };
  
  listOrders(query).then(response => {
    orderList.value = response.orders || [];
    total.value = response.total || 0;
    loading.value = false;
  });
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.page = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = [];
  proxy.$resetForm("queryRef");
  handleQuery();
}

/** 查看详情按钮操作 */
function handleDetail(row) {
  router.push({ path: `/system/order-detail/index/${row.orderId}` });
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('order/export', {
    ...queryParams.value
  }, `订单列表_${new Date().getTime()}.xlsx`);
}

/** 更新订单状态 */
function handleUpdateStatus(row, status) {
  const statusText = ORDER_STATUS_MAP[status];
  
  proxy.$modal.confirm(`确认将订单状态修改为"${statusText}"吗？`).then(() => {
    updateOrderStatus(row.orderId, { status }).then(res => {
      proxy.$modal.msgSuccess("操作成功");
      getList();
    });
  }).catch(() => {});
}

/** 取消订单按钮操作 */
function handleCancel(row) {
  cancelForm.value.orderId = row.orderId;
  cancelForm.value.cancelReason = '';
  cancelDialogVisible.value = true;
}

/** 提交取消订单 */
function submitCancel() {
  if (!cancelForm.value.cancelReason) {
    proxy.$modal.msgError("请输入取消原因");
    return;
  }
  
  cancelOrder(cancelForm.value.orderId, {
    cancelReason: cancelForm.value.cancelReason
  }).then(res => {
    proxy.$modal.msgSuccess("取消订单成功");
    cancelDialogVisible.value = false;
    getList();
  });
}

onMounted(() => {
  getList();
});
</script>

<style scoped>
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}
</style> 