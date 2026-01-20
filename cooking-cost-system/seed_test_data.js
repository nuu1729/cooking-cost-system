const API_URL = 'http://localhost:3001/api/ingredients';

const testIngredients = [
    { name: 'トマト', store: 'スーパーA', quantity: 200, unit: 'g', price: 100, genre: 'vegetable' },
    { name: 'トマト', store: 'スーパーB', quantity: 500, unit: 'g', price: 300, genre: 'vegetable' },
    { name: 'トマト', store: '業務スーパー', quantity: 1000, unit: 'g', price: 550, genre: 'vegetable' },
    { name: 'たまねぎ', store: 'スーパーA', quantity: 3, unit: '個', price: 150, genre: 'vegetable' },
    { name: 'たまねぎ', store: '八百屋C', quantity: 3, unit: '個', price: 120, genre: 'vegetable' },
    { name: 'マヨネーズ', store: 'スーパーA', quantity: 500, unit: 'ml', price: 350, genre: 'seasoning' },
    { name: '鶏もも肉', store: '肉のハナマサ', quantity: 1000, unit: 'g', price: 880, genre: 'meat' },
    { name: '鶏もも肉', store: 'スーパーB', quantity: 300, unit: 'g', price: 450, genre: 'meat' }
];

async function seed() {
    console.log('--- 食材データのシードを開始します ---');
    for (const item of testIngredients) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            if (response.ok) {
                console.log(`✅ 登録完了: ${item.name} (${item.store})`);
            } else {
                const errData = await response.json();
                console.error(`❌ 登録失敗: ${item.name} (${item.store}) - ${JSON.stringify(errData)}`);
            }
        } catch (error) {
            console.error(`❌ エラー: ${item.name} (${item.store}) - ${error.message}`);
        }
    }
    console.log('--- シード完了 ---');
}

seed();
