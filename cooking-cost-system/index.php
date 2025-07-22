<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>管理者パネル - 料理原価計算システム</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .admin-container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .admin-header {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 20px 30px;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .admin-title {
            color: white;
            font-size: 2.5rem;
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }

        .admin-nav {
            display: flex;
            gap: 15px;
        }

        .nav-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 10px 20px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .nav-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }

        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 25px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 25px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            transition: transform 0.3s ease;
        }

        .stat-card:hover {
            transform: translateY(-5px);
        }

        .stat-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .stat-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #555;
        }

        .stat-icon {
            font-size: 2rem;
            opacity: 0.7;
        }

        .stat-value {
            font-size: 2.5rem;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }

        .stat-description {
            font-size: 0.9rem;
            color: #7f8c8d;
        }

        .chart-container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 25px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }

        .chart-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 20px;
            text-align: center;
        }

        .chart {
            height: 300px;
            display: flex;
            align-items: end;
            justify-content: space-around;
            background: linear-gradient(to top, #ecf0f1 0%, #ecf0f1 1px, transparent 1px);
            background-size: 100% 20px;
            padding: 20px;
            border-radius: 10px;
        }

        .bar {
            width: 40px;
            background: linear-gradient(to top, #3498db, #2980b9);
            border-radius: 4px 4px 0 0;
            position: relative;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .bar:hover {
            filter: brightness(1.1);
            transform: scale(1.05);
        }

        .bar-label {
            position: absolute;
            bottom: -25px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.8rem;
            color: #7f8c8d;
            white-space: nowrap;
        }

        .bar-value {
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.8rem;
            font-weight: 600;
            color: #2c3e50;
        }

        .report-section {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 25px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }

        .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #ecf0f1;
        }

        .report-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #2c3e50;
        }

        .report-filters {
            display: flex;
            gap: 15px;
            align-items: center;
        }

        .filter-select {
            padding: 8px 15px;
            border: 2px solid #bdc3c7;
            border-radius: 8px;
            font-size: 14px;
            background: white;
        }

        .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .report-table th,
        .report-table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #ecf0f1;
        }

        .report-table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #2c3e50;
        }

        .report-table tr:hover {
            background: #f8f9fa;
        }

        .trend-indicator {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 0.8rem;
            font-weight: 600;
        }

        .trend-up {
            color: #27ae60;
        }

        .trend-down {
            color: #e74c3c;
        }

        .trend-neutral {
            color: #f39c12;
        }

        .system-info {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 25px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }

        .info-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            border-left: 4px solid #3498db;
        }

        .info-label {
            font-size: 0.9rem;
            color: #7f8c8d;
            margin-bottom: 5px;
        }

        .info-value {
            font-size: 1.1rem;
            font-weight: 600;
            color: #2c3e50;
        }

        .action-buttons {
            display: flex;
            gap: 15px;
            margin-top: 20px;
            flex-wrap: wrap;
        }

        .action-btn {
            padding: 12px 20px;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .action-btn.primary {
            background: #3498db;
            color: white;
        }

        .action-btn.success {
            background: #27ae60;
            color: white;
        }

        .action-btn.warning {
            background: #f39c12;
            color: white;
        }

        .action-btn.danger {
            background: #e74c3c;
            color: white;
        }

        .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }

        .modal {
            display: none;
            position: fixed;
            z-index: 2000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.6);
            backdrop-filter: blur(8px);
        }

        .modal-content {
            background: white;
            margin: 3% auto;
            padding: 30px;
            border-radius: 20px;
            width: 90%;
            max-width: 600px;
            box-shadow: 0 25px 60px rgba(0,0,0,0.3);
            max-height: 80vh;
            overflow-y: auto;
        }

        .progress-ring {
            width: 120px;
            height: 120px;
            margin: 0 auto;
        }

        .progress-ring circle {
            fill: none;
            stroke: #ecf0f1;
            stroke-width: 8;
        }

        .progress-ring .progress {
            stroke: #3498db;
            stroke-linecap: round;
            transition: stroke-dasharray 0.3s ease;
        }

        @media (max-width: 768px) {
            .dashboard-grid {
                grid-template-columns: 1fr;
            }
            
            .admin-header {
                flex-direction: column;
                gap: 20px;
                text-align: center;
            }
            
            .admin-nav {
                flex-wrap: wrap;
                justify-content: center;
            }
            
            .report-filters {
                flex-direction: column;
                align-items: stretch;
            }
        }
    </style>
</head>
<body>
    <div class="admin-container">
        <!-- ヘッダー -->
        <div class="admin-header">
            <h1 class="admin-title">🔧 管理者パネル</h1>
            <nav class="admin-nav">
                <a href="index.php" class="nav-btn">🏠 メイン画面</a>
                <a href="#" class="nav-btn" onclick="exportReport()">📊 レポート出力</a>
                <a href="#" class="nav-btn" onclick="openBackupModal()">💾 バックアップ</a>
                <a href="#" class="nav-btn" onclick="openSettingsModal()">⚙️ 設定</a>
            </nav>
        </div>

        <!-- ダッシュボード統計 -->
        <div class="dashboard-grid">
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">登録食材数</span>
                    <span class="stat-icon">🛒</span>
                </div>
                <div class="stat-value" id="ingredients-count">-</div>
                <div class="stat-description">
                    今月: <span class="trend-indicator trend-up">↗ +12</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">作成料理数</span>
                    <span class="stat-icon">🍳</span>
                </div>
                <div class="stat-value" id="dishes-count">-</div>
                <div class="stat-description">
                    今月: <span class="trend-indicator trend-up">↗ +8</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">完成品数</span>
                    <span class="stat-icon">🏆</span>
                </div>
                <div class="stat-value" id="foods-count">-</div>
                <div class="stat-description">
                    今月: <span class="trend-indicator trend-up">↗ +5</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">平均原価</span>
                    <span class="stat-icon">💰</span>
                </div>
                <div class="stat-value" id="average-cost">-</div>
                <div class="stat-description">
                    先月比: <span class="trend-indicator trend-down">↘ -2.3%</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">データベースサイズ</span>
                    <span class="stat-icon">🗄️</span>
                </div>
                <div class="stat-value" id="db-size">-</div>
                <div class="stat-description">
                    テーブル数: <span id="table-count">-</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">システム負荷</span>
                    <span class="stat-icon">⚡</span>
                </div>
                <div class="stat-value">
                    <svg class="progress-ring" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="50"></circle>
                        <circle cx="60" cy="60" r="50" class="progress" 
                                stroke-dasharray="0 314" id="load-progress"></circle>
                    </svg>
                </div>
                <div class="stat-description">CPU・メモリ使用率</div>
            </div>
        </div>

        <!-- ジャンル別統計チャート -->
        <div class="chart-container">
            <h2 class="chart-title">ジャンル別食材分布</h2>
            <div class="chart" id="genre-chart">
                <!-- チャートバーがJavaScriptで生成される -->
            </div>
        </div>

        <!-- 最近の活動レポート -->
        <div class="report-section">
            <div class="report-header">
                <h2 class="report-title">最近の活動</h2>
                <div class="report-filters">
                    <select class="filter-select" id="activity-filter">
                        <option value="all">すべて</option>
                        <option value="ingredients">食材</option>
                        <option value="dishes">料理</option>
                        <option value="foods">完成品</option>
                    </select>
                    <select class="filter-select" id="period-filter">
                        <option value="today">今日</option>
                        <option value="week">今週</option>
                        <option value="month">今月</option>
                    </select>
                </div>
            </div>
            
            <table class="report-table" id="activity-table">
                <thead>
                    <tr>
                        <th>時刻</th>
                        <th>種類</th>
                        <th>項目名</th>
                        <th>操作</th>
                        <th>詳細</th>
                    </tr>
                </thead>
                <tbody id="activity-tbody">
                    <!-- データがJavaScriptで追加される -->
                </tbody>
            </table>
        </div>

        <!-- システム情報 -->
        <div class="system-info">
            <h2 class="chart-title">システム情報</h2>
            <div class="info-grid" id="system-info-grid">
                <!-- システム情報がJavaScriptで追加される -->
            </div>
            
            <div class="action-buttons">
                <button class="action-btn primary" onclick="checkSystemHealth()">
                    🔍 システムチェック
                </button>
                <button class="action-btn success" onclick="optimizeDatabase()">
                    🚀 データベース最適化
                </button>
                <button class="action-btn warning" onclick="clearCache()">
                    🧹 キャッシュクリア
                </button>
                <button class="action-btn danger" onclick="openMaintenanceModal()">
                    🔧 メンテナンスモード
                </button>
            </div>
        </div>
    </div>

    <!-- バックアップモーダル -->
    <div id="backupModal" class="modal">
        <div class="modal-content">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>💾 データバックアップ</h2>
                <span style="cursor: pointer; font-size: 1.5rem;" onclick="closeModal('backupModal')">&times;</span>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>バックアップオプション</h3>
                <label style="display: block; margin: 10px 0;">
                    <input type="checkbox" checked> 食材データ
                </label>
                <label style="display: block; margin: 10px 0;">
                    <input type="checkbox" checked> 料理データ
                </label>
                <label style="display: block; margin: 10px 0;">
                    <input type="checkbox" checked> 完成品データ
                </label>
                <label style="display: block; margin: 10px 0;">
                    <input type="checkbox"> メモデータ
                </label>
            </div>
            
            <div style="display: flex; gap: 15px;">
                <button class="action-btn primary" onclick="createBackup()" style="flex: 1;">
                    バックアップ作成
                </button>
                <button class="action-btn secondary" onclick="closeModal('backupModal')" style="flex: 1;">
                    キャンセル
                </button>
            </div>
        </div>
    </div>

    <!-- 設定モーダル -->
    <div id="settingsModal" class="modal">
        <div class="modal-content">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>⚙️ システム設定</h2>
                <span style="cursor: pointer; font-size: 1.5rem;" onclick="closeModal('settingsModal')">&times;</span>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>表示設定</h3>
                <label style="display: block; margin: 10px 0;">
                    価格表示精度:
                    <select style="margin-left: 10px; padding: 5px;">
                        <option value="0">整数</option>
                        <option value="1">小数点1桁</option>
                        <option value="2" selected>小数点2桁</option>
                    </select>
                </label>
                
                <h3 style="margin-top: 20px;">データ管理</h3>
                <label style="display: block; margin: 10px 0;">
                    <input type="checkbox" checked> 自動バックアップ
                </label>
                <label style="display: block; margin: 10px 0;">
                    データ保持期間:
                    <select style="margin-left: 10px; padding: 5px;">
                        <option value="30">30日</option>
                        <option value="90" selected>90日</option>
                        <option value="365">1年</option>
                        <option value="0">無制限</option>
                    </select>
                </label>
            </div>
            
            <div style="display: flex; gap: 15px;">
                <button class="action-btn primary" onclick="saveSettings()" style="flex: 1;">
                    設定保存
                </button>
                <button class="action-btn secondary" onclick="closeModal('settingsModal')" style="flex: 1;">
                    キャンセル
                </button>
            </div>
        </div>
    </div>

    <script>
        // 管理者パネル JavaScript機能
        let statsData = {
            ingredients: 0,
            dishes: 0,
            foods: 0,
            averageCost: 0
        };

        // 初期化
        window.onload = function() {
            loadDashboardData();
            loadActivityLog();
            loadSystemInfo();
            setInterval(updateRealTimeStats, 30000); // 30秒ごとに更新
        };

        // ダッシュボードデータ読み込み
        async function loadDashboardData() {
            try {
                // 統計データを並列取得
                const [ingredients, dishes, foods] = await Promise.all([
                    fetch('api.php/ingredients').then(r => r.json()),
                    fetch('api.php/dishes').then(r => r.json()),
                    fetch('api.php/foods').then(r => r.json())
                ]);

                statsData.ingredients = ingredients.data?.length || 0;
                statsData.dishes = dishes.data?.length || 0;
                statsData.foods = foods.data?.length || 0;

                // 平均原価計算
                if (foods.data?.length > 0) {
                    const totalCost = foods.data.reduce((sum, food) => sum + parseFloat(food.total_cost), 0);
                    statsData.averageCost = totalCost / foods.data.length;
                }

                updateStatCards();
                generateGenreChart(ingredients.data || []);
                
            } catch (error) {
                console.error('ダッシュボードデータの読み込みに失敗:', error);
            }
        }

        // 統計カード更新
        function updateStatCards() {
            document.getElementById('ingredients-count').textContent = statsData.ingredients;
            document.getElementById('dishes-count').textContent = statsData.dishes;
            document.getElementById('foods-count').textContent = statsData.foods;
            document.getElementById('average-cost').textContent = '¥' + statsData.averageCost.toFixed(2);
            
            // アニメーション効果
            animateNumbers();
        }

        // 数値アニメーション
        function animateNumbers() {
            const elements = document.querySelectorAll('.stat-value');
            elements.forEach(el => {
                el.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    el.style.transform = 'scale(1)';
                }, 200);
            });
        }

        // ジャンル別チャート生成
        function generateGenreChart(ingredients) {
            const genreCount = {};
            const genreInfo = {
                meat: { name: '肉', color: '#e74c3c' },
                vegetable: { name: '野菜', color: '#27ae60' },
                seasoning: { name: '調味料', color: '#f39c12' },
                sauce: { name: 'ソース', color: '#e91e63' },
                frozen: { name: '冷凍', color: '#3498db' },
                drink: { name: 'ドリンク', color: '#9b59b6' }
            };

            // ジャンル別カウント
            ingredients.forEach(ingredient => {
                const genre = ingredient.genre || 'other';
                genreCount[genre] = (genreCount[genre] || 0) + 1;
            });

            const chartContainer = document.getElementById('genre-chart');
            chartContainer.innerHTML = '';

            const maxCount = Math.max(...Object.values(genreCount));

            Object.entries(genreCount).forEach(([genre, count]) => {
                const bar = document.createElement('div');
                bar.className = 'bar';
                bar.style.height = `${(count / maxCount) * 250}px`;
                bar.style.background = `linear-gradient(to top, ${genreInfo[genre]?.color || '#95a5a6'}, ${genreInfo[genre]?.color || '#95a5a6'}dd)`;
                
                bar.innerHTML = `
                    <div class="bar-value">${count}</div>
                    <div class="bar-label">${genreInfo[genre]?.name || genre}</div>
                `;
                
                bar.onclick = () => {
                    alert(`${genreInfo[genre]?.name || genre}: ${count}個の食材`);
                };
                
                chartContainer.appendChild(bar);
            });
        }

        // 活動ログ読み込み
        function loadActivityLog() {
            const tbody = document.getElementById('activity-tbody');
            
            // モックデータ（実際はAPIから取得）
            const activities = [
                { time: '14:30', type: '食材', name: '鶏もも肉', action: '追加', detail: '300g ¥250' },
                { time: '14:25', type: '料理', name: '唐揚げ', action: '作成', detail: '原価 ¥180' },
                { time: '14:20', type: '食材', name: '醤油', action: '更新', detail: '価格変更' },
                { time: '14:15', type: '完成品', name: '唐揚げ定食', action: '登録', detail: '原価 ¥320' },
                { time: '14:10', type: '食材', name: 'キャベツ', action: '削除', detail: '在庫切れ' }
            ];

            tbody.innerHTML = '';
            activities.forEach(activity => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${activity.time}</td>
                    <td><span style="padding: 4px 8px; border-radius: 12px; background: #ecf0f1; font-size: 0.8rem;">${activity.type}</span></td>
                    <td>${activity.name}</td>
                    <td><span style="color: ${activity.action === '追加' ? '#27ae60' : activity.action === '削除' ? '#e74c3c' : '#f39c12'};">${activity.action}</span></td>
                    <td>${activity.detail}</td>
                `;
                tbody.appendChild(row);
            });
        }

        // システム情報読み込み
        function loadSystemInfo() {
            const grid = document.getElementById('system-info-grid');
            
            // モックデータ（実際はAPIから取得）
            const systemInfo = {
                'PHP バージョン': '8.0.23',
                'MySQL バージョン': '8.0.30',
                'サーバー': 'Apache/2.4.54',
                'メモリ使用量': '45.2 MB',
                'ディスク使用量': '1.2 GB',
                'アップタイム': '7日 12時間',
                '最終バックアップ': '2024-01-15 03:00',
                'データベース接続': '正常'
            };

            grid.innerHTML = '';
            Object.entries(systemInfo).forEach(([label, value]) => {
                const item = document.createElement('div');
                item.className = 'info-item';
                item.innerHTML = `
                    <div class="info-label">${label}</div>
                    <div class="info-value">${value}</div>
                `;
                grid.appendChild(item);
            });

            // システム負荷更新
            updateSystemLoad();
        }

        // システム負荷更新
        function updateSystemLoad() {
            const loadPercentage = Math.floor(Math.random() * 30) + 20; // 20-50%のランダム値
            const circle = document.getElementById('load-progress');
            const circumference = 2 * Math.PI * 50;
            const strokeDasharray = (loadPercentage / 100) * circumference;
            
            circle.style.strokeDasharray = `${strokeDasharray} ${circumference}`;
            
            // 負荷に応じて色を変更
            if (loadPercentage > 70) {
                circle.style.stroke = '#e74c3c';
            } else if (loadPercentage > 50) {
                circle.style.stroke = '#f39c12';
            } else {
                circle.style.stroke = '#27ae60';
            }
        }

        // リアルタイム統計更新
        function updateRealTimeStats() {
            loadDashboardData();
            updateSystemLoad();
            
            // データベースサイズ更新（モック）
            const dbSize = (Math.random() * 50 + 10).toFixed(1);
            document.getElementById('db-size').textContent = dbSize + ' MB';
            document.getElementById('table-count').textContent = '6';
        }

        // モーダル管理
        function openBackupModal() {
            document.getElementById('backupModal').style.display = 'block';
        }

        function openSettingsModal() {
            document.getElementById('settingsModal').style.display = 'block';
        }

        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }

        // バックアップ作成
        function createBackup() {
            // 実際の実装では、選択されたオプションに基づいてバックアップを作成
            alert('バックアップを作成しています...');
            
            setTimeout(() => {
                alert('バックアップが正常に作成されました！');
                closeModal('backupModal');
            }, 2000);
        }

        // 設定保存
        function saveSettings() {
            alert('設定を保存しました');
            closeModal('settingsModal');
        }

        // システムヘルスチェック
        function checkSystemHealth() {
            alert('システムヘルスチェックを実行中...');
            // 実際の実装では、各種チェックを行う
        }

        // データベース最適化
        function optimizeDatabase() {
            if (confirm('データベースの最適化を実行しますか？')) {
                alert('最適化を実行中...');
                // 実際の実装では、OPTIMIZE TABLE等を実行
            }
        }

        // キャッシュクリア
        function clearCache() {
            if (confirm('キャッシュをクリアしますか？')) {
                alert('キャッシュをクリアしました');
                // 実際の実装では、OPCache等をクリア
            }
        }

        // メンテナンスモード
        function openMaintenanceModal() {
            if (confirm('メンテナンスモードに入りますか？')) {
                alert('メンテナンスモードを有効にしました');
                // 実際の実装では、.maintenanceファイルを作成
            }
        }

        // レポート出力
        function exportReport() {
            const reportData = {
                generated: new Date().toISOString(),
                stats: statsData,
                system: 'Cooking Cost Calculator v5.0'
            };
            
            const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        // ウィンドウクリックでモーダルを閉じる
        window.onclick = function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        }
    </script>
</body>
</html>

<?php
// reports_api.php - レポート用API
require_once 'config.php';
require_once 'Database.php';
require_once 'utils.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $database = new Database();
        $db = $database->connect();
        
        $reportType = $_GET['type'] ?? 'summary';
        
        switch ($reportType) {
            case 'summary':
                // 概要統計
                $stats = [];
                
                // 食材数
                $stmt = $db->prepare("SELECT COUNT(*) as count FROM ingredients");
                $stmt->execute();
                $stats['ingredients_count'] = $stmt->fetch()['count'];
                
                // 料理数
                $stmt = $db->prepare("SELECT COUNT(*) as count FROM dishes");
                $stmt->execute();
                $stats['dishes_count'] = $stmt->fetch()['count'];
                
                // 完成品数
                $stmt = $db->prepare("SELECT COUNT(*) as count FROM completed_foods");
                $stmt->execute();
                $stats['foods_count'] = $stmt->fetch()['count'];
                
                // 平均原価
                $stmt = $db->prepare("SELECT AVG(total_cost) as avg_cost FROM completed_foods");
                $stmt->execute();
                $stats['average_cost'] = $stmt->fetch()['avg_cost'] ?: 0;
                
                // ジャンル別統計
                $stmt = $db->prepare("SELECT genre, COUNT(*) as count FROM ingredients GROUP BY genre");
                $stmt->execute();
                $stats['genre_distribution'] = $stmt->fetchAll();
                
                Response::success($stats);
                break;
                
            case 'cost_analysis':
                // コスト分析
                $period = $_GET['period'] ?? '30';
                
                $stmt = $db->prepare("
                    SELECT DATE(created_at) as date, 
                           COUNT(*) as items_created,
                           AVG(total_cost) as avg_cost
                    FROM completed_foods 
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                    GROUP BY DATE(created_at)
                    ORDER BY date DESC
                ");
                $stmt->execute([$period]);
                $analysis = $stmt->fetchAll();
                
                Response::success($analysis);
                break;
                
            case 'efficiency':
                // 効率分析
                $stmt = $db->prepare("
                    SELECT i.name,
                           i.unit_price,
                           COUNT(di.dish_id) as usage_count,
                           AVG(di.used_quantity) as avg_usage
                    FROM ingredients i
                    LEFT JOIN dish_ingredients di ON i.id = di.ingredient_id
                    GROUP BY i.id
                    ORDER BY usage_count DESC
                    LIMIT 20
                ");
                $stmt->execute();
                $efficiency = $stmt->fetchAll();
                
                Response::success($efficiency);
                break;
                
            default:
                Response::error('無効なレポートタイプです', 400);
        }
        
    } catch (Exception $e) {
        Utils::log('ERROR', 'Report generation failed: ' . $e->getMessage());
        Response::serverError('レポート生成に失敗しました');
    }
}
?>
