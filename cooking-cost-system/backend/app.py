from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
# CORSを有効化（フロントエンドからのアクセスを許可）
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    """ヘルスチェック用エンドポイント"""
    return jsonify({"status": "healthy", "message": "Backend is running!"})

@app.route('/', methods=['GET'])
def index():
    return "Cooking Cost System Backend API"

if __name__ == '__main__':
    # デバッグモードで起動 (ポートはデフォルトの5000)
    app.run(host='0.0.0.0', port=5000, debug=True)
