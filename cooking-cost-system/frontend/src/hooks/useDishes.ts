import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { dishApi } from '../services/api';
import { useToast } from './useToast';
import { 
  Dish, 
  CreateDishRequest, 
  DishSearchParams,
  QUERY_KEYS,
  Ingredient 
} from '../types';

interface UseDishesOptions {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: Dish[]) => void;
  onError?: (error: any) => void;
}

export const useDishes = (
  searchParams?: DishSearchParams,
  options?: UseDishesOptions
) => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...QUERY_KEYS.DISHES, searchParams],
    queryFn: () => dishApi.getAll(searchParams),
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
    onSuccess: (data) => {
      options?.onSuccess?.(data.data);
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || '料理の取得に失敗しました';
      error(errorMessage);
      options?.onError?.(err);
    },
  });

  return {
    dishes: query.data?.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
};

export const useDish = (id: number, enabled: boolean = true) => {
  const { error } = useToast();

  const query = useQuery({
    queryKey: QUERY_KEYS.DISH_DETAIL(id),
    queryFn: () => dishApi.getById(id),
    enabled: enabled && !!id,
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || '料理の取得に失敗しました';
      error(errorMessage);
    },
  });

  return {
    dish: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useCreateDish = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDishRequest) => dishApi.create(data),
    onSuccess: (response) => {
      success('料理を作成しました');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DISHES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD });
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || '料理の作成に失敗しました';
      error(errorMessage);
    },
  });
};

export const useUpdateDish = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateDishRequest> }) =>
      dishApi.update(id, data),
    onSuccess: (response, variables) => {
      success('料理を更新しました');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DISHES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DISH_DETAIL(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD });
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || '料理の更新に失敗しました';
      error(errorMessage);
    },
  });
};

export const useDeleteDish = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => dishApi.delete(id),
    onSuccess: (_, id) => {
      success('料理を削除しました');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DISHES });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.DISH_DETAIL(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD });
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || '料理の削除に失敗しました';
      error(errorMessage);
    },
  });
};

export const useDishStats = () => {
  const { error } = useToast();

  return useQuery({
    queryKey: [...QUERY_KEYS.GENRE_STATS, 'dishes'],
    queryFn: () => dishApi.getGenreStats(),
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || '統計の取得に失敗しました';
      error(errorMessage);
    },
  });
};

// 料理作成用のカスタムフック
export const useDishBuilder = () => {
  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<{
    ingredient: Ingredient;
    usedQuantity: number;
    usedCost: number;
  }[]>([]);

  const createMutation = useCreateDish();

  const addIngredient = useCallback((ingredient: Ingredient, usedQuantity: number) => {
    const usedCost = ingredient.unit_price * usedQuantity;
    
    setSelectedIngredients(prev => {
      const existingIndex = prev.findIndex(item => item.ingredient.id === ingredient.id);
      
      if (existingIndex !== -1) {
        // 既存の食材を更新
        const updated = [...prev];
        updated[existingIndex] = { ingredient, usedQuantity, usedCost };
        return updated;
      } else {
        // 新しい食材を追加
        return [...prev, { ingredient, usedQuantity, usedCost }];
      }
    });
  }, []);

  const removeIngredient = useCallback((ingredientId: number) => {
    setSelectedIngredients(prev => 
      prev.filter(item => item.ingredient.id !== ingredientId)
    );
  }, []);

  const updateIngredientQuantity = useCallback((ingredientId: number, newQuantity: number) => {
    setSelectedIngredients(prev =>
      prev.map(item =>
        item.ingredient.id === ingredientId
          ? {
              ...item,
              usedQuantity: newQuantity,
              usedCost: item.ingredient.unit_price * newQuantity,
            }
          : item
      )
    );
  }, []);

  const getTotalCost = useCallback(() => {
    return selectedIngredients.reduce((total, item) => total + item.usedCost, 0);
  }, [selectedIngredients]);

  const canCreateDish = useCallback(() => {
    return dishName.trim() !== '' && selectedIngredients.length > 0;
  }, [dishName, selectedIngredients.length]);

  const createDish = useCallback(async () => {
    if (!canCreateDish()) {
      throw new Error('料理名と食材が必要です');
    }

    const dishData: CreateDishRequest = {
      name: dishName.trim(),
      description: description.trim() || undefined,
      ingredients: selectedIngredients.map(item => ({
        ingredient_id: item.ingredient.id!,
        used_quantity: item.usedQuantity,
      })),
    };

    const result = await createMutation.mutateAsync(dishData);
    
    // フォームをリセット
    reset();
    
    return result;
  }, [dishName, description, selectedIngredients, createMutation, canCreateDish]);

  const reset = useCallback(() => {
    setDishName('');
    setDescription('');
    setSelectedIngredients([]);
  }, []);

  return {
    // 状態
    dishName,
    description,
    selectedIngredients,
    totalCost: getTotalCost(),
    isCreating: createMutation.isLoading,
    
    // アクション
    setDishName,
    setDescription,
    addIngredient,
    removeIngredient,
    updateIngredientQuantity,
    createDish,
    reset,
    
    // バリデーション
    canCreateDish: canCreateDish(),
    
    // ヘルパー
    getTotalCost,
  };
};

// 料理管理のカスタムフック
export const useDishManager = () => {
  const [searchParams, setSearchParams] = useState<DishSearchParams>({});
  const [selectedDishes, setSelectedDishes] = useState<Dish[]>([]);
  
  const { dishes, isLoading, refetch } = useDishes(searchParams);
  const updateMutation = useUpdateDish();
  const deleteMutation = useDeleteDish();

  const handleSearch = useCallback((params: DishSearchParams) => {
    setSearchParams(params);
  }, []);

  const handleUpdate = useCallback(async (id: number, data: Partial<CreateDishRequest>) => {
    return updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const handleDelete = useCallback(async (id: number) => {
    return deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const handleBulkDelete = useCallback(async (ids: number[]) => {
    for (const id of ids) {
      await deleteMutation.mutateAsync(id);
    }
    setSelectedDishes([]);
  }, [deleteMutation]);

  const handleSelect = useCallback((dish: Dish) => {
    setSelectedDishes(prev => {
      const exists = prev.find(item => item.id === dish.id);
      if (exists) {
        return prev.filter(item => item.id !== dish.id);
      }
      return [...prev, dish];
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedDishes.length === dishes.length) {
      setSelectedDishes([]);
    } else {
      setSelectedDishes(dishes);
    }
  }, [dishes, selectedDishes.length]);

  const clearSelection = useCallback(() => {
    setSelectedDishes([]);
  }, []);

  // 料理のフィルタリング
  const filterDishes = useCallback((
    dishes: Dish[],
    filters: {
      search?: string;
      genre?: string;
      minCost?: number;
      maxCost?: number;
    }
  ) => {
    return dishes.filter(dish => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!dish.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      if (filters.genre && dish.genre !== filters.genre) {
        return false;
      }

      if (filters.minCost && dish.total_cost < filters.minCost) {
        return false;
      }

      if (filters.maxCost && dish.total_cost > filters.maxCost) {
        return false;
      }

      return true;
    });
  }, []);

  // 料理のソート
  const sortDishes = useCallback((
    dishes: Dish[],
    sortBy: string,
    sortOrder: 'asc' | 'desc' = 'asc'
  ) => {
    return [...dishes].sort((a, b) => {
      let aVal: any = a[sortBy as keyof Dish];
      let bVal: any = b[sortBy as keyof Dish];

      // 数値の場合
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // 文字列の場合
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, []);

  return {
    // データ
    dishes,
    selectedDishes,
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
    filterDishes,
    sortDishes,
    
    // 選択状態
    hasSelection: selectedDishes.length > 0,
    isAllSelected: selectedDishes.length === dishes.length && dishes.length > 0,
  };
};

// 料理の検索とフィルタリング用フック
export const useDishSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{
    genre?: string;
    minCost?: number;
    maxCost?: number;
  }>({});
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const searchParams: DishSearchParams = {
    name: searchTerm,
    genre: filters.genre,
    minCost: filters.minCost,
    maxCost: filters.maxCost,
    sortBy: sortBy as any,
    sortOrder: sortOrder.toUpperCase() as any,
  };

  const { dishes, isLoading, refetch } = useDishes(searchParams);

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
    dishes,
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

export default useDishes;
