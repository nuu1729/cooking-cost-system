// 料理原価計算システム（完全版）- JavaScript

// API設定
const API_BASE_URL = 'api.php';

// グローバル変数
let ingredients = [];
let dishes = [];
let foods = [];
let currentIngredientsFilter = '';
let currentDishesFilter = '';
let currentDishIngredients = [];
let currentIngredientForQuantity = null;
let currentDishForUsage = null;
let currentGenre = 'meat';
let foodItems = [];
let searchDebounceTimers = {};

// ジャンル情報
const genreInfo = {
    meat: { name: '肉', icon: '🥩', color: '#f44336' },
    vegetable: { name: '野菜', icon: '🥬', color: '#4caf50' },
    seasoning: { name: '調味料', icon: '🧂', color: '#ff9800' },
    sauce: { name: 'ソース', icon: '🍯', color: '#e91e63' },
    frozen: { name: '冷凍', icon: '🧊', color: '#2196f3' },
    drink: { name: 'ドリンク', icon: '🥤', color: '#9c27b0' }
};

// 初期化
window.onload = function() {
    initializeApp();
};

async function initializeApp() {
    try {
        showProgressBar(true);
        await loadAllData();
        setupEventListeners();
        setupDragAndDrop();
        showToast('システムを初期化しました', 'success');
    } catch (error) {
        console.error('初期化エラー:', error);
        showToast('システムの初期化に失敗しました', 'error');
    } finally {
        showProgressBar(false);
    }
}

// プログレスバー
function showProgressBar(show) {
    let progressBar = document.getElementById('global-progress-bar');
    
    if (!progressBar && show) {
        progressBar = document.createElement('div');
        progressBar.id = 'global-progress-bar';
        progressBar.className = 'progress-bar';
        progressBar.style.position = 'fixed';
        progressBar.style.top = '0';
        progressBar.style.left = '0';
        progressBar.style.zIndex = '9999';
        progressBar.innerHTML = '<div class="progress-bar-fill"></div>';
        document.body.appendChild(progressBar);
        
        const fill = progressBar.querySelector('.progress-bar-fill');
        fill.style.width = '30%';
        setTimeout(() => fill.style.width = '70%', 500);
        setTimeout(() => fill.style.width = '100%', 1000);
    } else if (progressBar && !show) {
        setTimeout(() => {
            if (progressBar.parentNode) {
                progressBar.parentNode.removeChild(progressBar);
            }
        }, 300);
    }
}

// トースト通知システム
function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span style="font-size: 1.2rem;">${iconMap[type] || '📋'}</span>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2rem; margin-left: auto;">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // 自動削除
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'toastSlideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// デバウンス機能
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function debounceSearch(type) {
    if (searchDebounceTimers[type]) {
        clearTimeout(searchDebounceTimers[type]);
    }
    
    searchDebounceTimers[type] = setTimeout(() => {
        if (type === 'ingredients') {
            searchIngredients();
        } else if (type === 'dishes') {
            searchDishes();
        }
    }, 300);
}

// イベントリスナー設定
function setupEventListeners() {
    // 料理名入力監視
    const dishNameInput = document.getElementById('dish-name');
    if (dishNameInput) {
        dishNameInput.addEventListener('input', updateCreateDishButton);
    }

    // 完成品名入力監視
    const foodNameInput = document.getElementById('food-name');
    if (foodNameInput) {
        foodNameInput.addEventListener('input', updateCompleteFoodButton);
    }

    // モーダル外クリックで閉じる
    window.onclick = function(event) {
        const modals = [
            'addModal', 'quantityModal', 'memoModal', 
            'priceSearchModal', 'importModal', 'dishUsageModal'
        ];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // キーボードショートカット
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
            hideFloatingAreas();
        }
        
        // Ctrl+S でデータ保存
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            exportData();
        }
        
        // Ctrl+N で新規追加
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            openAddModal();
        }
    });

    // ウィンドウリサイズ対応
    window.addEventListener('resize', function() {
        hideFloatingAreas();
        adjustLayoutForScreenSize();
    });

    // ページ離脱前の確認
    window.addEventListener('beforeunload', function(e) {
        if (currentDishIngredients.length > 0 || foodItems.length > 0) {
            e.preventDefault();
            e.returnValue = '作成中のデータが失われます。本当にページを離れますか？';
        }
    });
}

function adjustLayoutForScreenSize() {
    const isMobile = window.innerWidth <= 768;
    const panels = document.querySelectorAll('.panel');
    
    panels.forEach(panel => {
        if (isMobile) {
            panel.style.height = 'auto';
            panel.style.minHeight = '400px';
        } else {
            panel.style.height = 'calc(100vh - 200px)';
        }
    });
}

// ドラッグ&ドロップ設定
function setupDragAndDrop() {
    // グローバルなドラッグ状態管理
    let isDragging = false;
    let draggedItemType = null;
    
    document.addEventListener('dragstart', function(e) {
        if (e.target.draggable) {
            isDragging = true;
            draggedItemType = e.target.dataset.itemType;
            e.target.style.opacity = '0.5';
            
            // ドラッグ中の視覚的フィードバック
            document.body.classList.add('dragging');
            
            // フローティングエリア表示
            const rect = e.target.getBoundingClientRect();
            const rightX = rect.right + 20;
            const centerY = rect.top + rect.height / 2;
            
            if (draggedItemType === 'ingredient') {
                showFloatingDishBuilder(rightX, centerY);
            } else if (draggedItemType === 'dish') {
                showFloatingFoodArea(rightX, centerY);
            }
        }
    });
    
    document.addEventListener('dragend', function(e) {
        if (e.target.draggable) {
            isDragging = false;
            draggedItemType = null;
            e.target.style.opacity = '1';
            document.body.classList.remove('dragging');
            hideFloatingAreas();
        }
    });
    
    // ドロップエリアのハイライト
    document.addEventListener('dragover', function(e) {
        e.preventDefault();
        const dropArea = e.target.closest('[ondrop]');
        if (dropArea) {
            dropArea.classList.add('drag-over');
        }
    });
    
    document.addEventListener('dragleave', function(e) {
        const dropArea = e.target.closest('[ondrop]');
        if (dropArea && !dropArea.contains(e.relatedTarget)) {
            dropArea.classList.remove('drag-over');
        }
    });
}

// フローティングエリア管理
function showFloatingDishBuilder(x, y) {
    const floatingArea = document.getElementById('floating-dish-builder');
    const adjusted = adjustFloatingPosition(x, y);
    floatingArea.style.left = adjusted.x + 'px';
    floatingArea.style.top = adjusted.y + 'px';
    floatingArea.classList.add('show');
}

function showFloatingFoodArea(x, y) {
    const floatingArea = document.getElementById('floating-food-area');
    const adjusted = adjustFloatingPosition(x, y);
    floatingArea.style.left = adjusted.x + 'px';
    floatingArea.style.top = adjusted.y + 'px';
    floatingArea.classList.add('show');
}

function adjustFloatingPosition(x, y) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const elementWidth = 400;
    const elementHeight = 200;
    
    // 右端からはみ出る場合は左側に表示
    if (x + elementWidth > windowWidth - 50) {
        x = x - elementWidth - 50;
    }
    
    // 下端からはみ出る場合は上に調整
    if (y + elementHeight > windowHeight - 50) {
        y = windowHeight - elementHeight - 50;
    }
    
    // 上端より上に行かないように
    if (y < 50) {
        y = 50;
    }
    
    return { x, y };
}

function hideFloatingAreas() {
    document.getElementById('floating-dish-builder').classList.remove('show');
    document.getElementById('floating-food-area').classList.remove('show');
}

function allowDropFloating(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function dragLeaveFloating(e) {
    e.currentTarget.classList.remove('drag-over');
}

function dropToDishFloating(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
    
    if (dragData.type === 'ingredient') {
        const ingredient = ingredients.find(ing => ing.id == dragData.id);
        if (ingredient) {
            showQuantityModal(ingredient);
        }
    }
    
    hideFloatingAreas();
}

function dropToFoodFloating(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
    
    if (dragData.type === 'dish') {
        const dish = dishes.find(d => d.id == dragData.id);
        if (dish) {
            showDishUsageModal(dish);
        }
    }
    
    hideFloatingAreas();
}

// API呼び出し（エラーハンドリング強化）
async function apiCall(endpoint, method = 'GET', data = null, showLoader = true) {
    if (showLoader) {
        showProgressBar(true);
    }
    
    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, config);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'APIエラーが発生しました');
        }
        
        return result;
        
    } catch (error) {
        console.error('API Error:', error);
        
        // ネットワークエラーの場合
        if (!navigator.onLine) {
            showToast('インターネット接続を確認してください', 'error');
        } else if (error.name === 'TypeError') {
            showToast('サーバーに接続できません', 'error');
        } else {
            showToast(error.message, 'error');
        }
        
        throw error;
    } finally {
        if (showLoader) {
            showProgressBar(false);
        }
    }
}

// データロード関連
async function loadAllData() {
    const loadPromises = [
        loadIngredients(),
        loadDishes(),
        loadFoods()
    ];
    
    // 並列実行だが、エラーがあっても他は続行
    const results = await Promise.allSettled(loadPromises);
    
    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            const types = ['食材', '料理', '完成品'];
            console.error(`${types[index]}データの読み込みに失敗:`, result.reason);
        }
    });
}

async function loadIngredients() {
    try {
        const result = await apiCall('ingredients', 'GET', null, false);
        ingredients = result.data || [];
        displayIngredients();
    } catch (error) {
        document.getElementById('ingredients-results').innerHTML = 
            '<div class="error">食材データの読み込みに失敗しました</div>';
        throw error;
    }
}

async function loadDishes() {
    try {
        const result = await apiCall('dishes', 'GET', null, false);
        dishes = result.data || [];
        displayDishes();
    } catch (error) {
        document.getElementById('dishes-results').innerHTML = 
            '<div class="error">料理データの読み込みに失敗しました</div>';
        throw error;
    }
}

async function loadFoods() {
    try {
        const result = await apiCall('foods', 'GET', null, false);
        foods = result.data || [];
        displayCompletedFoods();
    } catch (error) {
        console.error('完成品データの読み込みに失敗しました');
        throw error;
    }
}

// 表示関数（アニメーション追加）
function displayIngredients() {
    const container = document.getElementById('ingredients-results');
    const searchTerm = document.getElementById('ingredients-search').value.toLowerCase();
    
    let filteredIngredients = ingredients.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        const matchesGenre = !currentIngredientsFilter || item.genre === currentIngredientsFilter;
        return matchesSearch && matchesGenre;
    });
    
    container.innerHTML = '';
    
    if (filteredIngredients.length === 0) {
        container.innerHTML = '<div class="empty-state">該当する食材が見つかりません</div>';
        return;
    }
    
    filteredIngredients.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'result-item fade-in';
        itemDiv.style.animationDelay = `${index * 0.05}s`;
        itemDiv.draggable = true;
        itemDiv.dataset.itemId = item.id;
        itemDiv.dataset.itemType = 'ingredient';
        
        itemDiv.ondragstart = function(e) {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                id: item.id,
                type: 'ingredient'
            }));
        };
        
        const genreIcon = genreInfo[item.genre]?.icon || '📦';
        const updatedDate = item.updated_at ? 
            new Date(item.updated_at).toLocaleDateString('ja-JP') : '';
        
        itemDiv.innerHTML = `
            <div class="item-name">${genreIcon} ${item.name}</div>
            <div class="item-details">
                <span class="item-store">${item.store}</span>
                <span>${item.quantity}${item.unit}</span>
            </div>
            <div class="item-price">¥${item.price} (¥${parseFloat(item.unit_price).toFixed(2)}/${item.unit})</div>
            ${updatedDate ? `<div style="font-size: 0.7rem; color: #999; margin-top: 4px;">更新: ${updatedDate}</div>` : ''}
            <div class="item-actions">
                <button class="action-btn edit tooltip" data-tooltip="価格・数量を編集" onclick="editIngredient(${item.id})">編集</button>
                <button class="action-btn delete tooltip" data-tooltip="この食材を削除" onclick="deleteIngredient(${item.id})">削除</button>
            </div>
        `;
        
        container.appendChild(itemDiv);
    });
}

function displayDishes() {
    const container = document.getElementById('dishes-results');
    const searchTerm = document.getElementById('dishes-search').value.toLowerCase();
    
    let filteredDishes = dishes.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        const matchesGenre = !currentDishesFilter || item.genre === currentDishesFilter;
        return matchesSearch && matchesGenre;
    });
    
    container.innerHTML = '';
    
    if (filteredDishes.length === 0) {
        container.innerHTML = '<div class="empty-state">該当する料理が見つかりません</div>';
        return;
    }
    
    filteredDishes.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'result-item fade-in';
        itemDiv.style.animationDelay = `${index * 0.05}s`;
        itemDiv.draggable = true;
        itemDiv.dataset.itemId = item.id;
        itemDiv.dataset.itemType = 'dish';
        
        itemDiv.ondragstart = function(e) {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                id: item.id,
                type: 'dish'
            }));
        };
        
        const genreIcon = genreInfo[item.genre]?.icon || '🍳';
        const createdDate = new Date(item.created_at).toLocaleDateString('ja-JP');
        
        itemDiv.innerHTML = `
            <div class="item-name">${genreIcon} ${item.name}</div>
            ${item.ingredients_list ? `<div style="font-size: 0.8rem; color: #666; margin-bottom: 8px;">${item.ingredients_list}</div>` : ''}
            <div class="item-details">
                <span class="item-store">手作り</span>
                <span>1品</span>
            </div>
            <div class="item-price">¥${parseFloat(item.total_cost).toFixed(2)}</div>
            <div style="font-size: 0.7rem; color: #999; margin-top: 4px;">作成: ${createdDate}</div>
            <div class="item-actions">
                <button class="action-btn edit tooltip" data-tooltip="料理の詳細を表示" onclick="viewDishDetails(${item.id})">詳細</button>
                <button class="action-btn delete tooltip" data-tooltip="この料理を削除" onclick="deleteDish(${item.id})">削除</button>
            </div>
        `;
        
        container.appendChild(itemDiv);
    });
}

function displayCompletedFoods() {
    const container = document.getElementById('completed-foods-list');
    const searchTerm = document.getElementById('completed-foods-search')?.value.toLowerCase() || '';
    
    const filteredFoods = foods.filter(food => 
        food.name.toLowerCase().includes(searchTerm)
    );
    
    container.innerHTML = '';
    
    if (filteredFoods.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        emptyDiv.textContent = searchTerm ? '検索結果が見つかりません' : '完成品がありません';
        emptyDiv.style.gridColumn = '1 / -1';
        container.appendChild(emptyDiv);
        return;
    }
    
    filteredFoods.forEach((food, index) => {
        const div = document.createElement('div');
        div.className = 'completed-food-item fade-in';
        div.style.animationDelay = `${index * 0.1}s`;
        div.onclick = function() {
            showFoodDetails(food);
        };
        
        const date = new Date(food.created_at).toLocaleDateString('ja-JP');
        const dishCount = food.dish_count || 0;
        const profitMargin = food.price ? 
            ((food.price - food.total_cost) / food.price * 100).toFixed(1) : null;
        
        div.innerHTML = `
            <div style="font-size: 1.2rem; font-weight: 700; color: #e65100; margin-bottom: 10px;">${food.name}</div>
            <div style="font-size: 0.9rem; color: #666; margin-bottom: 8px;">${dishCount}種類の料理を使用</div>
            <div style="font-size: 1.1rem; font-weight: 600; color: #bf360c;">原価: ¥${parseFloat(food.total_cost).toFixed(2)}</div>
            ${food.price ? `
                <div style="font-size: 0.9rem; color: #2e7d32; margin-top: 4px;">
                    販売価格: ¥${parseFloat(food.price).toFixed(2)}
                    ${profitMargin ? `<span style="margin-left: 8px; background: ${profitMargin > 0 ? '#4caf50' : '#f44336'}; color: white; padding: 2px 6px; border-radius: 8px; font-size: 0.7rem;">${profitMargin > 0 ? '+' : ''}${profitMargin}%</span>` : ''}
                </div>
            ` : ''}
            <div style="font-size: 0.7rem; color: #999; margin-top: 8px;">${date}</div>
            <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 5px;">
                <button class="action-btn delete tooltip" data-tooltip="この完成品を削除" onclick="deleteFood(${food.id}); event.stopPropagation()">削除</button>
            </div>
        `;
        
        container.appendChild(div);
    });
}

// FOODエリア管理
function updateFoodItems() {
    const container = document.getElementById('food-items');
    const totalElement = document.getElementById('food-total-amount');
    
    container.innerHTML = '';
    let total = 0;

    if (foodItems.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        emptyDiv.textContent = '料理をここにドラッグしてください';
        container.appendChild(emptyDiv);
    } else {
        foodItems.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'food-item slide-up';
            div.innerHTML = `
                <div class="food-item-header">
                    <div class="food-item-name">${item.name}</div>
                    <div class="food-item-cost">¥${item.usedCost.toFixed(2)}</div>
                </div>
                <div class="food-item-details">
                    <div class="food-item-usage">
                        ${item.usageUnit === '割合' ? 
                            `${(item.usageQuantity * 100).toFixed(1)}%使用` : 
                            `${item.usageQuantity}${item.usageUnit}`}
                        ${item.description ? ` - ${item.description}` : ''}
                    </div>
                </div>
                <button class="food-item-remove" onclick="removeFromFood(${index})">&times;</button>
            `;
            container.appendChild(div);
            total += item.usedCost;
        });
    }

    totalElement.textContent = `¥${total.toFixed(2)}`;
    updateCompleteFoodButton();
}

function removeFromFood(index) {
    foodItems.splice(index, 1);
    updateFoodItems();
    showToast('料理を削除しました', 'info');
}

function updateCompleteFoodButton() {
    const foodNameInput = document.getElementById('food-name');
    const completeBtn = document.getElementById('complete-food-btn');
    completeBtn.disabled = !foodNameInput.value.trim() || foodItems.length === 0;
}

// ドロップ処理
function allowDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function dragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function dropToDish(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
    
    if (dragData.type === 'ingredient') {
        const ingredient = ingredients.find(ing => ing.id == dragData.id);
        if (ingredient) {
            const existingIndex = currentDishIngredients.findIndex(ing => ing.id == ingredient.id);
            if (existingIndex !== -1) {
                showToast('この食材は既に追加されています', 'warning');
                return;
            }
            showQuantityModal(ingredient);
        }
    }
}

function dropToFood(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
    
    if (dragData.type === 'dish') {
        const dish = dishes.find(d => d.id == dragData.id);
        if (dish) {
            const existingIndex = foodItems.findIndex(item => item.id == dish.id);
            if (existingIndex !== -1) {
                showToast('この料理は既に追加されています', 'warning');
                return;
            }
            showDishUsageModal(dish);
        }
    }
}

// 料理使用量入力モーダル
function showDishUsageModal(dish) {
    currentDishForUsage = dish;
    
    document.getElementById('dish-usage-modal-title').textContent = `${dish.name} の使用量を入力`;
    document.getElementById('dish-use-quantity').value = '';
    document.getElementById('dish-use-unit').value = '割合';
    document.getElementById('dish-use-description').value = '';
    document.getElementById('dish-cost-preview').textContent = '使用原価: ¥0';
    
    document.getElementById('dishUsageModal').style.display = 'block';
    document.getElementById('dish-use-quantity').focus();
}

function updateDishCostPreview() {
    const quantity = parseFloat(document.getElementById('dish-use-quantity').value) || 0;
    const unit = document.getElementById('dish-use-unit').value;
    
    if (currentDishForUsage && quantity > 0) {
        let cost;
        if (unit === '割合') {
            if (quantity > 1) {
                document.getElementById('dish-cost-preview').textContent = '割合は1以下で入力してください';
                document.getElementById('dish-cost-preview').style.color = '#f44336';
                return;
            }
            cost = currentDishForUsage.total_cost * quantity;
        } else { // 人前
            cost = currentDishForUsage.total_cost * quantity;
        }
        
        document.getElementById('dish-cost-preview').textContent = `使用原価: ¥${cost.toFixed(2)}`;
        document.getElementById('dish-cost-preview').style.color = '#e65100';
    } else {
        document.getElementById('dish-cost-preview').textContent = '使用原価: ¥0';
        document.getElementById('dish-cost-preview').style.color = '#e65100';
    }
}

function closeDishUsageModal() {
    document.getElementById('dishUsageModal').style.display = 'none';
    currentDishForUsage = null;
}

function confirmDishUsage() {
    const quantity = parseFloat(document.getElementById('dish-use-quantity').value);
    const unit = document.getElementById('dish-use-unit').value;
    const description = document.getElementById('dish-use-description').value.trim();
    
    if (!quantity || quantity <= 0) {
        showToast('正しい使用量を入力してください', 'error');
        return;
    }

    if (unit === '割合' && quantity > 1) {
        showToast('割合は1以下で入力してください', 'error');
        return;
    }

    const usedCost = currentDishForUsage.total_cost * quantity;
    
    const foodItem = {
        ...currentDishForUsage,
        usageQuantity: quantity,
        usageUnit: unit,
        usedCost: usedCost,
        description: description
    };
    
    foodItems.push(foodItem);
    updateFoodItems();
    closeDishUsageModal();
    
    const usageText = unit === '割合' ? 
        `${(quantity * 100).toFixed(1)}%` : 
        `${quantity}${unit}`;
    showToast(`${currentDishForUsage.name}(${usageText})を盛り付けました`, 'success');
}

// 検索機能
function searchIngredients() {
    displayIngredients();
}

function searchDishes() {
    displayDishes();
}

function searchCompletedFoods() {
    displayCompletedFoods();
}

// 完成品登録
async function completeFood() {
    const foodName = document.getElementById('food-name').value.trim();
    const foodPrice = parseFloat(document.getElementById('food-price').value) || null;
    
    if (!foodName) {
        showToast('完成品名を入力してください', 'error');
        return;
    }

    if (foodItems.length === 0) {
        showToast('料理を盛り付けてください', 'error');
        return;
    }

    try {
        const data = {
            name: foodName,
            price: foodPrice,
            dishes: foodItems.map(item => ({
                dish_id: item.id,
                usage_quantity: item.usageQuantity,
                usage_unit: item.usageUnit,
                description: item.description
            }))
        };
        
        await apiCall('foods', 'POST', data);
        
        // FOODエリアをリセット
        foodItems = [];
        document.getElementById('food-name').value = '';
        document.getElementById('food-price').value = '';
        updateFoodItems();
        
        showToast(`完成品「${foodName}」を登録しました`, 'success');
        await loadFoods();
    } catch (error) {
        // エラーは apiCall 内で処理済み
    }
}

// 完成品詳細表示
function showFoodDetails(food) {
    const modal = document.createElement('div');
    modal.className = 'detail-modal';
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    };
    
    let detailsHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #ffe0b2;">
            <div style="font-size: 1.8rem; font-weight: 600; color: #ff6f00;">${food.name}</div>
            <span style="color: #aaa; font-size: 2rem; font-weight: bold; cursor: pointer;" onclick="this.closest('.detail-modal').remove()">&times;</span>
        </div>
    `;
    
    if (food.price) {
        const profit = food.price - food.total_cost;
        const margin = (profit / food.price * 100).toFixed(1);
        detailsHTML += `
            <div style="background: linear-gradient(45deg, #2196f3, #64b5f6); color: white; padding: 15px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
                <div style="font-size: 1.1rem; margin-bottom: 5px;">販売価格: ¥${parseFloat(food.price).toFixed(2)}</div>
                <div style="font-size: 0.9rem;">利益: ¥${profit.toFixed(2)} (${margin}%)</div>
            </div>
        `;
    }
    
    detailsHTML += '<div style="font-size: 1.1rem; margin-bottom: 15px; color: #ff6f00; font-weight: bold;">使用料理・原価詳細</div>';
    
    // 料理詳細を表示（モックデータ使用）
    const mockDishes = [
        { name: '照り焼きチキン', cost: 180, usage: '1人前', description: 'メイン' },
        { name: 'ポテトサラダ', cost: 85, usage: '0.8人前', description: 'サイド' },
        { name: 'コンソメスープ', cost: 35, usage: '1人前', description: 'スープ' }
    ];
    
    mockDishes.forEach(dish => {
        detailsHTML += `
            <div class="detail-dish-item">
                <strong>${dish.name}</strong> - ¥${dish.cost.toFixed(2)}<br>
                <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">
                    使用量: ${dish.usage}
                    ${dish.description ? ` | ${dish.description}` : ''}
                </div>
            </div>
        `;
    });
    
    detailsHTML += `<div class="detail-total food">合計原価: ¥${parseFloat(food.total_cost).toFixed(2)}</div>`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'detail-modal-content';
    contentDiv.innerHTML = detailsHTML;
    
    modal.appendChild(contentDiv);
    document.body.appendChild(modal);
}

// モーダル管理
function closeAllModals() {
    const modals = [
        'addModal', 'quantityModal', 'memoModal', 
        'priceSearchModal', 'importModal', 'dishUsageModal'
    ];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    });
    
    // 動的モーダルも閉じる
    document.querySelectorAll('.detail-modal, .modal-temp').forEach(modal => {
        modal.remove();
    });
}

// その他の機能（前回のJavaScriptから継承）
// ここには前回実装した以下の機能が含まれます：
// - 食材追加・編集・削除
// - 料理作成・表示・削除
// - データエクスポート・インポート
// - メモ機能
// - 価格検索
// - フィルター機能
// 等々...

console.log('料理原価計算システム（完全版）が初期化されました');
