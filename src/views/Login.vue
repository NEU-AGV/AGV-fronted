<template>
  <div class="login-container">
    <div class="login-box glass-card">
      <h1 class="login-title">地铁隧道巡线大数据仿真和分析平台</h1>

      <div class="tab-nav">
        <div 
          :class="['tab-item', { active: activeTab === 'login' }]" 
          @click="activeTab = 'login'"
        >
          登录
          <div class="tab-underline" v-if="activeTab === 'login'"></div>
        </div>
        <div 
          :class="['tab-item', { active: activeTab === 'register' }]" 
          @click="activeTab = 'register'"
        >
          注册
          <div class="tab-underline" v-if="activeTab === 'register'"></div>
        </div>
      </div>

      <template v-if="activeTab === 'login'">
        <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
                v-model="loginForm.username"
                placeholder="请输入账号"
                prefix-icon="User"
                clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                prefix-icon="Lock"
                show-password
            />
          </el-form-item>

          <el-form-item prop="captcha">
            <div class="captcha-container">
              <el-input
                  v-model="loginForm.captcha"
                  placeholder="请输入验证码"
                  prefix-icon="Key"
                  class="captcha-input"
              />
              <div class="captcha-image" @click="refreshCaptcha">
                <img v-if="captchaImage" :src="captchaImage" alt="验证码" title="点击刷新">
                <span v-else>加载中...</span>
              </div>
            </div>
          </el-form-item>

          <el-form-item>
            <el-checkbox v-model="rememberMe">记住密码</el-checkbox>
          </el-form-item>

          <el-form-item>
            <el-button
                type="primary"
                class="action-btn"
                :loading="loginLoading"
                @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
      </template>

      <template v-else>
        <el-form
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerRules"
            @keyup.enter="handleRegister"
        >
          <el-form-item prop="username">
            <el-input
                v-model="registerForm.username"
                placeholder="请输入用户名 (3-10位)"
                prefix-icon="User"
                clearable
            />
          </el-form-item>

          <el-form-item prop="email">
            <el-input
                v-model="registerForm.email"
                placeholder="请输入邮箱"
                prefix-icon="Message"
                clearable
            />
          </el-form-item>

          <el-form-item prop="code">
            <div class="captcha-container">
              <el-input
                  v-model="registerForm.code"
                  placeholder="请输入邮箱验证码"
                  prefix-icon="Key"
                  class="captcha-input"
              />
              <el-button
                  class="code-btn"
                  :disabled="codeTimer > 0"
                  @click="handleSendEmailCode"
              >
                {{ codeTimer > 0 ? `${codeTimer}s后获取` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="请输入密码 (6-20位)"
                prefix-icon="Lock"
                show-password
            />
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <el-input
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                prefix-icon="Lock"
                show-password
            />
          </el-form-item>

          <el-form-item>
            <el-button
                type="primary"
                class="action-btn"
                :loading="registerLoading"
                @click="handleRegister"
            >
              注册
            </el-button>
          </el-form-item>
        </el-form>
      </template>
    </div>

    <div class="login-footer">
      Copyright © 2023-2025 All Rights Reserved.
    </div>
  </div>
</template>

<script setup>
// 逻辑部分保持不变，与之前相同
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock, Key, Message } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { login, getCaptcha, register, sendEmailCode, getUserInfo } from '@/api/user';

const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref('login');
const loginLoading = ref(false);
const registerLoading = ref(false);
const rememberMe = ref(false);
const loginForm = reactive({ username: '', password: '', captcha: '', uuid: '' });
const captchaImage = ref('');
const loginFormRef = ref(null);
const registerForm = reactive({ username: '', email: '', code: '', password: '', confirmPassword: '' });
const codeTimer = ref(0);
let timer = null;
const registerFormRef = ref(null);

const loginRules = reactive({
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 10, message: '长度在 3 到 10 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  code: [{ required: true, message: '请输入邮箱验证码', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
})

const refreshCaptcha = async () => {
  try {
    const response = await getCaptcha();
    loginForm.uuid = response.uuid;
    captchaImage.value = response.img;
  } catch (error) {
    console.error("获取验证码失败:", error);
    ElMessage.error('验证码加载失败，请刷新重试');
  }
};

const handleLogin = async () => {
  await loginFormRef.value.validate();
  loginLoading.value = true;
  try {
    const response = await login(loginForm);
    authStore.setToken(response.token);

    const userInfo = await getUserInfo();
    authStore.setUserInfo(userInfo);

    ElMessage.success('登录成功');
    await router.push('/');
  } catch (error) {
    await refreshCaptcha();
  } finally {
    loginLoading.value = false;
  }
};

const handleSendEmailCode = async () => {
  const emailRule = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!registerForm.email || !emailRule.test(registerForm.email)) {
    return ElMessage.warning('请输入有效的邮箱地址')
  }

  try {
    await sendEmailCode(registerForm.email)
    ElMessage.success('验证码已发送，请注意查收')
    codeTimer.value = 60
    timer = setInterval(() => {
      codeTimer.value--
      if (codeTimer.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    // API层已处理错误消息
  }
}

const handleRegister = async () => {
  await registerFormRef.value.validate();
  registerLoading.value = true;
  try {
    await register(registerForm);
    ElMessage.success('注册成功！已自动为您切换到登录面板。');
    activeTab.value = 'login';
    loginForm.username = registerForm.username;
  } catch (error) {
    // API层已处理错误消息
  } finally {
    registerLoading.value = false;
  }
};

onMounted(() => {
  refreshCaptcha()
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped lang="scss">
// 主题色变量
$primary-color: #00d4ff;
$bg-gradient: linear-gradient(145deg, #0a0a0a, #121212);
$glass-bg: rgba(0, 212, 255, 0.1);
$border-color: rgba(0, 212, 255, 0.3);
$text-color: #fff; // 未选中标签颜色改为白色
$title-color: $primary-color;

.login-title {
  text-align: center;
  margin-bottom: 30px;
  font-size: 24px;
  color: $title-color;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
}

/* 登录/注册切换标签 - 下划线样式调整 */
.tab-nav {
  display: flex;
  justify-content: flex-start;
  gap: 60px;
  margin-bottom: 30px;
  position: relative;
  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
  padding-bottom: 15px;
}

.tab-item {
  color: $text-color;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
  
  &.active {
    color: $primary-color;
    
    .tab-underline {
      width: 120%;
      opacity: 1;
    }
  }
  
  .tab-underline {
    position: absolute;
    bottom: -10px;
    left: 0;
    width: 0;
    height: 2px;
    background-color: $primary-color;
    opacity: 0;
    transition: all 0.3s;
    transform-origin: left;
  }
}

/* 输入框保持白色背景 */
:deep(.el-input__inner) {
  background-color: #fff;
  border-color: #dcdfe6;
  color: #333;
  border-radius: 4px;
  
  &::placeholder {
    color: #909399;
  }
  
  &:focus {
    border-color: $primary-color;
    box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.2);
  }
}

/* 记住密码选项改为蓝色 */
:deep(.el-checkbox__label) {
  color: $primary-color;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: $primary-color;
  border-color: $primary-color;
}

:deep(.el-checkbox__input.is-focus .el-checkbox__inner) {
  box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.2);
}

/* 其他样式保持主题风格 */
.captcha-container {
  display: flex;
  gap: 10px;
  width: 100%;
}

.captcha-input {
  flex: 1;
}

.captcha-image {
  width: 120px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dcdfe6;
  color: #606266;
  
  img {
    width: 100%;
    height: 100%;
    border-radius: 4px;
  }
}

.action-btn {
  width: 100%;
  height: 40px;
  background-color: $primary-color !important;
  color: #000 !important;
  border-color: $primary-color !important;
  font-weight: 500;
  
  &:hover {
    background-color: darken($primary-color, 10%) !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(0, 212, 255, 0.3) !important;
  }
}

.code-btn {
  width: 140px;
  padding: 0 10px;
  background-color: #f5f7fa !important;
  color: $primary-color !important;
  border-color: #dcdfe6 !important;
  
  &:hover {
    background-color: #ecf5ff !important;
  }
}

.login-footer {
  position: absolute;
  bottom: 20px;
  color: #909399;
  font-size: 12px;
}

:deep(.el-form-item__label) {
  color: $text-color;
}

:deep(.el-icon) {
  color: $primary-color;
}


.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: $bg-gradient;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 背景图应用 */
.login-container {
  position: relative;
  background: $bg-gradient;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background-image: url('@/assets/images/login-bg.png');
  background-size: cover;
  background-position: center;
  opacity: 0.3; /* 背景图透明度，不影响登录框可读性 */
  filter: blur(2px); /* 背景图模糊处理，突出登录框 */
}

.login-box {
  width: 400px;
  padding: 40px;
  background: $glass-bg;
  backdrop-filter: blur(12px);
  border-radius: 12px;
  border: 1px solid $border-color;
  box-shadow: 
    0 8px 32px rgba(0, 212, 255, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.03);
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease; /* 添加过渡效果 */
}

/* 鼠标悬停效果 */
.login-box:hover {
  transform: translateY(-5px);
  box-shadow: 
    0 12px 40px rgba(0, 212, 255, 0.15),
    inset 0 1px 1px rgba(255, 255, 255, 0.05);
}
</style>