<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单详情调试</span>
        </div>
      </template>
      
      <el-form :inline="true">
        <el-form-item label="订单ID">
          <el-input v-model="orderId" placeholder="请输入订单ID" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="goToDetail">查看详情</el-button>
        </el-form-item>
      </el-form>

      <div class="debug-info">
        <p>当前路径: {{ currentPath }}</p>
        <p>当前路由信息:</p>
        <pre>{{ JSON.stringify(routeInfo, null, 2) }}</pre>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const orderId = ref('5');
const currentPath = computed(() => window.location.href);
const routeInfo = computed(() => {
  return {
    path: route.path,
    fullPath: route.fullPath,
    params: route.params,
    query: route.query,
    name: route.name,
    meta: route.meta
  };
});

function goToDetail() {
  if (!orderId.value) {
    alert('请输入订单ID');
    return;
  }
  
  // 使用编程式导航
  router.push({
    path: `/system/order-detail/index/${orderId.value}`
  });
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.debug-info {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: #f8f8f8;
  padding: 10px;
  border-radius: 4px;
}
</style> 