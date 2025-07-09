<?php
// Database.php - データベース接続クラス
class Database {
    private $host = DB_HOST;
    private $db_name = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    private $charset = DB_CHARSET;
    private $pdo = null;
    
    public function connect() {
        if ($this->pdo === null) {
            try {
                $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset={$this->charset}";
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ];
                
                $this->pdo = new PDO($dsn, $this->username, $this->password, $options);
            } catch(PDOException $e) {
                throw new Exception("データベース接続エラー: " . $e->getMessage());
            }
        }
        
        return $this->pdo;
    }
    
    public function disconnect() {
        $this->pdo = null;
    }
    
    // トランザクション開始
    public function beginTransaction() {
        return $this->connect()->beginTransaction();
    }
    
    // コミット
    public function commit() {
        return $this->connect()->commit();
    }
    
    // ロールバック
    public function rollback() {
        return $this->connect()->rollBack();
    }
}
?>