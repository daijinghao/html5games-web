const express = require('express');
const router = express.Router();
const GameCollector = require('./collector');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const collector = new GameCollector(supabase);

// 验证 Cron Job 请求
const verifyCronRequest = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
        next();
    } else {
        res.status(401).json({ error: '未授权' });
    }
};

// 数据更新定时任务
router.post('/update-data', verifyCronRequest, async (req, res) => {
    try {
        await collector.startCollecting();
        res.json({ success: true, message: '数据更新成功' });
    } catch (error) {
        console.error('定时数据更新失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router; 