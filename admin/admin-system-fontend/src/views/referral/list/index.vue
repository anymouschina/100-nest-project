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
        <el-table-column label="引用码" align="center" prop="code" />
        <el-table-column label="创建用户" align="center" prop="createdBy" />
        <el-table-column label="使用次数" align="center" prop="usageCount" />
        <el-table-column label="状态" align="center">
          <template #default="scope">
            <el-tag :type="REFERRAL_STATUS_TAG_TYPE[scope.row.status]">
              {{ REFERRAL_STATUS_MAP[scope.row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createdAt" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="过期时间" align="center" prop="expiresAt" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.expiresAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-link 
              v-if="scope.row.status === REFERRAL_STATUS.INACTIVE" 
              type="success" 
              :underline="false" 
              @click="handleUpdateStatus(scope.row, REFERRAL_STATUS.ACTIVE)" 
              style="margin-right: 10px"
            >激活</el-link>
            <el-link 
              v-if="scope.row.status === REFERRAL_STATUS.ACTIVE" 
              type="info" 
              :underline="false" 
              @click="handleUpdateStatus(scope.row, REFERRAL_STATUS.INACTIVE)" 
              style="margin-right: 10px"
            >停用</el-link>
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
        <el-form-item label="引用码" prop="code">
          <el-input v-model="addForm.code" placeholder="请输入引用码" />
        </el-form-item>
        <el-form-item label="初始状态" prop="status">
          <el-select v-model="addForm.status" placeholder="请选择状态">
            <el-option
              v-for="(value, key) in REFERRAL_STATUS"
              :key="key"
              :label="REFERRAL_STATUS_MAP[value]"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="过期时间" prop="expiresAt">
          <el-date-picker
            v-model="addForm.expiresAt"
            type="datetime"
            placeholder="选择过期时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitAdd">确 定</el-button>
        <el-button @click="addDialogVisible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ReferralList">
import { listReferrals, createReferral, updateReferralStatus } from "@/api/referral";
import { parseTime } from '@/utils/mei-mei';
import { 
  REFERRAL_STATUS, 
  REFERRAL_STATUS_MAP, 
  REFERRAL_STATUS_TAG_TYPE
} from '@/constants/referralStatus';

const { proxy } = getCurrentInstance();

const referralList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const dateRange = ref([]);
const addDialogVisible = ref(false);

const queryParams = ref({
  page: 1,
  pageSize: 10,
  status: undefined,
  userId: undefined
});

const addForm = ref({
  code: '',
  status: REFERRAL_STATUS.ACTIVE,
  expiresAt: ''
});

const addRules = {
  code: [
    { required: true, message: "引用码不能为空", trigger: "blur" }
  ],
  status: [
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
    referralList.value = response.referrals || [];
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

/** 打开新增对话框 */
function openAddDialog() {
  addForm.value = {
    code: '',
    status: REFERRAL_STATUS.ACTIVE,
    expiresAt: ''
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
function handleUpdateStatus(row, status) {
  const statusText = REFERRAL_STATUS_MAP[status];
  
  proxy.$modal.confirm(`确认将引用码状态修改为"${statusText}"吗？`).then(() => {
    updateReferralStatus(row.id, { status }).then(res => {
      proxy.$modal.msgSuccess("操作成功");
      getList();
    });
  }).catch(() => {});
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
</style>
