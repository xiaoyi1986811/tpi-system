// index.js - TPI 前端主逻辑（带登录认证）
let authToken = localStorage.getItem('tpi_token');

// 页面加载完成时执行
document.addEventListener('DOMContentLoaded', () => {
  if (authToken) {
    // 已登录：隐藏登录框，加载数据
    hideLogin();
    loadTpiData();
  } else {
    // 未登录：显示登录框
    showLogin();
  }
});

// 显示登录界面
function showLogin() {
  const loginContainer = document.getElementById('login-container');
  const mainContent = document.querySelector('.main-content');
  if (loginContainer) loginContainer.style.display = 'block';
  if (mainContent) mainContent.style.display = 'none';
}

// 隐藏登录界面
function hideLogin() {
  const loginContainer = document.getElementById('login-container');
  const mainContent = document.querySelector('.main-content');
  if (loginContainer) loginContainer.style.display = 'none';
  if (mainContent) mainContent.style.display = 'block';
}

// 登录函数
async function login() {
  const username = document.getElementById('username')?.value;
  const password = document.getElementById('password')?.value;
  const errorEl = document.getElementById('login-error');

  if (!username || !password) {
    if (errorEl) errorEl.textContent = '请输入用户名和密码';
    return;
  }

  try {
    const response = await fetch('https://tpi-backend-newest.onrender.com/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      localStorage.setItem('tpi_token', authToken);
      if (errorEl) errorEl.textContent = '';
      hideLogin();
      loadTpiData();
    } else {
      if (errorEl) errorEl.textContent = data.error || '登录失败';
    }
  } catch (err) {
    console.error('登录请求失败:', err);
    const errorEl = document.getElementById('login-error');
    if (errorEl) errorEl.textContent = '网络错误，请检查后端是否运行';
  }
}

// 加载 TPI 数据
async function loadTpiData() {
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error-message');

  if (loadingEl) loadingEl.style.display = 'block';
  if (errorEl) errorEl.style.display = 'none';

  try {
    const response = await fetch('https://tpi-backend-newest.onrender.com/api/data', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.status === 401 || response.status === 403) {
      // Token 失效
      alert('登录已过期，请重新登录');
      localStorage.removeItem('tpi_token');
      authToken = null;
      showLogin();
      return;
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    // 更新 TPI 分数
    const tpiScoreEl = document.querySelector('.tpi-score .number');
    if (tpiScoreEl) tpiScoreEl.textContent = data.tpi.toFixed(1);

    // 更新时间
    const updateTimeEl = document.getElementById('update-time');
    if (updateTimeEl) {
      const date = new Date(data.updateTime);
      updateTimeEl.textContent = date.toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    }

    // 渲染部门环形图
    if (data.departments) renderDepartmentRings(data.departments);

    // 渲染趋势图（保留你原有逻辑）
    renderTrendChart();

    if (loadingEl) loadingEl.style.display = 'none';

  } catch (error) {
    console.error('❌ 加载 TPI 数据失败:', error);
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) {
      errorEl.textContent = '数据加载失败，请重试';
      errorEl.style.display = 'block';
    }
  }
}

// ========== 部门环形图渲染（保留你原有样式）==========
function renderDepartmentRings(departments) {
  const container = document.querySelector('.departments-grid');
  if (!container) return;

  container.innerHTML = '';

  departments.forEach(dept => {
    const score = dept.score;
    const circumference = 2 * Math.PI * 45; // r=45
    const dasharray = (score / 100) * circumference;

    const ringHtml = `
      <div class="department-item" data-dept="${dept.name}">
        <div class="ring-container">
          <svg viewBox="0 0 100 100" class="ring">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" stroke-width="8"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="#4CAF50" 
                    stroke-width="8" stroke-dasharray="${dasharray}, ${circumference}"
                    transform="rotate(-90 50 50)" class="ring-fill"/>
          </svg>
          <div class="ring-label">${dept.name}</div>
          <div class="ring-score">${score}<small>分</small></div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', ringHtml);
  });
}

// ========== 趋势图占位（你可替换为 ECharts/Chart.js）==========
function renderTrendChart() {
  // 示例：未来可在此处集成图表库
  const chartEl = document.getElementById('trend-chart');
  if (chartEl && !chartEl.hasChildNodes()) {
    chartEl.innerHTML = '<p style="text-align:center;color:#666;">📈 趋势图（待实现）</p>';
  }
}

// ========== 支持回车登录 ==========
document.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && document.getElementById('login-container').style.display !== 'none') {
    login();
  }
});