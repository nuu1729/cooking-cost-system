<?php
// models/Memo.php - メモモデル
class Memo {
    private $db;
    
    public function __construct($database) {
        $this->db = $database->connect();
    }
    
    // メモ取得
    public function get() {
        $query = "SELECT content FROM memos ORDER BY id DESC LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        
        $result = $stmt->fetch();
        return $result ? $result['content'] : '';
    }
    
    // メモ保存
    public function save($content) {
        // 既存レコードがあるかチェック
        $query = "SELECT COUNT(*) as count FROM memos";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        $count = $stmt->fetch()['count'];
        
        if ($count > 0) {
            // 更新
            $query = "UPDATE memos SET content = :content, updated_at = NOW() WHERE id = (SELECT id FROM (SELECT id FROM memos ORDER BY id DESC LIMIT 1) as subquery)";
        } else {
            // 新規挿入
            $query = "INSERT INTO memos (content) VALUES (:content)";
        }
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':content', $content);
        
        return $stmt->execute();
    }
}
?>

?>