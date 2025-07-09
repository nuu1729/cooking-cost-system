<?php
// api.php - APIエンドポイント
require_once 'config.php';
require_once 'Database.php';
require_once 'Response.php';
require_once 'Validator.php';
require_once 'models/Ingredient.php';
require_once 'models/Dish.php';
require_once 'models/CompletedFood.php';
require_once 'models/Memo.php';

// リクエスト解析
$request_method = $_SERVER['REQUEST_METHOD'];
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path_segments = explode('/', trim($request_uri, '/'));

// api.php以降のパスを取得
$api_index = array_search('api.php', $path_segments);
if ($api_index !== false) {
    $path_segments = array_slice($path_segments, $api_index + 1);
}

$endpoint = $path_segments[0] ?? '';
$id = $path_segments[1] ?? null;

// リクエストボディ取得
$input = json_decode(file_get_contents('php://input'), true);
$query_params = $_GET;

try {
    $database = new Database();
    
    switch ($endpoint) {
        case 'ingredients':
            handleIngredientsAPI($request_method, $id, $input, $query_params, $database);
            break;
            
        case 'dishes':
            handleDishesAPI($request_method, $id, $input, $query_params, $database);
            break;
            
        case 'foods':
            handleFoodsAPI($request_method, $id, $input, $query_params, $database);
            break;
            
        case 'memo':
            handleMemoAPI($request_method, $input, $database);
            break;
            
        case 'price-search':
            handlePriceSearchAPI($query_params, $database);
            break;
            
        case 'data':
            handleDataAPI($request_method, $input, $database);
            break;
            
        default:
            Response::notFound('APIエンドポイントが見つかりません');
    }
    
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    Response::serverError($e->getMessage());
}

// 食材API処理
function handleIngredientsAPI($method, $id, $input, $query_params, $database) {
    $ingredient_model = new Ingredient($database);
    
    switch ($method) {
        case 'GET':
            if ($id) {
                // 特定の食材取得
                $ingredient = $ingredient_model->getById($id);
                if ($ingredient) {
                    Response::success($ingredient);
                } else {
                    Response::notFound('食材が見つかりません');
                }
            } else {
                // 食材一覧取得
                $search = $query_params['search'] ?? '';
                $genre = $query_params['genre'] ?? '';
                $ingredients = $ingredient_model->getAll($search, $genre);
                Response::success($ingredients);
            }
            break;
            
        case 'POST':
            // 食材追加
            try {
                Validator::validateIngredient($input);
                $ingredient = $ingredient_model->create($input);
                if ($ingredient) {
                    Response::success($ingredient, '食材を追加しました');
                } else {
                    Response::error('食材の追加に失敗しました');
                }
            } catch (Exception $e) {
                Response::error($e->getMessage());
            }
            break;
            
        case 'PUT':
            // 食材更新
            if (!$id) {
                Response::error('IDが指定されていません');
            }
            
            try {
                $partial_data = [
                    'quantity' => $input['quantity'],
                    'price' => $input['price']
                ];
                
                Validator::numeric($partial_data['quantity'], '購入量');
                Validator::positive($partial_data['quantity'], '購入量');
                Validator::numeric($partial_data['price'], '価格');
                Validator::positive($partial_data['price'], '価格');
                
                $ingredient = $ingredient_model->update($id, $partial_data);
                if ($ingredient) {
                    Response::success($ingredient, '食材を更新しました');
                } else {
                    Response::error('食材の更新に失敗しました');
                }
            } catch (Exception $e) {
                Response::error($e->getMessage());
            }
            break;
            
        case 'DELETE':
            // 食材削除
            if (!$id) {
                Response::error('IDが指定されていません');
            }
            
            if ($ingredient_model->delete($id)) {
                Response::success(null, '食材を削除しました');
            } else {
                Response::error('食材の削除に失敗しました');
            }
            break;
            
        default:
            Response::error('サポートされていないメソッドです', 405);
    }
}

// 料理API処理
function handleDishesAPI($method, $id, $input, $query_params, $database) {
    $dish_model = new Dish($database);
    
    switch ($method) {
        case 'GET':
            if ($id) {
                // 特定の料理取得
                $dish = $dish_model->getById($id);
                if ($dish) {
                    Response::success($dish);
                } else {
                    Response::notFound('料理が見つかりません');
                }
            } else {
                // 料理一覧取得
                $search = $query_params['search'] ?? '';
                $genre = $query_params['genre'] ?? '';
                $dishes = $dish_model->getAll($search, $genre);
                Response::success($dishes);
            }
            break;
            
        case 'POST':
            // 料理作成
            try {
                Validator::validateDish($input);
                $dish = $dish_model->create($input);
                if ($dish) {
                    Response::success($dish, '料理を作成しました');
                } else {
                    Response::error('料理の作成に失敗しました');
                }
            } catch (Exception $e) {
                Response::error($e->getMessage());
            }
            break;
            
        case 'PUT':
            // 料理更新
            if (!$id) {
                Response::error('IDが指定されていません');
            }
            
            try {
                Validator::validateDish($input);
                $dish = $dish_model->update($id, $input);
                if ($dish) {
                    Response::success($dish, '料理を更新しました');
                } else {
                    Response::error('料理の更新に失敗しました');
                }
            } catch (Exception $e) {
                Response::error($e->getMessage());
            }
            break;
            
        case 'DELETE':
            // 料理削除
            if (!$id) {
                Response::error('IDが指定されていません');
            }
            
            if ($dish_model->delete($id)) {
                Response::success(null, '料理を削除しました');
            } else {
                Response::error('料理の削除に失敗しました');
            }
            break;
            
        default:
            Response::error('サポートされていないメソッドです', 405);
    }
}

// 完成品API処理
function handleFoodsAPI($method, $id, $input, $query_params, $database) {
    $food_model = new CompletedFood($database);
    
    switch ($method) {
        case 'GET':
            if ($id) {
                // 特定の完成品取得
                $food = $food_model->getById($id);
                if ($food) {
                    Response::success($food);
                } else {
                    Response::notFound('完成品が見つかりません');
                }
            } else {
                // 完成品一覧取得
                $search = $query_params['search'] ?? '';
                $foods = $food_model->getAll($search);
                Response::success($foods);
            }
            break;
            
        case 'POST':
            // 完成品作成
            try {
                Validator::validateCompletedFood($input);
                $food = $food_model->create($input);
                if ($food) {
                    Response::success($food, '完成品を登録しました');
                } else {
                    Response::error('完成品の登録に失敗しました');
                }
            } catch (Exception $e) {
                Response::error($e->getMessage());
            }
            break;
            
        case 'PUT':
            // 完成品更新
            if (!$id) {
                Response::error('IDが指定されていません');
            }
            
            try {
                Validator::validateCompletedFood($input);
                $food = $food_model->update($id, $input);
                if ($food) {
                    Response::success($food, '完成品を更新しました');
                } else {
                    Response::error('完成品の更新に失敗しました');
                }
            } catch (Exception $e) {
                Response::error($e->getMessage());
            }
            break;
            
        case 'DELETE':
            // 完成品削除
            if (!$id) {
                Response::error('IDが指定されていません');
            }
            
            if ($food_model->delete($id)) {
                Response::success(null, '完成品を削除しました');
            } else {
                Response::error('完成品の削除に失敗しました');
            }
            break;
            
        default:
            Response::error('サポートされていないメソッドです', 405);
    }
}

// メモAPI処理
function handleMemoAPI($method, $input, $database) {
    $memo_model = new Memo($database);
    
    switch ($method) {
        case 'GET':
            // メモ取得
            $memo = $memo_model->get();
            Response::success(['content' => $memo]);
            break;
            
        case 'POST':
        case 'PUT':
            // メモ保存
            $content = $input['content'] ?? '';
            if ($memo_model->save($content)) {
                Response::success(['content' => $content], 'メモを保存しました');
            } else {
                Response::error('メモの保存に失敗しました');
            }
            break;
            
        default:
            Response::error('サポートされていないメソッドです', 405);
    }
}

// 価格検索API処理
function handlePriceSearchAPI($query_params, $database) {
    $ingredient_model = new Ingredient($database);
    
    $ingredient_name = $query_params['ingredient_name'] ?? '';
    $store = $query_params['store'] ?? '';
    
    $results = $ingredient_model->priceSearch($ingredient_name, $store);
    
    // 検索フィルター用データも取得
    $filter_data = [
        'ingredient_names' => $ingredient_model->getUniqueNames(),
        'stores' => $ingredient_model->getUniqueStores()
    ];
    
    Response::success([
        'results' => $results,
        'filters' => $filter_data
    ]);
}

// データ管理API処理
function handleDataAPI($method, $input, $database) {
    switch ($method) {
        case 'GET':
            // 全データエクスポート
            $ingredient_model = new Ingredient($database);
            $dish_model = new Dish($database);
            $food_model = new CompletedFood($database);
            $memo_model = new Memo($database);
            
            $data = [
                'ingredients' => $ingredient_model->getAll(),
                'dishes' => $dish_model->getAll(),
                'foods' => $food_model->getAll(),
                'memo' => $memo_model->get(),
                'export_date' => date('c'),
                'version' => '5.0'
            ];
            
            Response::success($data);
            break;
            
        case 'POST':
            // 全データインポート
            try {
                if (!isset($input['ingredients']) || !isset($input['dishes']) || !isset($input['foods'])) {
                    throw new Exception('無効なデータ形式です');
                }
                
                $database->beginTransaction();
                
                // 既存データクリア（開発環境でのみ）
                if (isset($input['clear_existing']) && $input['clear_existing'] === true) {
                    $database->connect()->exec('DELETE FROM food_dishes');
                    $database->connect()->exec('DELETE FROM dish_ingredients');
                    $database->connect()->exec('DELETE FROM completed_foods');
                    $database->connect()->exec('DELETE FROM dishes');
                    $database->connect()->exec('DELETE FROM ingredients');
                    $database->connect()->exec('ALTER TABLE ingredients AUTO_INCREMENT = 1');
                    $database->connect()->exec('ALTER TABLE dishes AUTO_INCREMENT = 1');
                    $database->connect()->exec('ALTER TABLE completed_foods AUTO_INCREMENT = 1');
                }
                
                $ingredient_model = new Ingredient($database);
                $dish_model = new Dish($database);
                $food_model = new CompletedFood($database);
                $memo_model = new Memo($database);
                
                // データインポート
                $imported_count = 0;
                
                // 食材インポート
                foreach ($input['ingredients'] as $ingredient_data) {
                    $ingredient_model->create($ingredient_data);
                    $imported_count++;
                }
                
                // 料理インポート
                foreach ($input['dishes'] as $dish_data) {
                    $dish_model->create($dish_data);
                    $imported_count++;
                }
                
                // 完成品インポート
                foreach ($input['foods'] as $food_data) {
                    $food_model->create($food_data);
                    $imported_count++;
                }
                
                // メモインポート
                if (isset($input['memo'])) {
                    $memo_model->save($input['memo']);
                }
                
                $database->commit();
                Response::success(
                    ['imported_count' => $imported_count], 
                    "データを正常にインポートしました（{$imported_count}件）"
                );
                
            } catch (Exception $e) {
                $database->rollback();
                Response::error('データインポートに失敗しました: ' . $e->getMessage());
            }
            break;
            
        default:
            Response::error('サポートされていないメソッドです', 405);
    }
}
?>
