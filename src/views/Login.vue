<template>
  <div class="login-container">
    <div class="login-box">
      <h1 class="login-title">地铁隧道巡线大数据仿真和分析平台</h1>

      <el-tabs v-model="activeTab" stretch @tab-click="handleTabClick">
        <el-tab-pane label="登录" name="login">
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
        </el-tab-pane>

        <el-tab-pane label="注册" name="register">
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
        </el-tab-pane>
      </el-tabs>
    </div>

    <div class="login-footer">
      Copyright © 2023-2025 All Rights Reserved.
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Key, Message } from '@element-plus/icons-vue' // 引入新版Icon
import { useAuthStore } from '@/stores/auth'
// 3. 引入更新后的 API 函数
import { login, getCaptcha, register, sendEmailCode, getUserInfo } from '@/api/user'

const router = useRouter()
const authStore = useAuthStore()

// --- 响应式状态定义 ---
const activeTab = ref('login')
const loginLoading = ref(false)
const registerLoading = ref(false)
const rememberMe = ref(false)

// 登录表单
const loginForm = reactive({
  username: '',
  password: '',
  captcha: '',
  uuid: '', // 用于存储验证码的唯一标识
})
const captchaImage = ref('') // 存储验证码图片
const loginFormRef = ref(null)

// 注册表单
const registerForm = reactive({
  username: '',
  email: '',
  code: '',
  password: '',
  confirmPassword: ''
})
const codeTimer = ref(0)
let timer = null
const registerFormRef = ref(null)


// --- 验证规则 ---
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

// --- 方法 ---

// 4. 获取并刷新图形验证码
const refreshCaptcha = async () => {
  try {
    const data = await getCaptcha()
    // 后端返回的数据通常包含 uuid 和 img (base64)
    loginForm.uuid = data.uuid
    captchaImage.value = data.img
  } catch (error) {
    ElMessage.error('验证码加载失败，请重试')
  }
}

// 登录处理
const handleLogin = async () => {
  await loginFormRef.value.validate()
  loginLoading.value = true
  try {
    const token = await login(loginForm)
    authStore.setToken(token)

    // 登录成功后获取用户信息
    const userInfo = await getUserInfo()
    authStore.setUserInfo(userInfo)

    ElMessage.success('登录成功')
    await router.push('/') // 跳转到首页
  } finally {
    loginLoading.value = false
  }
}

// 发送邮箱验证码
const handleSendEmailCode = async () => {
  // 简单校验邮箱
  const emailRule = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!registerForm.email || !emailRule.test(registerForm.email)) {
    return ElMessage.warning('请输入有效的邮箱地址')
  }

  try {
    await sendEmailCode(registerForm.email)
    ElMessage.success('验证码已发送，请注意查收')
    // 开始倒计时
    codeTimer.value = 60
    timer = setInterval(() => {
      codeTimer.value--
      if (codeTimer.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    // API层已处理错误消息，这里无需重复提示
  }
}

// 注册处理
const handleRegister = async () => {
  await registerFormRef.value.validate()
  registerLoading.value = true
  try {
    await register(registerForm)
    ElMessage.success('注册成功！已自动为您切换到登录面板。')
    // 注册成功后，切换到登录并填充用户名
    activeTab.value = 'login'
    loginForm.username = registerForm.username
  } finally {
    registerLoading.value = false
  }
}

// 切换标签页时重置表单验证状态
const handleTabClick = (tab) => {
  if (tab.paneName === 'login') {
    registerFormRef.value?.clearValidate()
  } else {
    loginFormRef.value?.clearValidate()
  }
}

// --- 生命周期钩子 ---
onMounted(() => {
  // 页面加载时，自动获取一次验证码
  refreshCaptcha()
})

onUnmounted(() => {
  // 组件卸载时，清除邮箱验证码的定时器
  clearInterval(timer)
})
</script>

<style scoped>
/* 样式与您上一个项目类似，做了微调 */
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 20px;
  background-image: url('https://images.unsplash.com/photo-1549558549-415fe4c37b60?q=80&w=2070');
  background-size: cover;
  background-position: center;
}

.login-box {
  width: 400px;
  padding: 30px 40px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  margin-bottom: 20px;
  font-size: 22px;
  color: #333;
  font-weight: 600;
}

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
  height: 32px; /* 与el-input默认大小对齐 */
  border-radius: 4px;
  cursor: pointer;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--el-border-color);
}

.captcha-image img {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

.action-btn {
  width: 100%;
  height: 40px;
}

.code-btn {
  width: 140px;
  padding: 0 10px;
}

.login-footer {
  position: absolute;
  bottom: 20px;
  color: #fff;
  font-size: 12px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}

:deep(.el-tabs__header) {
  margin-bottom: 25px;
}
:deep(.el-tabs__item) {
  font-size: 16px;
}
</style>