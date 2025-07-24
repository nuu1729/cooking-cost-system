import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { ingredientApi } from '../services/api';
import { useToast } from './useToast';
import { 
  Ingredient, 
  CreateIngredientRequest, 
  UpdateIngredientRequest,
  IngredientSearchParams,
  QUERY_KEYS 
} from '../types';

interface UseIngredientsOptions {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: Ingredient[]) => void;
  onError?: (error: any) => void;
}

export const useIngredients = (
  searchParams?: IngredientSearchParams,
  options?: UseIngredientsOptions
) => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...QUERY_KEYS.INGREDIENTS, searchParams],
    queryFn: () => ingredientApi.getAll(searchParams),
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
    onSuccess: (data) => {
      options?.onSuccess?.(data.data);
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || '食材の取得に失敗しました';
      error(errorMessage);
      options?.onError?.(err);
    },
  });

  return {
    ingredients: query.data?.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
};

export const useIngredient = (id: number, enabled: boolean = true) => {
  const { error } = useToast();

  const query = useQuery({
    queryKey: QUERY_KEYS.INGREDIENT_DETAIL(id),
    queryFn: () => ingredientApi.getById(id),
    enabled: enabled && !!id,
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || '食材の取得に失敗しました';
      error(errorMessage);
    },
  });

  return {
    ingredient: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useCreateIngredient = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIngredientRequest) => ingredientApi.create(data),
    onSuccess: (response) => {
      success('食材を追加しました');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INGREDIENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD });
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || '食材の追加に失敗しました';
      error(errorMessage);
    },
  });
};

export const useUpdateIngredient = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateIngredientRequest }) =>
      ingredientApi.update(id, data),
    onSuccess: (response, variables) => {
      success('食材を更新しました');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INGREDIENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INGREDIENT_DETAIL(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD });
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || '食材の更新に失敗しました';
      error(errorMessage);
    },
  });
};

export const useDeleteIngredient = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ingredientApi.delete(id),
    onSuccess: (_, id) => {
      success('食材を削除しました');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INGREDIENTS });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.INGREDIENT_DETAIL(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD });
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || '食材の削除に失敗しました';
      error(errorMessage);
    },
  });
};

export const useIngredientStats = () => {
  const { error } = useToast();

  return useQuery({
    queryKey: QUERY_KEYS.GENRE_STATS,
    queryFn: () => ingredientApi.getGenreStats(),
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || '統計の取得に失敗しました';
      error(errorMessage);
    },
  });
};

export const usePopularIngredients = (limit?: number) => {
  const { error } = useToast();

  return useQuery({
    queryKey: [...QUERY_KEYS.POPULAR_ITEMS, 'ingredients', limit],
    queryFn: () => ingredientApi.getPopular(limit),
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || '人気食材の取得に失敗しました';
      error(errorMessage);
    },
  });
};

// 食材管理のカスタムフック
export const useIngredientManager = () => {
  const [searchParams, setSearchParams] = useState<IngredientSearchParams>({});
  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([]);
  
  const { ingredients, isLoading, refetch } = useIngredients(searchParams);
  const createMutation = useCreateIngredient();
  const updateMutation = useUpdateIngredient();
  const deleteMutation = useDeleteIngredient();

  const handleSearch = useCallback((params: IngredientSearchParams) => {
    setSearchParams(params);
  }, []);

  const handleCreate = useCallback(async (data: CreateIngredientRequest) => {
    return createMutation.mutateAsync(data);
  }, [createMutation]);

  const handleUpdate = useCallback(async (id: number, data: UpdateIngredientRequest) => {
    return updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const handleDelete = useCallback(async (id: number) => {
    return deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const handleBulkDelete = useCallback(async (ids: number[]) => {
    for (const id of ids) {
      await deleteMutation.mutateAsync(id);
    }
    setSelectedIngredients([]);
  }, [deleteMutation]);

  const handleSelect = useCallback((ingredient: Ingredient) => {
    setSelectedIngredients(prev => {
      const exists = prev.find(item => item.id === ingredient.id);
      if (exists) {
        return prev.filter(item => item.id !== ingredient.id);
      }
      return [...prev, ingredient];
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIngredients.length === ingredients.length) {
      setSelectedIngredients([]);
    } else {
      setSelectedIngredients(ingredients);
    }
  }, [ingredients, selectedIngredients.length]);

  const clearSelection = useCallback(() => {
    setSelectedIngredients([]);
  }, []);

  // 食材のフィルタリング
  const filterIngredients = useCallback((
    ingredients: Ingredient[],
    filters: {
      search?: string;
      genre?: string;
      minPrice?: number;
      maxPrice?: number;
    }
  ) => {
    return ingredients.filter(ingredient => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!ingredient.name.toLowerCase().includes(searchLower) &&
            !ingredient.store.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      if (filters.genre && ingredient.genre !== filters.genre) {
        return false;
      }

      if (filters.minPrice && ingredient.price < filters.minPrice) {
        return false;
      }

      if (filters.maxPrice && ingredient.price > filters.maxPrice) {
        return false;
      }

      return true;
    });
  }, []);

  // 食材のソート
  const sortIngredients = useCallback((
    ingredients: Ingredient[],
    sortBy: string,
    sortOrder: 'asc' | 'desc' = 'asc'
  ) => {
    return [...ingredients].sort((a, b) => {
      let aVal: any = a[sortBy as keyof Ingredient];
      let bVal: any = b[sortBy as keyof Ingredient];

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
    ingredients,
    selectedIngredients,
    searchParams,
    
    // 状態
    isLoading,
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    
    // アクション
    handleSearch,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleBulkDelete,
    handleSelect,
    handleSelectAll,
    clearSelection,
    refetch,
    
    // ユーティリティ
    filterIngredients,
    sortIngredients,
    
    // 選択状態
    hasSelection: selectedIngredients.length > 0,
    isAllSelected: selectedIngredients.length === ingredients.length && ingredients.length > 0,
  };
};

// 食材の検索とフィルタリング用フック
export const useIngredientSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{
    genre?: string;
    store?: string;
    minPrice?: number;
    maxPrice?: number;
  }>({});
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const searchParams: IngredientSearchParams = {
    name: searchTerm,
    genre: filters.genre as any,
    sortBy: sortBy as any,
    sortOrder: sortOrder.toUpperCase() as any,
  };

  const { ingredients, isLoading, refetch } = useIngredients(searchParams);

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
    ingredients,
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

export default useIngredients;
