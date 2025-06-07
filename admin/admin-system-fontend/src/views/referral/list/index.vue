<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>推广引用码列表</span>
          <div>
            <el-button type="primary" @click="openAddDialog">新增引用码</el-button>
          </div>
        </div>
      </template>

      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="90px">
        <el-form-item label="引用码状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option
              v-for="(value, key) in REFERRAL_STATUS"
              :key="key"
              :label="REFERRAL_STATUS_MAP[value]"
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
        <el-form-item label="创建日期" prop="dateRange">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="referralList">
        <el-table-column label="引用码ID" align="center" prop="id" />
        <el-table-column label="引用码" align="center" prop="refCode" />
        <el-table-column label="使用人数" align="center">
          <template #default="scope">
            {{ scope.row.stats?.totalUsers || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="下单人数" align="center">
          <template #default="scope">
            {{ scope.row.stats?.orderedUsers || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="下单转化率" align="center">
          <template #default="scope">
            {{ (scope.row.stats?.orderRate || 0) * 100 }}%
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.isActive ? 'success' : 'info'">
              {{ scope.row.isActive ? '活跃' : '未激活' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createdAt" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" align="center" prop="updatedAt" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.updatedAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="280" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-link 
              v-if="!scope.row.isActive" 
              type="success" 
              :underline="false" 
              @click="handleUpdateStatus(scope.row, true)" 
              style="margin-right: 10px"
            >激活</el-link>
            <el-link 
              v-if="scope.row.isActive" 
              type="info" 
              :underline="false" 
              @click="handleUpdateStatus(scope.row, false)" 
              style="margin-right: 10px"
            >停用</el-link>
            <el-link 
              type="primary" 
              :underline="false" 
              @click="handleViewQrcode(scope.row)" 
              style="margin-right: 10px"
            >查看二维码</el-link>
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
    </el-card>

    <!-- 新增引用码对话框 -->
    <el-dialog title="新增引用码" v-model="addDialogVisible" width="500px" append-to-body>
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="100px">
        <el-form-item label="引用码" prop="refCode">
          <el-input v-model="addForm.refCode" placeholder="请输入引用码" />
        </el-form-item>
        <el-form-item label="状态" prop="isActive">
          <el-select v-model="addForm.isActive" placeholder="请选择状态">
            <el-option
              label="活跃"
              :value="true"
            />
            <el-option
              label="未激活"
              :value="false"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="addForm.description"
            type="textarea"
            placeholder="请输入描述信息"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitAdd">确 定</el-button>
        <el-button @click="addDialogVisible = false">取 消</el-button>
      </template>
    </el-dialog>
    
    <!-- 二维码查看对话框 -->
    <el-dialog title="推广二维码" v-model="qrcodeDialogVisible" width="400px" append-to-body>
      <div class="qrcode-container" v-loading="qrcodeLoading">
        <img v-if="qrcodeUrl" :src="qrcodeUrl" class="qrcode-image" />
        <div v-else class="qrcode-placeholder">
          <el-icon><Picture /></el-icon>
          <p>暂无二维码</p>
        </div>
      </div>
      <el-form :model="qrcodeForm" label-width="100px" style="margin-top: 20px">
        <el-form-item label="页面路径">
          <el-input v-model="qrcodeForm.page" placeholder="pages/index/index" />
        </el-form-item>
        <el-form-item label="二维码尺寸">
          <el-input-number v-model="qrcodeForm.width" :min="120" :max="1280" />
        </el-form-item>
        <el-form-item label="环境版本">
          <el-select v-model="qrcodeForm.envVersion">
            <el-option label="正式版" value="release" />
            <el-option label="体验版" value="trial" />
            <el-option label="开发版" value="develop" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="generateQrcode">重新生成</el-button>
        <el-button type="success" @click="downloadQrcode">下载二维码</el-button>
        <el-button @click="qrcodeDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ReferralList">
import { listReferrals, createReferral, updateReferralStatus, generateQrcode as generateQrcodeApi } from "@/api/referral";
import { parseTime } from '@/utils/mei-mei';
import { Picture } from '@element-plus/icons-vue';

const { proxy } = getCurrentInstance();

const referralList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const dateRange = ref([]);
const addDialogVisible = ref(false);
const qrcodeDialogVisible = ref(false);
const qrcodeLoading = ref(false);
const qrcodeUrl = ref('');
const currentReferral = ref(null);

const queryParams = ref({
  page: 1,
  pageSize: 10,
  status: undefined,
  userId: undefined
});

const addForm = ref({
  refCode: '',
  isActive: true,
  description: ''
});

const qrcodeForm = ref({
  page: 'pages/index/index',
  width: 280,
  envVersion: 'release',
  saveToFile: false
});

const addRules = {
  refCode: [
    { required: true, message: "引用码不能为空", trigger: "blur" }
  ],
  isActive: [
    { required: true, message: "状态不能为空", trigger: "change" }
  ]
};

/** 查询引用码列表 */
function getList() {
  loading.value = true;
  const query = {
    ...queryParams.value,
    createdAtStart: dateRange.value && dateRange.value[0],
    createdAtEnd: dateRange.value && dateRange.value[1]
  };
  
  listReferrals(query).then(response => {
    if (response && response.data) {
      referralList.value = response.data || [];
      total.value = response.data.length || 0;
    } else {
      referralList.value = [];
      total.value = 0;
    }
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

/** 打开新增对话框 */
function openAddDialog() {
  addForm.value = {
    refCode: '',
    isActive: true,
    description: ''
  };
  addDialogVisible.value = true;
}

/** 提交新增 */
function submitAdd() {
  proxy.$refs.addFormRef.validate(valid => {
    if (valid) {
      createReferral(addForm.value).then(res => {
        proxy.$modal.msgSuccess("新增引用码成功");
        addDialogVisible.value = false;
        getList();
      });
    }
  });
}

/** 更新引用码状态 */
function handleUpdateStatus(row, isActive) {
  const statusText = isActive ? '活跃' : '未激活';
  
  proxy.$modal.confirm(`确认将引用码状态修改为"${statusText}"吗？`).then(() => {
    updateReferralStatus(row.id, { isActive }).then(res => {
      proxy.$modal.msgSuccess("操作成功");
      getList();
    });
  }).catch(() => {});
}

/** 处理查看二维码操作 */
function handleViewQrcode(row) {
  currentReferral.value = row;
  qrcodeForm.value = {
    page: 'pages/index/index',
    width: 280,
    envVersion: 'release',
    saveToFile: false
  };
  qrcodeUrl.value = '';
  qrcodeDialogVisible.value = true;
  generateQrcode();
}

/** 生成二维码 */
function generateQrcode() {
  if (!currentReferral.value) return;
  
  qrcodeLoading.value = true;
  
  const data = {
    ...qrcodeForm.value,
    scene: `ref=${currentReferral.value.refCode || ''}`
  };
  
  generateQrcodeApi(data).then(res => {
    if (res && res.data && res.data.base64) {
      qrcodeUrl.value = res.data.base64;
    }
    qrcodeLoading.value = false;
  }).catch((err) => {
    proxy.$modal.msgError(err.message || "生成二维码失败");
    qrcodeLoading.value = false;
  });
}

/** 下载二维码 */
function downloadQrcode() {
  if (!qrcodeUrl.value) {
    proxy.$modal.msgError("没有可下载的二维码");
    return;
  }
  
  // 确保是base64数据
  if (!qrcodeUrl.value.startsWith('data:image')) {
    proxy.$modal.msgError("二维码数据格式不正确");
    return;
  }
  
  // 创建一个临时的下载链接
  const downloadLink = document.createElement('a');
  downloadLink.href = qrcodeUrl.value;
  downloadLink.download = `推广码_${currentReferral.value?.refCode || 'qrcode'}.png`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

onMounted(() => {
  getList();
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

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qrcode-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.qrcode-image {
  max-width: 280px;
  max-height: 280px;
}

.qrcode-placeholder {
  text-align: center;
  color: #909399;
}

.qrcode-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 10px;
}
</style>
