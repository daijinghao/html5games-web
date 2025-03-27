// DOM 元素
let elements = {
    totalGames: null,
    lastUpdate: null,
    collectStatus: null,
    downloadJson: null,
    downloadPackage: null,
    lastStart: null,
    lastEnd: null,
    lastError: null,
    progressContainer: null,
    progressBar: null,
    progressText: null
};

// 导入 i18n 模块
import i18n from './i18n.js';

// 状态更新间隔（毫秒）
const STATUS_UPDATE_INTERVAL = 2000;

// 格式化日期时间
function formatDateTime(dateStr) {
    if (!dateStr) return i18n.t('statusUnknown');
    try {
        const date = new Date(dateStr);
        return date.toLocaleString(i18n.getCurrentLanguage(), {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    } catch (error) {
        console.error('日期格式化失败:', error);
        return i18n.t('statusUnknown');
    }
}

// 更新进度条
function updateProgress(progress) {
    if (!progress) {
        elements.progressBar.style.width = '0%';
        elements.progressText.textContent = i18n.t('statusNotCollecting');
        return;
    }

    let displayProgress = 0;
    let displayText = '';

    switch (progress.stage) {
        case '初始化':
            displayProgress = progress.stageProgress;
            displayText = i18n.t('statusInitializing');
            break;
        case '获取游戏列表':
            displayProgress = progress.stageProgress;
            displayText = `${i18n.t('statusGettingList')} (${Math.floor(progress.stageProgress)}%)`;
            break;
        case '采集游戏数据':
            displayProgress = progress.stageProgress;
            displayText = `${i18n.t('statusCollectingData')} ${progress.current}/${progress.total} (${Math.floor(progress.stageProgress)}%)`;
            break;
        case '生成数据包':
            displayProgress = progress.stageProgress;
            displayText = `${i18n.t('statusGeneratingPackage')} (${Math.floor(progress.stageProgress)}%)`;
            break;
        case '更新数据库':
            displayProgress = progress.stageProgress;
            displayText = `${i18n.t('statusUpdatingDB')} (${Math.floor(progress.stageProgress)}%)`;
            elements.collectStatus.textContent = i18n.t('statusUpdating');
            elements.collectStatus.className = 'status updating';
            break;
        case '更新完成':
            displayProgress = 100;
            displayText = i18n.t('statusUpdateComplete');
            break;
        case '完成':
            displayProgress = 100;
            displayText = i18n.t('statusComplete');
            break;
        case '错误':
            displayProgress = 0;
            displayText = i18n.t('statusError');
            break;
        default:
            displayProgress = 0;
            displayText = progress.stage;
    }

    elements.progressBar.style.width = `${displayProgress}%`;
    elements.progressText.textContent = displayText;
}

// 更新状态显示
function updateStatus(status) {
    // 更新游戏总数
    elements.totalGames.textContent = status.total_games || '0';

    // 更新最后更新时间
    elements.lastUpdate.textContent = status.last_collection_end ? 
        formatDateTime(status.last_collection_end) : i18n.t('statusUnknown');

    // 更新采集状态
    if (status.is_collecting) {
        elements.collectStatus.textContent = i18n.t('statusCollecting');
        elements.collectStatus.className = 'status collecting';
        elements.progressContainer.style.display = 'block';
        disableDownloadButtons(true);
    } else {
        elements.collectStatus.textContent = i18n.t('statusIdle');
        elements.collectStatus.className = 'status idle';
        elements.progressContainer.style.display = 'none';
        
        // 检查数据是否可下载
        checkDownloadAvailability();
    }

    // 更新系统信息
    elements.lastStart.textContent = status.last_collection_start ? 
        formatDateTime(status.last_collection_start) : i18n.t('statusUnknown');
    elements.lastEnd.textContent = status.last_collection_end ? 
        formatDateTime(status.last_collection_end) : i18n.t('statusUnknown');
    elements.lastError.textContent = status.last_collection_error || i18n.t('statusNone');
}

// 检查数据是否可下载
async function checkDownloadAvailability() {
    try {
        const response = await fetch('/api/status/download');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '检查下载状态失败');
        }

        // 更新下载按钮状态
        if (data.json_ready) {
            updateDownloadButton(elements.downloadJson, 'normal');
        } else {
            updateDownloadButton(elements.downloadJson, 'preparing');
        }

        if (data.package_ready) {
            updateDownloadButton(elements.downloadPackage, 'normal');
        } else {
            updateDownloadButton(elements.downloadPackage, 'preparing');
        }
    } catch (error) {
        console.error('检查下载状态失败:', error);
        // 出错时禁用下载按钮
        updateDownloadButton(elements.downloadJson, 'error');
        updateDownloadButton(elements.downloadPackage, 'error');
    }
}

// 更新下载按钮状态和文本
function updateDownloadButton(button, state, error = null) {
    if (!button) {
        console.error('Button element is missing');
        return;
    }

    const buttonContent = button.querySelector('.button-content');
    if (!buttonContent) {
        console.error('Button content element is missing');
        return;
    }

    const span = buttonContent.querySelector('span');
    const spinner = buttonContent.querySelector('.loading-spinner');

    if (!span || !spinner) {
        console.error('Required button elements are missing');
        return;
    }

    const originalText = i18n.t(button.getAttribute('data-i18n'));
    
    switch (state) {
        case 'normal':
            button.disabled = false;
            button.classList.remove('loading');
            spinner.style.display = 'none';
            span.textContent = originalText;
            break;
        case 'loading':
            button.disabled = true;
            button.classList.add('loading');
            spinner.style.display = 'block';
            span.textContent = `${originalText} - ${i18n.t('downloadInProgress')}`;
            break;
        case 'preparing':
            button.disabled = true;
            button.classList.add('loading');
            spinner.style.display = 'block';
            span.textContent = `${originalText} - ${i18n.t('downloadPreparing')}`;
            break;
        case 'error':
            button.disabled = false;
            button.classList.remove('loading');
            spinner.style.display = 'none';
            span.textContent = `${originalText} - ${i18n.t('downloadError')}`;
            break;
    }
}

// 开始采集
async function startCollection() {
    try {
        const response = await fetch('/api/collect', {
            method: 'POST'
        });
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error);
        }

        if (!result.should_collect) {
            alert(result.message);
        }
    } catch (error) {
        console.error('启动采集失败:', error);
        alert('启动采集失败: ' + error.message);
    }
}

// 下载 JSON 数据
async function downloadJson() {
    const button = elements.downloadJson;
    try {
        updateDownloadButton(button, 'preparing');
        window.location.href = '/api/download/json';
        // 短暂延迟后恢复按钮状态
        setTimeout(() => {
            updateDownloadButton(button, 'normal');
        }, 1000);
    } catch (error) {
        console.error('下载 JSON 失败:', error);
        updateDownloadButton(button, 'error');
        alert('下载 JSON 失败: ' + error.message);
    }
}

// 下载完整数据包
async function downloadPackage() {
    const button = elements.downloadPackage;
    try {
        // 禁用所有下载按钮
        disableDownloadButtons(true);
        updateDownloadButton(button, 'preparing');
        
        const response = await fetch('/api/download/package');
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (response.status === 503 && data.is_collecting) {
                alert('数据采集中，请稍后再试');
                // 立即更新一次状态
                await updateStatusPeriodically();
                return;
            }
            throw new Error(data.error || '下载失败');
        }
        
        // 开始下载
        updateDownloadButton(button, 'loading');
        
        // 处理文件下载
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `html5games_full_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        // 下载开始后，等待一段时间再恢复按钮状态
        setTimeout(() => {
            disableDownloadButtons(false);
            updateDownloadButton(button, 'normal');
        }, 3000);
    } catch (error) {
        console.error('下载数据包失败:', error);
        updateDownloadButton(button, 'error');
        disableDownloadButtons(false);
        alert('下载数据包失败: ' + error.message);
    }
}

// 定期更新状态
async function updateStatusPeriodically() {
    try {
        const response = await fetch('/api/status');
        const status = await response.json();
        updateStatus(status);
    } catch (error) {
        console.error('获取状态失败:', error);
    }
}

// 禁用/启用下载按钮
function disableDownloadButtons(disabled) {
    const buttons = [elements.downloadJson, elements.downloadPackage];
    buttons.forEach(button => {
        if (disabled) {
            updateDownloadButton(button, 'preparing');
        } else {
            updateDownloadButton(button, 'normal');
        }
    });
}

// 初始化 DOM 元素
function initializeElements() {
    elements = {
        totalGames: document.getElementById('total-games'),
        lastUpdate: document.getElementById('last-update'),
        collectStatus: document.getElementById('collect-status'),
        downloadJson: document.getElementById('download-json'),
        downloadPackage: document.getElementById('download-package'),
        lastStart: document.getElementById('last-start'),
        lastEnd: document.getElementById('last-end'),
        lastError: document.getElementById('last-error'),
        progressContainer: document.querySelector('.progress-section'),
        progressBar: document.querySelector('.progress-bar'),
        progressText: document.querySelector('.progress-text')
    };
}

// 初始化按钮状态
function initializeButtons() {
    const buttons = [elements.downloadJson, elements.downloadPackage];
    buttons.forEach(button => {
        if (!button) {
            console.error('Button element not found during initialization');
            return;
        }
        const buttonContent = button.querySelector('.button-content');
        if (!buttonContent) {
            console.error('Button content element not found during initialization');
            return;
        }
        const span = buttonContent.querySelector('span');
        const spinner = buttonContent.querySelector('.loading-spinner');
        if (!span || !spinner) {
            console.error('Button child elements not found during initialization');
            return;
        }
        updateDownloadButton(button, 'normal');
    });
}

// 初始化应用
async function initializeApp() {
    try {
        // 初始化 DOM 元素
        initializeElements();
        
        // 验证必要的元素是否存在
        const requiredElements = [
            'downloadJson',
            'downloadPackage',
            'totalGames',
            'lastUpdate',
            'collectStatus',
            'lastStart',
            'lastEnd',
            'lastError',
            'progressContainer',
            'progressBar',
            'progressText'
        ];

        const missingElements = requiredElements.filter(id => !elements[id]);
        if (missingElements.length > 0) {
            throw new Error(`Missing required elements: ${missingElements.join(', ')}`);
        }

        // 等待一个渲染帧，确保 DOM 完全更新
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // 初始化按钮状态
        initializeButtons();
        
        // 绑定按钮事件
        elements.downloadJson.addEventListener('click', downloadJson);
        elements.downloadPackage.addEventListener('click', downloadPackage);

        // 立即更新一次状态
        await updateStatusPeriodically();

        // 设置定期更新
        setInterval(updateStatusPeriodically, STATUS_UPDATE_INTERVAL);
    } catch (error) {
        console.error('Application initialization failed:', error);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 等待国际化初始化完成后再初始化应用
    setTimeout(() => {
        initializeApp();
    }, 0);
}); 