const translations = {
    'zh-CN': {
        title: 'HTML5Games 数据采集',
        systemStatus: '系统状态',
        totalGames: '游戏总数',
        lastUpdate: '最后更新',
        collectStatus: '采集状态',
        dataDownload: '数据下载',
        downloadJsonBtn: '下载 JSON 数据',
        downloadPackageBtn: '下载完整数据包',
        systemInfo: '系统信息',
        lastCollectStart: '上次采集开始',
        lastCollectEnd: '上次采集结束',
        lastError: '上次错误信息',
        preparing: '准备中...',
        unknown: '未知',
        none: '无',
        idle: '空闲',
        collecting: '采集中',
        language: '语言'
    },
    'en-US': {
        title: 'HTML5Games Data Collection',
        systemStatus: 'System Status',
        totalGames: 'Total Games',
        lastUpdate: 'Last Update',
        collectStatus: 'Collection Status',
        dataDownload: 'Data Download',
        downloadJsonBtn: 'Download JSON Data',
        downloadPackageBtn: 'Download Full Package',
        systemInfo: 'System Information',
        lastCollectStart: 'Last Collection Start',
        lastCollectEnd: 'Last Collection End',
        lastError: 'Last Error',
        preparing: 'Preparing...',
        unknown: 'Unknown',
        none: 'None',
        idle: 'Idle',
        collecting: 'Collecting',
        language: 'Language'
    }
};

// 获取浏览器语言
const getBrowserLanguage = () => {
    const lang = navigator.language || navigator.userLanguage;
    return translations[lang] ? lang : 'en-US';
};

// 获取当前语言
const getCurrentLanguage = () => {
    return localStorage.getItem('language') || getBrowserLanguage();
};

// 设置语言
const setLanguage = (lang) => {
    if (translations[lang]) {
        localStorage.setItem('language', lang);
        updatePageTranslations();
    }
};

// 更新页面翻译
const updatePageTranslations = () => {
    const lang = getCurrentLanguage();
    const t = translations[lang];
    
    // 更新页面标题
    document.title = t.title;
    
    // 更新所有带有 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (t[key]) {
            element.textContent = t[key];
        }
    });
};

// 导出需要的函数
export {
    getCurrentLanguage,
    setLanguage,
    updatePageTranslations
}; 