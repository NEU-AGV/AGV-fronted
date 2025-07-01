<template>
  <div class="personal-center-container">
    <!-- 顶部标题居中 -->
    <div class="page-header">
      <h1>基本资料</h1>
    </div>

    <el-row :gutter="24" class="content-row">
      <!-- 左侧个人信息卡片 -->
      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <el-card class="glass-card user-card">
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
              <div class="detail-item">
                <el-icon><User /></el-icon>
                <span class="detail-label">用户名称：</span>
                <span class="detail-text">{{ userInfo.username }}</span>
              </div>
              <div class="detail-item">
                <el-icon><Postcard /></el-icon>
                <span class="detail-label">真实姓名：</span>
                <span class="detail-text">{{ userInfo.realName || '待完善' }}</span>
              </div>
              <div class="detail-item">
                <el-icon><Phone /></el-icon>
                <span class="detail-label">手机号码：</span>
                <span class="detail-text">{{ userInfo.phone || '待完善' }}</span>
              </div>
              <div class="detail-item">
                <el-icon><Message /></el-icon>
                <span class="detail-label">用户邮箱：</span>
                <span class="detail-text">{{ userInfo.email }}</span>
              </div>
              <div class="detail-item">
                <el-icon><OfficeBuilding /></el-icon>
                <span class="detail-label">所属部门：</span>
                <span class="detail-text">{{ userInfo.departmentName || '待完善' }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧表单区域 -->
      <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
        <el-card class="glass-card form-card">
          <div class="tab-nav">
            <div 
              :class="['tab-item', { active: activeTab === 'info' }]" 
              @click="activeTab = 'info'"
            >
              <span>基本资料</span>
              <div class="tab-underline" v-if="activeTab === 'info'"></div>
            </div>
            <div 
              :class="['tab-item', { active: activeTab === 'password' }]" 
              @click="activeTab = 'password'"
            >
              <span>修改密码</span>
              <div class="tab-underline" v-if="activeTab === 'password'"></div>
            </div>
          </div>

          <div class="form-content">
            <template v-if="activeTab === 'info'">
              <el-form ref="infoFormRef" :model="infoForm" :rules="infoFormRules" label-width="100px">
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
                  <el-button type="primary" class="custom-btn" @click="handleUpdateInfo">保存修改</el-button>
                </el-form-item>
              </el-form>
            </template>
            <template v-else>
              <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdFormRules" label-width="100px">
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
                  <el-button type="primary" class="custom-btn" @click="handleUpdatePwd">修改密码</el-button>
                </el-form-item>
              </el-form>
            </template>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
// 逻辑部分保持不变
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { User, Phone, Message, OfficeBuilding, Postcard, Plus } from '@element-plus/icons-vue';
import { getProfile, updateProfile, updatePassword, uploadAvatar } from '@/api/profile.js';

const USE_REAL_API = false;
const activeTab = ref('info');
const infoFormRef = ref(null);
const pwdFormRef = ref(null);
const imageUrl = ref('');
const userInfo = ref({});
const mockDepartments = [{ deptId: 101, deptName: '研发部' }, { deptId: 102, deptName: '运维部' }];
const infoForm = reactive({ realName: '', phone: '', email: '', deptId: null });
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' });

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

const handleUpdateInfo = async () => {
  await infoFormRef.value.validate();
  if (USE_REAL_API) {
    try {
      await updateProfile(infoForm);
      ElMessage.success('基本资料保存成功！');
      onMounted();
    } catch (error) { }
  } else {
    userInfo.value.realName = infoForm.realName;
    userInfo.value.phone = infoForm.phone;
    userInfo.value.email = infoForm.email;
    const dept = mockDepartments.find(d => d.deptId === infoForm.deptId);
    if (dept) { userInfo.value.departmentName = dept.deptName; }
    ElMessage.success('基本资料保存成功（模拟）');
  }
};

const handleUpdatePwd = async () => {
  await pwdFormRef.value.validate();
  if (USE_REAL_API) {
    try {
      await updatePassword({ oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword });
      ElMessage.success('密码修改成功！');
      pwdFormRef.value.resetFields();
    } catch (error) { }
  } else {
    ElMessage.success('密码修改成功（模拟）');
    pwdFormRef.value.resetFields();
  }
};

const handleAvatarSuccess = async (response, uploadFile) => {
  if (USE_REAL_API) { } else {
    imageUrl.value = URL.createObjectURL(uploadFile.raw);
    ElMessage.success('头像上传成功（模拟）');
  }
};

const beforeAvatarUpload = (rawFile) => {
  const isJpgOrPng = rawFile.type === 'image/jpeg' || rawFile.type === 'image/png';
  const isLt2M = rawFile.size / 1024 / 1024 < 2;
  if (!isJpgOrPng) ElMessage.error('头像图片只能是 JPG 或 PNG 格式!');
  if (!isLt2M) ElMessage.error('头像图片大小不能超过 2MB!');

  if (USE_REAL_API && isJpgOrPng && isLt2M) {
    const formData = new FormData();
    formData.append('avatarfile', rawFile);
    uploadAvatar(formData).then(res => {
      imageUrl.value = res.data.avatarUrl;
      ElMessage.success("头像上传成功！");
    });
  }

  return !USE_REAL_API && isJpgOrPng && isLt2M;
};
</script>

<style scoped lang="scss">
$primary-color: #00d4ff;
$bg-gradient: linear-gradient(145deg, #0a0a0a, #121212);
$glass-bg: rgba(0, 212, 255, 0.1);
$border-color: rgba(0, 212, 255, 0.3);
$text-color: #e0e0e0;
$highlight-text: #c1f0ff;
$placeholder-color: #909399; // 调整为更明显的灰色

.personal-center-container {
  background: $bg-gradient;
  min-height: 100vh;
  padding: 20px;
  border-radius: 16px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
  
  h1 {
    color: $primary-color;
    font-size: 28px;
    font-weight: 600;
    margin: 0;
    padding-bottom: 10px;
    position: relative;
    display: inline-block;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 3px;
      background: linear-gradient(90deg, transparent, $primary-color, transparent);
    }
  }
}

.content-row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 !important;
}

.glass-card {
  background: $glass-bg;
  border: 1px solid $border-color;
  backdrop-filter: blur(12px);
  border-radius: 12px;
  box-shadow: 
    0 8px 24px rgba(0, 212, 255, 0.05),
    inset 0 1px 1px rgba(255, 255, 255, 0.03);
  transition: all 0.3s;
  height: 100%;
  padding: 24px;
}

.user-card {
  .card-header {
    text-align: center;
    color: $primary-color;
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 20px;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 2px;
      background-color: $primary-color;
    }
  }
}

.user-info-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.user-avatar {
  margin-bottom: 10px;
  
  :deep(.avatar-uploader) {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 2px dashed $border-color;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.3s;
    
    &:hover {
      border-color: $primary-color;
      transform: scale(1.05);
    }
    
    .avatar {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .avatar-uploader-icon {
      font-size: 28px;
      color: $text-color;
    }
  }
}

.user-details {
  width: 100%;
  
  .detail-item {
    display: flex;
    align-items: center;
    margin: 16px 0;
    font-size: 16px;
    
    .el-icon {
      margin-right: 10px;
      color: $primary-color;
      font-size: 18px;
    }
    
    .detail-label {
      color: $text-color;
      min-width: 80px;
    }
    
    .detail-text {
      color: $highlight-text;
      font-weight: 500;
    }
  }
}

.form-card {
  .tab-nav {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-bottom: 30px;
    
    .tab-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      color: $text-color;
      font-size: 18px;
      font-weight: 500;
      transition: all 0.3s;
      
      &.active {
        color: $primary-color;
        transform: translateY(-2px);
      }
      
      .tab-underline {
        width: 100%;
        height: 2px;
        background-color: $primary-color;
        margin-top: 8px;
      }
    }
  }
  
  .form-content {
    max-width: 600px;
    margin: 0 auto;
    
    :deep(.el-form-item__label) {
      color: $text-color;
      font-size: 16px;
    }
    
    :deep(.el-input__inner) {
      background-color: transparent;
      border-color: $border-color;
      color: $text-color;
      
      &::placeholder {
        color: $placeholder-color; // 调整占位文字颜色
      }
      
      &:focus {
        border-color: $primary-color;
        box-shadow: none;
      }
    }
  }
}

.custom-btn {
  background-color: $primary-color !important;
  color: #000 !important;
  border-color: $primary-color !important;
  padding: 12px 24px;
  font-size: 16px;
  transition: all 0.3s;
  
  &:hover {
    background-color: darken($primary-color, 10%) !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
  }
}

@media (max-width: 992px) {
  .content-row {
    flex-direction: column;
  }
  
  .user-card {
    margin-bottom: 24px;
  }
  
  .form-content {
    padding: 0 16px;
  }
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 24px;
  }
  
  .user-details .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .tab-nav {
    gap: 20px !important;
    
    .tab-item {
      font-size: 16px !important;
    }
  }
  
  .custom-btn {
    width: 100%;
  }
}
</style>