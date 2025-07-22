import React, { useState } from 'react';
import {
    Grid,
    Paper,
    Typography,
    Box,
    Button,
    Card,
    CardContent,
    Fab,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Add as AddIcon,
    Restaurant as RestaurantIcon,
    LocalDining as LocalDiningIcon,
    Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import IngredientsPanel from '../components/ingredients/IngredientsPanel';
import DishesPanel from '../components/dishes/DishesPanel';
import CompletedFoodsPanel from '../components/completedFoods/CompletedFoodsPanel';
import DishBuilder from '../components/common/DishBuilder';
import FoodBuilder from '../components/completedFoods/FoodBuilder';
import AddIngredientModal from '../components/common/AddIngredientModal';
import FloatingArea from '../components/dragdrop/FloatingArea';
import StatsCard from '../components/reports/StatsCard';

import { ingredientApi, dishApi, completedFoodApi } from '../services/api';

const MainPage: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const [addIngredientModalOpen, setAddIngredientModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'builder' | 'ingredients' | 'dishes' | 'foods'>('builder');

    // データ取得
    const { data: ingredientsData, refetch: refetchIngredients } = useQuery({
        queryKey: ['ingredients'],
        queryFn: () => ingredientApi.getAll({ limit: 100 }),
        staleTime: 5 * 60 * 1000,
    });

    const { data: dishesData, refetch: refetchDishes } = useQuery({
        queryKey: ['dishes'],
        queryFn: () => dishApi.getAll({ limit: 100 }),
        staleTime: 5 * 60 * 1000,
    });

    const { data: completedFoodsData, refetch: refetchCompletedFoods } = useQuery({
        queryKey: ['completedFoods'],
        queryFn: () => completedFoodApi.getAll({ limit: 100 }),
        staleTime: 5 * 60 * 1000,
    });

    const { data: ingredientStats } = useQuery({
        queryKey: ['ingredientStats'],
        queryFn: () => ingredientApi.getStats(),
        staleTime: 10 * 60 * 1000,
    });

    const ingredients = ingredientsData?.data || [];
    const dishes = dishesData?.data || [];
    const completedFoods = completedFoodsData?.data || [];

    const handleAddIngredientSuccess = () => {
        setAddIngredientModalOpen(false);
        refetchIngredients();
        toast.success('食材を追加しました！');
    };

    const handleDishCreated = () => {
        refetchDishes();
        refetchIngredients(); // 食材使用量更新のため
    };

    const handleFoodCreated = () => {
        refetchCompletedFoods();
        refetchDishes(); // 料理使用量更新のため
    };

    const renderMobileView = () => (
        <Box>
            {/* タブナビゲーション */}
            <Paper sx={{ mb: 2, p: 1 }}>
                <Box display="flex" gap={1} flexWrap="wrap">
                    <Button
                        variant={activeTab === 'builder' ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setActiveTab('builder')}
                        startIcon={<RestaurantIcon />}
                    >
                        作成
                    </Button>
                    <Button
                        variant={activeTab === 'ingredients' ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setActiveTab('ingredients')}
                    >
                        食材
                    </Button>
                    <Button
                        variant={activeTab === 'dishes' ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setActiveTab('dishes')}
                    >
                        料理
                    </Button>
                    <Button
                        variant={activeTab === 'foods' ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setActiveTab('foods')}
                    >
                        完成品
                    </Button>
                </Box>
            </Paper>

            {/* コンテンツ */}
            {activeTab === 'builder' && (
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <DishBuilder 
                            ingredients={ingredients}
                            onDishCreated={handleDishCreated}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FoodBuilder 
                            dishes={dishes}
                            onFoodCreated={handleFoodCreated}
                        />
                    </Grid>
                </Grid>
            )}

            {activeTab === 'ingredients' && (
                <IngredientsPanel 
                    ingredients={ingredients}
                    onRefresh={refetchIngredients}
                />
            )}

            {activeTab === 'dishes' && (
                <DishesPanel 
                    dishes={dishes}
                    onRefresh={refetchDishes}
                />
            )}

            {activeTab === 'foods' && (
                <CompletedFoodsPanel 
                    completedFoods={completedFoods}
                    onRefresh={refetchCompletedFoods}
                />
            )}
        </Box>
    );

    const renderDesktopView = () => (
        <Grid container spacing={3}>
            {/* 統計情報 */}
            <Grid item xs={12}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatsCard
                            title="食材数"
                            value={ingredients.length}
                            icon={<LocalDiningIcon />}
                            color={theme.palette.primary.main}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatsCard
                            title="料理数"
                            value={dishes.length}
                            icon={<RestaurantIcon />}
                            color={theme.palette.secondary.main}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatsCard
                            title="完成品数"
                            value={completedFoods.length}
                            icon={<LocalDiningIcon />}
                            color={theme.palette.success.main}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatsCard
                            title="平均単価"
                            value={`¥${ingredientStats?.data?.total?.avg_unit_price?.toFixed(2) || '0.00'}`}
                            icon={<AnalyticsIcon />}
                            color={theme.palette.warning.main}
                        />
                    </Grid>
                </Grid>
            </Grid>

            {/* 左側: 食材・料理・完成品パネル */}
            <Grid item xs={12} md={6}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <IngredientsPanel 
                            ingredients={ingredients}
                            onRefresh={refetchIngredients}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <DishesPanel 
                            dishes={dishes}
                            onRefresh={refetchDishes}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <CompletedFoodsPanel 
                            completedFoods={completedFoods}
                            onRefresh={refetchCompletedFoods}
                        />
                    </Grid>
                </Grid>
            </Grid>

            {/* 右側: 作成エリア */}
            <Grid item xs={12} md={6}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <DishBuilder 
                            ingredients={ingredients}
                            onDishCreated={handleDishCreated}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FoodBuilder 
                            dishes={dishes}
                            onFoodCreated={handleFoodCreated}
                        />
                    </Grid>
                </Grid>
            </Grid>

            {/* フローティングエリア */}
            <Grid item xs={12}>
                <FloatingArea />
            </Grid>
        </Grid>
    );

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            {/* ヘッダー */}
            <Box mb={3}>
                <Typography variant="h4" component="h1" gutterBottom>
                    🍽️ 料理原価計算システム
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    食材をドラッグ&ドロップして料理・完成品を作成しましょう
                </Typography>
            </Box>

            {/* メインコンテンツ */}
            {isMobile ? renderMobileView() : renderDesktopView()}

            {/* 食材追加FAB */}
            <Fab
                color="primary"
                aria-label="add ingredient"
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    zIndex: 1000,
                }}
                onClick={() => setAddIngredientModalOpen(true)}
            >
                <AddIcon />
            </Fab>

            {/* 食材追加モーダル */}
            <AddIngredientModal
                open={addIngredientModalOpen}
                onClose={() => setAddIngredientModalOpen(false)}
                onSuccess={handleAddIngredientSuccess}
            />
        </Box>
    );
};

export default MainPage;