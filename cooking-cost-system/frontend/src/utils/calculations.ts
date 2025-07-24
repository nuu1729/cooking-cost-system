import { Ingredient, Dish, CompletedFood, DishIngredient, FoodDish } from '../types';

// 基本的な計算関数
export const calculations = {
  /**
   * 単価を計算
   */
  calculateUnitPrice: (price: number, quantity: number): number => {
    if (quantity <= 0) return 0;
    return price / quantity;
  },

  /**
   * 使用コストを計算
   */
  calculateUsedCost: (unitPrice: number, usedQuantity: number): number => {
    return unitPrice * usedQuantity;
  },

  /**
   * 利益を計算
   */
  calculateProfit: (price: number, cost: number): number => {
    return Math.max(0, price - cost);
  },

  /**
   * 利益率を計算（パーセンテージ）
   */
  calculateProfitRate: (price: number, cost: number): number => {
    if (price <= 0) return 0;
    return ((price - cost) / price) * 100;
  },

  /**
   * 割引価格を計算
   */
  calculateDiscountPrice: (originalPrice: number, discountRate: number): number => {
    if (discountRate < 0 || discountRate > 100) return originalPrice;
    return originalPrice * (1 - discountRate / 100);
  },

  /**
   * 税込み価格を計算
   */
  calculateTaxIncluded: (price: number, taxRate: number = 10): number => {
    return price * (1 + taxRate / 100);
  },

  /**
   * 税抜き価格を計算
   */
  calculateTaxExcluded: (priceWithTax: number, taxRate: number = 10): number => {
    return priceWithTax / (1 + taxRate / 100);
  },

  /**
   * 平均値を計算
   */
  calculateAverage: (values: number[]): number => {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  },

  /**
   * 中央値を計算
   */
  calculateMedian: (values: number[]): number => {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    
    return sorted[middle];
  },

  /**
   * 標準偏差を計算
   */
  calculateStandardDeviation: (values: number[]): number => {
    if (values.length === 0) return 0;
    
    const avg = calculations.calculateAverage(values);
    const squaredDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquaredDiff = calculations.calculateAverage(squaredDiffs);
    
    return Math.sqrt(avgSquaredDiff);
  },

  /**
   * パーセンタイルを計算
   */
  calculatePercentile: (values: number[], percentile: number): number => {
    if (values.length === 0) return 0;
    if (percentile < 0 || percentile > 100) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    
    if (Number.isInteger(index)) {
      return sorted[index];
    }
    
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  },

  /**
   * 成長率を計算
   */
  calculateGrowthRate: (currentValue: number, previousValue: number): number => {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  },

  /**
   * 複利計算
   */
  calculateCompoundInterest: (
    principal: number,
    rate: number,
    time: number,
    compoundFrequency: number = 1
  ): number => {
    return principal * Math.pow(1 + rate / 100 / compoundFrequency, compoundFrequency * time);
  },
};

// 食材関連の計算
export const ingredientCalculations = {
  /**
   * 食材の単価を計算
   */
  calculateIngredientUnitPrice: (ingredient: Ingredient): number => {
    return calculations.calculateUnitPrice(ingredient.price, ingredient.quantity);
  },

  /**
   * 食材の使用コストを計算
   */
  calculateIngredientUsedCost: (ingredient: Ingredient, usedQuantity: number): number => {
    const unitPrice = ingredientCalculations.calculateIngredientUnitPrice(ingredient);
    return calculations.calculateUsedCost(unitPrice, usedQuantity);
  },

  /**
   * 食材在庫の総価値を計算
   */
  calculateIngredientTotalValue: (ingredients: Ingredient[]): number => {
    return ingredients.reduce((total, ingredient) => total + ingredient.price, 0);
  },

  /**
   * ジャンル別の平均単価を計算
   */
  calculateAverageUnitPriceByGenre: (ingredients: Ingredient[]): Record<string, number> => {
    const genreGroups = ingredients.reduce((groups, ingredient) => {
      if (!groups[ingredient.genre]) {
        groups[ingredient.genre] = [];
      }
      groups[ingredient.genre].push(ingredientCalculations.calculateIngredientUnitPrice(ingredient));
      return groups;
    }, {} as Record<string, number[]>);

    return Object.entries(genreGroups).reduce((result, [genre, prices]) => {
      result[genre] = calculations.calculateAverage(prices);
      return result;
    }, {} as Record<string, number>);
  },

  /**
   * 最もコストパフォーマンスの良い食材を取得
   */
  findMostEfficientIngredients: (ingredients: Ingredient[], limit: number = 5): Ingredient[] => {
    return ingredients
      .map(ingredient => ({
        ...ingredient,
        unitPrice: ingredientCalculations.calculateIngredientUnitPrice(ingredient),
      }))
      .sort((a, b) => a.unitPrice - b.unitPrice)
      .slice(0, limit);
  },
};

// 料理関連の計算
export const dishCalculations = {
  /**
   * 料理の総原価を計算
   */
  calculateDishTotalCost: (ingredients: DishIngredient[]): number => {
    return ingredients.reduce((total, ingredient) => {
      if (ingredient.ingredient) {
        const unitPrice = ingredientCalculations.calculateIngredientUnitPrice(ingredient.ingredient);
        return total + calculations.calculateUsedCost(unitPrice, ingredient.used_quantity);
      }
      return total + (ingredient.used_cost || 0);
    }, 0);
  },

  /**
   * 料理の1人前原価を計算
   */
  calculateDishCostPerServing: (dish: Dish, servings: number = 1): number => {
    if (servings <= 0) return 0;
    return dish.total_cost / servings;
  },

  /**
   * 料理の材料効率を計算
   */
  calculateDishIngredientEfficiency: (dish: Dish): {
    totalIngredients: number;
    averageCostPerIngredient: number;
    mostExpensiveIngredient?: DishIngredient;
    leastExpensiveIngredient?: DishIngredient;
  } => {
    const ingredients = (dish as any).ingredients || [];
    
    if (ingredients.length === 0) {
      return {
        totalIngredients: 0,
        averageCostPerIngredient: 0,
      };
    }

    const costs = ingredients.map((ing: DishIngredient) => ing.used_cost);
    const averageCost = calculations.calculateAverage(costs);
    
    const sortedByTotalCost = [...ingredients].sort((a, b) => b.used_cost - a.used_cost);

    return {
      totalIngredients: ingredients.length,
      averageCostPerIngredient: averageCost,
      mostExpensiveIngredient: sortedByTotalCost[0],
      leastExpensiveIngredient: sortedByTotalCost[sortedByTotalCost.length - 1],
    };
  },

  /**
   * 料理のコスト分布を計算
   */
  calculateDishCostDistribution: (dishes: Dish[]): {
    low: number;    // 500円未満
    medium: number; // 500円以上1000円未満
    high: number;   // 1000円以上
  } => {
    const distribution = { low: 0, medium: 0, high: 0 };
    
    dishes.forEach(dish => {
      if (dish.total_cost < 500) {
        distribution.low++;
      } else if (dish.total_cost < 1000) {
        distribution.medium++;
      } else {
        distribution.high++;
      }
    });

    return distribution;
  },
};

// 完成品関連の計算
export const completedFoodCalculations = {
  /**
   * 完成品の総原価を計算
   */
  calculateCompletedFoodTotalCost: (dishes: FoodDish[]): number => {
    return dishes.reduce((total, foodDish) => {
      if (foodDish.dish) {
        return total + calculations.calculateUsedCost(foodDish.dish.total_cost, foodDish.usage_quantity);
      }
      return total + (foodDish.usage_cost || 0);
    }, 0);
  },

  /**
   * 完成品の利益を計算
   */
  calculateCompletedFoodProfit: (food: CompletedFood): number => {
    if (!food.price) return 0;
    return calculations.calculateProfit(food.price, food.total_cost);
  },

  /**
   * 完成品の利益率を計算
   */
  calculateCompletedFoodProfitRate: (food: CompletedFood): number => {
    if (!food.price) return 0;
    return calculations.calculateProfitRate(food.price, food.total_cost);
  },

  /**
   * 目標利益率に基づく推奨価格を計算
   */
  calculateRecommendedPrice: (totalCost: number, targetProfitRate: number): number => {
    if (targetProfitRate >= 100) return totalCost * 2; // 最大100%の利益率
    return totalCost / (1 - targetProfitRate / 100);
  },

  /**
   * 完成品の価格帯分析
   */
  analyzePriceRange: (foods: CompletedFood[]): {
    min: number;
    max: number;
    average: number;
    median: number;
    priceRanges: {
      budget: number;    // 1000円未満
      standard: number;  // 1000円以上2000円未満
      premium: number;   // 2000円以上
    };
  } => {
    const pricesWithValue = foods
      .filter(food => food.price && food.price > 0)
      .map(food => food.price!);

    if (pricesWithValue.length === 0) {
      return {
        min: 0,
        max: 0,
        average: 0,
        median: 0,
        priceRanges: { budget: 0, standard: 0, premium: 0 },
      };
    }

    const priceRanges = { budget: 0, standard: 0, premium: 0 };
    pricesWithValue.forEach(price => {
      if (price < 1000) {
        priceRanges.budget++;
      } else if (price < 2000) {
        priceRanges.standard++;
      } else {
        priceRanges.premium++;
      }
    });

    return {
      min: Math.min(...pricesWithValue),
      max: Math.max(...pricesWithValue),
      average: calculations.calculateAverage(pricesWithValue),
      median: calculations.calculateMedian(pricesWithValue),
      priceRanges,
    };
  },

  /**
   * 利益率による分類
   */
  categorizeProfitLevels: (foods: CompletedFood[]): {
    high: CompletedFood[];    // 30%以上
    medium: CompletedFood[];  // 15%以上30%未満
    low: CompletedFood[];     // 15%未満
  } => {
    const categories = { high: [], medium: [], low: [] } as any;

    foods.forEach(food => {
      const profitRate = completedFoodCalculations.calculateCompletedFoodProfitRate(food);
      
      if (profitRate >= 30) {
        categories.high.push(food);
      } else if (profitRate >= 15) {
        categories.medium.push(food);
      } else {
        categories.low.push(food);
      }
    });

    return categories;
  },
};

// 統計計算
export const statisticsCalculations = {
  /**
   * コスト推移を計算
   */
  calculateCostTrend: (costs: { date: string; value: number }[]): {
    trend: 'increasing' | 'decreasing' | 'stable';
    changeRate: number;
    correlation: number;
  } => {
    if (costs.length < 2) {
      return { trend: 'stable', changeRate: 0, correlation: 0 };
    }

    const values = costs.map(c => c.value);
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    
    const changeRate = calculations.calculateGrowthRate(lastValue, firstValue);
    
    // 簡単な相関係数計算（時系列との相関）
    const indices = costs.map((_, i) => i);
    const avgIndex = calculations.calculateAverage(indices);
    const avgValue = calculations.calculateAverage(values);
    
    const numerator = indices.reduce((sum, index, i) => 
      sum + (index - avgIndex) * (values[i] - avgValue), 0);
    
    const denominatorX = Math.sqrt(indices.reduce((sum, index) => 
      sum + Math.pow(index - avgIndex, 2), 0));
    
    const denominatorY = Math.sqrt(values.reduce((sum, value) => 
      sum + Math.pow(value - avgValue, 2), 0));
    
    const correlation = denominatorX && denominatorY ? 
      numerator / (denominatorX * denominatorY) : 0;

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(changeRate) < 5) {
      trend = 'stable';
    } else if (changeRate > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    return { trend, changeRate, correlation };
  },

  /**
   * 月次統計を計算
   */
  calculateMonthlyStats: (data: { date: string; value: number }[]): Record<string, {
    count: number;
    total: number;
    average: number;
    min: number;
    max: number;
  }> => {
    const monthlyData: Record<string, number[]> = {};

    data.forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = [];
      }
      monthlyData[monthKey].push(item.value);
    });

    return Object.entries(monthlyData).reduce((result, [month, values]) => {
      result[month] = {
        count: values.length,
        total: values.reduce((sum, val) => sum + val, 0),
        average: calculations.calculateAverage(values),
        min: Math.min(...values),
        max: Math.max(...values),
      };
      return result;
    }, {} as any);
  },

  /**
   * ROI（投資収益率）を計算
   */
  calculateROI: (initialInvestment: number, currentValue: number): number => {
    if (initialInvestment === 0) return 0;
    return ((currentValue - initialInvestment) / initialInvestment) * 100;
  },
};

// 予測計算
export const predictionCalculations = {
  /**
   * 線形回帰による予測
   */
  linearRegression: (dataPoints: { x: number; y: number }[]): {
    slope: number;
    intercept: number;
    predict: (x: number) => number;
    rSquared: number;
  } => {
    if (dataPoints.length < 2) {
      return {
        slope: 0,
        intercept: 0,
        predict: () => 0,
        rSquared: 0,
      };
    }

    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, point) => sum + point.x, 0);
    const sumY = dataPoints.reduce((sum, point) => sum + point.y, 0);
    const sumXY = dataPoints.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumXX = dataPoints.reduce((sum, point) => sum + point.x * point.x, 0);
    const sumYY = dataPoints.reduce((sum, point) => sum + point.y * point.y, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R-squared計算
    const yMean = sumY / n;
    const totalSumSquares = dataPoints.reduce((sum, point) => 
      sum + Math.pow(point.y - yMean, 2), 0);
    const residualSumSquares = dataPoints.reduce((sum, point) => 
      sum + Math.pow(point.y - (slope * point.x + intercept), 2), 0);
    const rSquared = 1 - (residualSumSquares / totalSumSquares);

    return {
      slope,
      intercept,
      predict: (x: number) => slope * x + intercept,
      rSquared,
    };
  },

  /**
   * 移動平均を計算
   */
  calculateMovingAverage: (values: number[], window: number): number[] => {
    if (values.length < window) return [];

    const result: number[] = [];
    for (let i = window - 1; i < values.length; i++) {
      const slice = values.slice(i - window + 1, i + 1);
      result.push(calculations.calculateAverage(slice));
    }

    return result;
  },

  /**
   * 需要予測（簡単な指数平滑法）
   */
  forecastDemand: (historicalData: number[], alpha: number = 0.3): number => {
    if (historicalData.length === 0) return 0;
    if (historicalData.length === 1) return historicalData[0];

    let forecast = historicalData[0];
    for (let i = 1; i < historicalData.length; i++) {
      forecast = alpha * historicalData[i] + (1 - alpha) * forecast;
    }

    return forecast;
  },
};

// ユーティリティ関数
export const calculationUtils = {
  /**
   * 安全な除算
   */
  safeDivide: (numerator: number, denominator: number, fallback: number = 0): number => {
    return denominator === 0 ? fallback : numerator / denominator;
  },

  /**
   * 数値を指定した桁数で四捨五入
   */
  round: (value: number, decimals: number = 2): number => {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  },

  /**
   * 値を範囲内にクランプ
   */
  clamp: (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  },

  /**
   * パーセンテージを0-100の範囲にクランプ
   */
  clampPercentage: (value: number): number => {
    return calculationUtils.clamp(value, 0, 100);
  },

  /**
   * 数値配列の外れ値を除去
   */
  removeOutliers: (values: number[], threshold: number = 2): number[] => {
    const mean = calculations.calculateAverage(values);
    const stdDev = calculations.calculateStandardDeviation(values);
    
    return values.filter(value => 
      Math.abs(value - mean) <= threshold * stdDev
    );
  },
};

// エクスポート
export {
  calculations,
  ingredientCalculations,
  dishCalculations,
  completedFoodCalculations,
  statisticsCalculations,
  predictionCalculations,
  calculationUtils,
};

export default {
  ...calculations,
  ingredient: ingredientCalculations,
  dish: dishCalculations,
  completedFood: completedFoodCalculations,
  statistics: statisticsCalculations,
  prediction: predictionCalculations,
  utils: calculationUtils,
};
