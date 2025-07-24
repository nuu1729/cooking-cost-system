import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { completedFoodApi } from '../services/api';
import { useToast } from './useToast';
import { 
  CompletedFood, 
  CreateCompletedFoodRequest, 
  UpdateCompletedFoodRequest,
  CompletedFoodSearchParams,
  QUERY_KEYS,
  Dish 
} from '../types';

interface UseCompletedFoodsOptions {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: CompletedFood[]) => void;
  onError?: (error: any) => void;
}

export const useCompletedFoods = (
  searchParams?: CompletedFoodSearchParams,
  options?: UseCompletedFoodsOptions
) => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...QUERY_KEYS.COMPLETED_FOODS, searchParams],
    queryFn: () => completedFoodApi.getAll(searchParams),
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
    onSuccess: (data) => {
      options?.onSuccess?.(data.data);
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || '完成品の取得に失敗しました';
      error(errorMessage);
      options?.onError?.(err);
    },
  });

  return {
    completedFoods: query.data?.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
};

export const useCompletedFood = (id: number, enabled: boolean = true) => {
  const { error } = useToast();

  const query = useQuery({
    queryKey: QUERY_KEYS.COMPLETED_FOOD_DETAIL(id),
    queryFn: () => completedFoodApi.getById(id),
    enabled: enabled && !!id,
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || '完成品の取得に失敗しました';
      error(errorMessage);
    },
  });

  return {
    completedFood: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useCreateCompletedFood = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCompletedFoodRequest) => completedFoodApi.create(data),
    onSuccess: (response) => {
      success('完成品を登録しました');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMPLETED_FOODS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD });
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || '完成品の登録に失敗しました';
      error(errorMessage);
    },
  });
};

export const useUpdateCompletedFood = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCompletedFoodRequest }) =>
      completedFoodApi.update(id, data),
    onSuccess: (response, variables) => {
      success('完成品を更新しました');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMPLETED_FOODS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMPLETED_FOOD_DETAIL(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD });
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || '完成品の更新に失敗しました';
      error(errorMessage);
    },
  });
};

export const useDeleteCompletedFood = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => completedFoodApi.delete(id),
    onSuccess: (_, id) => {
      success('完成品を削除しました');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMPLETED_FOODS });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.COMPLETED_FOOD_DETAIL(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD });
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || '完成品の削除に失敗しました';
      error(errorMessage);
    },
  });
};

export const useProfitableItems = (limit?: number) => {
  const { error } = useToast();

  return useQuery({
    queryKey: [...QUERY_KEYS.POPULAR_ITEMS, 'profitable', limit],
    queryFn: () => completedFoodApi.getProfitableItems(limit),
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || '利益率の高い商品の取得に失敗しました';
      error(errorMessage);
    },
  });
};

// 完成品作成用のカスタムフック
export const useCompletedFoodBuilder = () => {
  const [foodName, setFoodName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [selectedDishes, setSelectedDishes] = useState<{
    dish: Dish;
    usageQuantity: number;
    usageUnit: 'ratio' | 'serving';
    usageCost: number;
    description?: string;
  }[]>([]);

  const createMutation = useCreateCompletedFood();

  const addDish = useCallback((
    dish: Dish, 
    usageQuantity: number, 
    usageUnit: 'ratio' | 'serving' = 'ratio',
    dishDescription?: string
  ) => {
    const usageCost = dish.total_cost * usageQuantity;
    
    setSelectedDishes(prev => {
      const existingIndex = prev.findIndex(item => item.dish.id === dish.id);
      
      if (existingIndex !== -1) {
        // 既存の料理を更新
        const updated = [...prev];
        updated[existingIndex] = { 
          dish, 
          usageQuantity, 
          usageUnit, 
          usageCost,
          description: dishDescription 
        };
        return updated;
      } else {
        // 新しい料理を追加
        return [...prev, { 
          dish, 
          usageQuantity, 
          usageUnit, 
          usageCost,
          description: dishDescription 
        }];
      }
    });
  }, []);

  const removeDish = useCallback((dishId: number) => {
    setSelectedDishes(prev => 
      prev.filter(item => item.dish.id !== dishId)
    );
  }, []);

  const updateDishUsage = useCallback((
    dishId: number, 
    newQuantity: number, 
    newUnit?: 'ratio' | 'serving'
  ) => {
    setSelectedDishes(prev =>
      prev.map(item =>
        item.dish.id === dishId
          ? {
              ...item,
              usageQuantity: newQuantity,
              usageUnit: newUnit || item.usageUnit,
              usageCost: item.dish.total_cost * newQuantity,
            }
          : item
      )
    );
  }, []);

  const getTotalCost = useCallback(() => {
    return selectedDishes.reduce((total, item) => total + item.usageCost, 0);
  }, [selectedDishes]);

  const getProfit = useCallback(() => {
    if (!price) return 0;
    return Math.max(0, price - getTotalCost());
  }, [price, getTotalCost]);

  const getProfitRate = useCallback(() => {
    if (!price || price <= 0) return 0;
    return (getProfit() / price) * 100;
  }, [price, getProfit]);

  const canCreateFood = useCallback(() => {
    return foodName.trim() !== '' && selectedDishes.length > 0;
  }, [foodName, selectedDishes.length]);

  const createCompletedFood = useCallback(async () => {
    if (!canCreateFood()) {
      throw new Error('完成品名と料理が必要です');
    }

    const foodData: CreateCompletedFoodRequest = {
      name: foodName.trim(),
      description: description.trim() || undefined,
      price: price,
      dishes: selectedDishes.map(item => ({
        dish_id: item.dish.id!,
        usage_quantity: item.usageQuantity,
        usage_unit: item.usageUnit,
        description: item.description,
      })),
    };

    const result = await createMutation.mutateAsync(foodData);
    
    // フォームをリセット
    reset();
    
    return result;
  }, [foodName, description, price, selectedDishes, createMutation, canCreateFood]);

  const reset = useCallback(() => {
    setFoodName('');
    setDescription('');
    setPrice(undefined);
    setSelectedDishes([]);
  }, []);

  // 利益率の評価
  const getProfitLevel = useCallback(() => {
    const rate = getProfitRate();
    if (rate >= 30) return 'high';
    if (rate >= 15) return 'medium';
    return 'low';
  }, [getProfitRate]);

  return {
    // 状態
    foodName,
    description,
    price,
    selectedDishes,
    totalCost: getTotalCost(),
    profit: getProfit(),
    profitRate: getProfitRate(),
    profitLevel: getProfitLevel(),
    isCreating: createMutation.isLoading,
    
    // アクション
    setFoodName,
    setDescription,
    setPrice,
    addDish,
    removeDish,
    updateDishUsage,
    createCompletedFood,
    reset,
    
    // バリデーション
    canCreateFood: canCreateFood(),
    
    // ヘルパー
    getTotalCost,
    getProfit,
    getProfitRate,
    getProfitLevel,
  };
};

// 完成品管理のカスタムフック
export const useCompletedFoodManager = () => {
  const [searchParams, setSearchParams] = useState<CompletedFoodSearchParams>({});
  const [selectedFoods, setSelectedFoods] = useState<CompletedFood[]>([]);
  
  const { completedFoods, isLoading, refetch } = useCompletedFoods(searchParams);
  const updateMutation = useUpdateCompletedFood();
  const deleteMutation = useDeleteCompletedFood();

  const handleSearch = useCallback((params: CompletedFoodSearchParams) => {
    setSearchParams(params);
  }, []);

  const handleUpdate = useCallback(async (id: number, data: UpdateCompletedFoodRequest) => {
    return updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const handleDelete = useCallback(async (id: number) => {
    return deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const handleBulkDelete = useCallback(async (ids: number[]) => {
    for (const id of ids) {
      await deleteMutation.mutateAsync(id);
    }
    setSelectedFoods([]);
  }, [deleteMutation]);

  const handleSelect = useCallback((food: CompletedFood) => {
    setSelectedFoods(prev => {
      const exists = prev.find(item => item.id === food.id);
      if (exists) {
        return prev.filter(item => item.id !== food.id);
      }
      return [...prev, food];
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedFoods.length === completedFoods.length) {
      setSelectedFoods([]);
    } else {
      setSelectedFoods(completedFoods);
    }
  }, [completedFoods, selectedFoods.length]);

  const clearSelection = useCallback(() => {
    setSelectedFoods([]);
  }, []);

  // 完成品のフィルタリング
  const filterCompletedFoods = useCallback((
    foods: CompletedFood[],
    filters: {
      search?: string;
      minPrice?: number;
      maxPrice?: number;
      minCost?: number;
      maxCost?: number;
      profitLevel?: 'high' | 'medium' | 'low';
    }
  ) => {
    return foods.filter(food => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!food.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      if (filters.minPrice && (!food.price || food.price < filters.minPrice)) {
        return false;
      }

      if (filters.maxPrice && (!food.price || food.price > filters.maxPrice)) {
        return false;
      }

      if (filters.minCost && food.total_cost < filters.minCost) {
        return false;
      }

      if (filters.maxCost && food.total_cost > filters.maxCost) {
        return false;
      }

      if (filters.profitLevel && food.price) {
        const profitRate = ((food.price - food.total_cost) / food.price) * 100;
        const level = profitRate >= 30 ? 'high' : profitRate >= 15 ? 'medium' : 'low';
        if (level !== filters.profitLevel) {
          return false;
        }
      }

      return true;
    });
  }, []);

  // 完成品のソート
  const sortCompletedFoods = useCallback((
    foods: CompletedFood[],
    sortBy: string,
    sortOrder: 'asc' | 'desc' = 'asc'
  ) => {
    return [...foods].sort((a, b) => {
      let aVal: any = a[sortBy as keyof CompletedFood];
      let bVal: any = b[sortBy as keyof CompletedFood];

      // 利益率の計算
      if (sortBy === 'profit_rate') {
        aVal = a.price ? ((a.price - a.total_cost) / a.price) * 100 : 0;
        bVal = b.price ? ((b.price - b.total_cost) / b.price) * 100 : 0;
      }

      // 利益の計算
      if (sortBy === 'profit') {
        aVal = a.price ? Math.max(0, a.price - a.total_cost) : 0;
        bVal = b.price ? Math.max(0, b.price - b.total_cost) : 0;
      }

      // 数値の場合
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // 文字列の場合
      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, []);

  return {
    // データ
    completedFoods,
    selectedFoods,
    searchParams,
    
    // 状態
    isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    
    // アクション
    handleSearch,
    handleUpdate,
    handleDelete,
    handleBulkDelete,
    handleSelect,
    handleSelectAll,
    clearSelection,
    refetch,
    
    // ユーティリティ
    filterCompletedFoods,
    sortCompletedFoods,
    
    // 選択状態
    hasSelection: selectedFoods.length > 0,
    isAllSelected: selectedFoods.length === completedFoods.length && completedFoods.length > 0,
  };
};

// 完成品の検索とフィルタリング用フック
export const useCompletedFoodSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{
    minPrice?: number;
    maxPrice?: number;
    minCost?: number;
    maxCost?: number;
  }>({});
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const searchParams: CompletedFoodSearchParams = {
    name: searchTerm,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    minCost: filters.minCost,
    maxCost: filters.maxCost,
    sortBy: sortBy as any,
    sortOrder: sortOrder.toUpperCase() as any,
  };

  const { completedFoods, isLoading, refetch } = useCompletedFoods(searchParams);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
  }, []);

  const handleSortChange = useCallback((field: string, order?: 'asc' | 'desc') => {
    setSortBy(field);
    if (order) {
      setSortOrder(order);
    } else {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    }
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilters({});
    setSortBy('name');
    setSortOrder('asc');
  }, []);

  return {
    // データ
    completedFoods,
    searchTerm,
    filters,
    sortBy,
    sortOrder,
    
    // 状態
    isLoading,
    
    // アクション
    handleSearchChange,
    handleFilterChange,
    handleSortChange,
    clearFilters,
    refetch,
    
    // ユーティリティ
    hasFilters: searchTerm || Object.keys(filters).length > 0,
  };
};

export default useCompletedFoods;
