<template>
  <div class="personal-center-container">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="box-card user-card">
          <template #header>
            <div class="card-header">
              <span>个人信息</span>
            </div>
          </template>
          <div class="user-info-body">
            <div class="user-avatar">
              <el-upload
                  class="avatar-uploader"
                  action="#"
                  :show-file-list="false"
                  :on-success="handleAvatarSuccess"
                  :before-upload="beforeAvatarUpload"
              >
                <img v-if="imageUrl" :src="imageUrl" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </div>
            <div class="user-details">
              <p><el-icon><User /></el-icon> 用户名称：<span class="detail-text">{{ userInfo.username }}</span></p>
              <p><el-icon><Postcard /></el-icon> 真实姓名：<span class="detail-text">{{ userInfo.realName || '待完善' }}</span></p>
              <p><el-icon><Phone /></el-icon> 手机号码：<span class="detail-text">{{ userInfo.phone || '待完善' }}</span></p>
              <p><el-icon><Message /></el-icon> 用户邮箱：<span class="detail-text">{{ userInfo.email }}</span></p>
              <p><el-icon><OfficeBuilding /></el-icon> 所属部门：<span class="detail-text">{{ userInfo.departmentName || '待完善' }}</span></p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>基本资料</span>
            </div>
          </template>
          <el-tabs v-model="activeTab">
            <el-tab-pane label="基本资料" name="info">
              <el-form ref="infoFormRef" :model="infoForm" :rules="infoFormRules" label-width="80px" style="max-width: 400px">
                <el-form-item label="用户姓名" prop="realName">
                  <el-input v-model="infoForm.realName" placeholder="请输入您的真实姓名" />
                </el-form-item>
                <el-form-item label="手机号码" prop="phone">
                  <el-input v-model="infoForm.phone" placeholder="请输入您的手机号码" />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="infoForm.email" placeholder="请输入您的邮箱" />
                </el-form-item>
                <el-form-item label="所属部门" prop="deptId">
                  <el-tree-select
                      v-model="infoForm.deptId"
                      :data="mockDepartments"
                      :props="{ label: 'deptName', value: 'deptId' }"
                      check-strictly
                      placeholder="请选择您的所属部门"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleUpdateInfo">保存修改</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            <el-tab-pane label="修改密码" name="password">
              <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdFormRules" label-width="80px" style="max-width: 400px">
                <el-form-item label="旧密码" prop="oldPassword">
                  <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入旧密码" />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="请输入新密码" />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleUpdatePwd">修改密码</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { User, Phone, Message, OfficeBuilding, Postcard, Plus } from '@element-plus/icons-vue';
// 1. 引入新建的API
import { getProfile, updateProfile, updatePassword, uploadAvatar } from '@/api/profile.js';

// --- 开关：设置为 true 时将调用真实API，否则使用模拟数据 ---
const USE_REAL_API = false;

const activeTab = ref('info');
const infoFormRef = ref(null);
const pwdFormRef = ref(null);
const imageUrl = ref('');
const userInfo = ref({});
const mockDepartments = [ { deptId: 101, deptName: '研发部' }, { deptId: 102, deptName: '运维部' }];
const infoForm = reactive({ realName: '', phone: '', email: '', deptId: null });
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' });

// --- 页面加载逻辑 ---
onMounted(async () => {
  if (USE_REAL_API) {
    try {
      const response = await getProfile();
      userInfo.value = response;
      Object.assign(infoForm, response);
      imageUrl.value = response.avatarUrl;
    } catch (error) {
      ElMessage.error('获取用户信息失败');
    }
  } else {
    // 模拟数据逻辑
    const fetchedUserInfo = {
      username: 'admin', realName: '管理员', phone: '15888888888', email: 'admin@example.com',
      deptId: 101, departmentName: '研发部',
      avatarUrl: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    };
    userInfo.value = fetchedUserInfo;
    Object.assign(infoForm, fetchedUserInfo);
    imageUrl.value = fetchedUserInfo.avatarUrl;
  }
});


// 表单验证规则
const infoFormRules = {
  realName: [{ required: true, message: '请输入用户姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号码', trigger: 'blur' }],
  email: [{ required: true, type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }],
};

const validateConfirmPwd = (rule, value, callback) => {
  if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入的新密码不一致!'));
  } else {
    callback();
  }
};

const pwdFormRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }, { min: 6, message: '密码长度至少6位', trigger: 'blur' }],
  confirmPassword: [{ required: true, message: '请再次输入新密码', trigger: 'blur' }, { validator: validateConfirmPwd, trigger: 'blur' }],
};

// --- 方法 ---
// 2. 更新基本资料
const handleUpdateInfo = async () => {
  await infoFormRef.value.validate();
  if (USE_REAL_API) {
    try {
      await updateProfile(infoForm);
      ElMessage.success('基本资料保存成功！');
      onMounted(); // 成功后重新获取最新信息
    } catch (error) { /* ElMessage is handled in interceptor */ }
  } else {
    userInfo.value.realName = infoForm.realName;
    userInfo.value.phone = infoForm.phone;
    userInfo.value.email = infoForm.email;
    const dept = mockDepartments.find(d => d.deptId === infoForm.deptId);
    if (dept) { userInfo.value.departmentName = dept.deptName; }
    ElMessage.success('基本资料保存成功（模拟）');
  }
};

// 3. 修改密码
const handleUpdatePwd = async () => {
  await pwdFormRef.value.validate();
  if (USE_REAL_API) {
    try {
      await updatePassword({ oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword });
      ElMessage.success('密码修改成功！');
      pwdFormRef.value.resetFields();
    } catch (error) { /* ElMessage is handled in interceptor */ }
  } else {
    ElMessage.success('密码修改成功（模拟）');
    pwdFormRef.value.resetFields();
  }
};

// 4. 头像上传
const handleAvatarSuccess = async (response, uploadFile) => {
  if (USE_REAL_API) {
    // 在真实场景中，我们通常不需要 :on-success，而是使用 :http-request 自定义上传行为
    // 这里我们简化一下，假设上传成功后后端返回了新的头像URL
    // userInfo.value.avatarUrl = response.data.avatarUrl;
    // imageUrl.value = response.data.avatarUrl;
    // ElMessage.success('头像上传成功！');
  } else {
    imageUrl.value = URL.createObjectURL(uploadFile.raw);
    ElMessage.success('头像上传成功（模拟）');
  }
};

const beforeAvatarUpload = (rawFile) => {
  const isJpgOrPng = rawFile.type === 'image/jpeg' || rawFile.type === 'image/png';
  const isLt2M = rawFile.size / 1024 / 1024 < 2;
  if (!isJpgOrPng) ElMessage.error('头像图片只能是 JPG 或 PNG 格式!');
  if (!isLt2M) ElMessage.error('头像图片大小不能超过 2MB!');

  // 在真实API模式下，可以在这里直接上传
  if (USE_REAL_API && isJpgOrPng && isLt2M) {
    const formData = new FormData();
    formData.append('avatarfile', rawFile);
    uploadAvatar(formData).then(res => {
      imageUrl.value = res.data.avatarUrl; // 假设后端返回新头像地址
      ElMessage.success("头像上传成功！");
    });
  }

  // 返回 false 可以阻止 el-upload 的默认上传行为
  return !USE_REAL_API && isJpgOrPng && isLt2M;
};
</script>

<style scoped>
.user-card .card-header { text-align: center; }
.user-info-body { display: flex; flex-direction: column; align-items: center; gap: 20px; }
.user-details p { margin: 8px 0; display: flex; align-items: center; gap: 8px; font-size: 14px; color: #333; }
.detail-text { color: #666; font-weight: 500; }

/* 3. 新增头像上传组件的样式 */
.avatar-uploader {
  border: 1px dashed var(--el-border-color);
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}
.avatar-uploader:hover {
  border-color: var(--el-color-primary);
}
.avatar {
  width: 120px;
  height: 120px;
  display: block;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  text-align: center;
}
</style>