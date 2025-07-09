<?php
// models/CompletedFood.php - 完成品モデル
class CompletedFood {
    private $db;
    
    public function __construct($database) {
        $this->db = $database->connect();
    }
    
    // 全完成品取得
    public function getAll($search = '') {
        $query = "SELECT cf.*, 
                         COUNT(fd.dish_id) as dish_count
                  FROM completed_foods cf
                  LEFT JOIN food_dishes fd ON cf.id = fd.food_id
                  WHERE 1=1";
        $params = [];
        
        if (!empty($search)) {
            $query .= " AND cf.name LIKE :search";
            $params[':search'] = "%{$search}%";
        }
        
        $query .= " GROUP BY cf.id ORDER BY cf.created_at DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        
        return $stmt->fetchAll();
    }
    
    // ID指定で完成品取得
    public function getById($id) {
        $query = "SELECT * FROM completed_foods WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $food = $stmt->fetch();
        if ($food) {
            $food['dishes'] = $this->getFoodDishes($id);
        }
        
        return $food;
    }
    
    // 完成品の料理リスト取得
    public function getFoodDishes($food_id) {
        $query = "SELECT fd.*, d.name as dish_name, d.total_cost as dish_total_cost
                  FROM food_dishes fd
                  JOIN dishes d ON fd.dish_id = d.id
                  WHERE fd.food_id = :food_id
                  ORDER BY d.name";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':food_id', $food_id, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
    
    // 完成品作成
    public function create($data) {
        try {
            $this->db->beginTransaction();
            
            // 総コスト計算
            $total_cost = 0;
            $dish_model = new Dish(new Database());
            
            if (isset($data['dishes']) && is_array($data['dishes'])) {
                foreach ($data['dishes'] as $dish_data) {
                    $dish = $dish_model->getById($dish_data['dish_id']);
                    if (!$dish) {
                        throw new Exception("料理ID {$dish_data['dish_id']} が見つかりません");
                    }
                    $usage_cost = $dish['total_cost'] * $dish_data['usage_quantity'];
                    $total_cost += $usage_cost;
                }
            }
            
            // 完成品レコード作成
            $query = "INSERT INTO completed_foods (name, price, total_cost) VALUES (:name, :price, :total_cost)";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':price', $data['price'] ?? null);
            $stmt->bindParam(':total_cost', $total_cost);
            $stmt->execute();
            
            $food_id = $this->db->lastInsertId();
            
            // 完成品-料理関連レコード作成
            if (isset($data['dishes']) && is_array($data['dishes'])) {
                foreach ($data['dishes'] as $dish_data) {
                    $dish = $dish_model->getById($dish_data['dish_id']);
                    $usage_cost = $dish['total_cost'] * $dish_data['usage_quantity'];
                    
                    $query = "INSERT INTO food_dishes (food_id, dish_id, usage_quantity, usage_unit, usage_cost, description) 
                              VALUES (:food_id, :dish_id, :usage_quantity, :usage_unit, :usage_cost, :description)";
                    $stmt = $this->db->prepare($query);
                    $stmt->bindParam(':food_id', $food_id, PDO::PARAM_INT);
                    $stmt->bindParam(':dish_id', $dish_data['dish_id'], PDO::PARAM_INT);
                    $stmt->bindParam(':usage_quantity', $dish_data['usage_quantity']);
                    $stmt->bindParam(':usage_unit', $dish_data['usage_unit'] ?? '割合');
                    $stmt->bindParam(':usage_cost', $usage_cost);
                    $stmt->bindParam(':description', $dish_data['description'] ?? null);
                    $stmt->execute();
                }
            }
            
            $this->db->commit();
            return $this->getById($food_id);
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    // 完成品更新
    public function update($id, $data) {
        try {
            $this->db->beginTransaction();
            
            // 料理データが提供された場合は関連データも更新
            if (isset($data['dishes'])) {
                // 既存の料理関連削除
                $query = "DELETE FROM food_dishes WHERE food_id = :food_id";
                $stmt = $this->db->prepare($query);
                $stmt->bindParam(':food_id', $id, PDO::PARAM_INT);
                $stmt->execute();
                
                // 総コスト再計算
                $total_cost = 0;
                $dish_model = new Dish(new Database());
                
                foreach ($data['dishes'] as $dish_data) {
                    $dish = $dish_model->getById($dish_data['dish_id']);
                    $usage_cost = $dish['total_cost'] * $dish_data['usage_quantity'];
                    $total_cost += $usage_cost;
                }
                
                $data['total_cost'] = $total_cost;
            }
            
            // 完成品情報更新
            $update_fields = [];
            $params = [':id' => $id];
            
            if (isset($data['name'])) {
                $update_fields[] = "name = :name";
                $params[':name'] = $data['name'];
            }
            
            if (isset($data['price'])) {
                $update_fields[] = "price = :price";
                $params[':price'] = $data['price'];
            }
            
            if (isset($data['total_cost'])) {
                $update_fields[] = "total_cost = :total_cost";
                $params[':total_cost'] = $data['total_cost'];
            }
            
            $update_fields[] = "updated_at = NOW()";
            
            $query = "UPDATE completed_foods SET " . implode(', ', $update_fields) . " WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->execute($params);
            
            // 料理関連レコード再作成
            if (isset($data['dishes'])) {
                $dish_model = new Dish(new Database());
                foreach ($data['dishes'] as $dish_data) {
                    $dish = $dish_model->getById($dish_data['dish_id']);
                    $usage_cost = $dish['total_cost'] * $dish_data['usage_quantity'];
                    
                    $query = "INSERT INTO food_dishes (food_id, dish_id, usage_quantity, usage_unit, usage_cost, description) 
                              VALUES (:food_id, :dish_id, :usage_quantity, :usage_unit, :usage_cost, :description)";
                    $stmt = $this->db->prepare($query);
                    $stmt->bindParam(':food_id', $id, PDO::PARAM_INT);
                    $stmt->bindParam(':dish_id', $dish_data['dish_id'], PDO::PARAM_INT);
                    $stmt->bindParam(':usage_quantity', $dish_data['usage_quantity']);
                    $stmt->bindParam(':usage_unit', $dish_data['usage_unit'] ?? '割合');
                    $stmt->bindParam(':usage_cost', $usage_cost);
                    $stmt->bindParam(':description', $dish_data['description'] ?? null);
                    $stmt->execute();
                }
            }
            
            $this->db->commit();
            return $this->getById($id);
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    // 完成品削除
    public function delete($id) {
        $query = "DELETE FROM completed_foods WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }
}
?>