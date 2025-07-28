import React, { useState } from 'react';
import { 
    Box, 
    Grid, 
    Paper, 
    Typography, 
    Tab, 
    Tabs,
    useTheme,
    useMediaQuery,
    Fab,
    Fade,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

// コンポーネントのインポート
import AddIngredientModal from '../components/common/AddIngredientModal';
import DishBuilder from '../components/common/DishBuilder';
import CompletedFoodBuilder from '../components/completedFoods/CompletedFoodsBuilder';
import { IngredientCard } from '../components/ingredients/IngredientCard';
import { DishCard } from '../components/dishes/DishCard';
import { CompletedFoodCard } from '../components/completedFoods/CompletedFoodCard';
import { StatsCard } from '../components/reports/StatsCard';

// API & Types
import { ingredientApi, dishApi, completedFoodApi, reportApi } from '../services/api';
import { Ingredient, Dish, CompletedFood } from '../types';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
    <div
        role="tabpanel"
        hidden={value !== index}
        id={`main-tabpanel-${index}`}
        aria-labelledby={`main-tab-${index}`}
        {...other}
    >
        {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
);

const MainPage: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [activeTab, setActiveTab] = useState(0);
    const [addIngredientModalOpen, setAddIngredientModalOpen] = useState(false);

    // データ取得
    const { data: ingredientsResponse, isLoading: ingredientsLoading, refetch: refetchIngredients } = useQuery({
        queryKey: ['ingredients'],
        queryFn: () => ingredientApi.getAll({ limit: 50 }),
    });

    const { data: dishesResponse, isLoading: dishesLoading, refetch: refetchDishes } = useQuery({
        queryKey: ['dishes'],
        queryFn: () => dishApi.getAll({ limit: 30 }),
    });

    const { data: foodsResponse, isLoading: foodsLoading, refetch: refetchFoods } = useQuery({
        queryKey: ['completedFoods'],
        queryFn: () => completedFoodApi.getAll({ limit: 20 }),
    });

    const { data: dashboardData } = useQuery({
        queryKey: ['dashboard'],
        queryFn: reportApi.getDashboard,
        refetchInterval: 5 * 60 * 1000, // 5分ごとに更新
    });

    const ingredients = ingredientsResponse?.data || [];
    const dishes = dishesResponse?.data || [];
    const foods = foodsResponse?.data || [];

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleIngredientAdded = () => {
        setAddIngredientModalOpen(false);
        refetchIngredients();
    };

    const handleDishCreated = () => {
        refetchDishes();
    };

    const handleFoodCreated = () => {
        refetchFoods();
    };

    // 統計データ
    const stats = dashboardData?.data?.summary || {};

    return (
        <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 } }}>
        {/* ヘッダー統計 */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
            <StatsCard
                title="食材数"
                value={stats.totalIngredients || 0}
                icon="🛒"
                color={theme.palette.primary.main}
            />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
            <StatsCard
                title="料理数"
                value={stats.totalDishes || 0}
                icon="🍳"
                color={theme.palette.success.main}
            />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
            <StatsCard
                title="完成品数"
                value={stats.totalCompletedFoods || 0}
                icon="🏆"
                color={theme.palette.warning.main}
            />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
            <StatsCard
                title="平均利益率"
                value={`${stats.avgProfitRate || 0}%`}
                icon="📊"
                color={theme.palette.error.main}
            />
            </Grid>
        </Grid>

        {/* メインコンテンツ */}
        <Grid container spacing={3}>
            {/* 左側パネル - 食材・料理・完成品 */}
            <Grid item xs={12} lg={8}>
            <Paper sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
                {/* タブヘッダー */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant={isMobile ? 'fullWidth' : 'standard'}
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                >
                    <Tab 
                    label={`🛒 食材 (${ingredients.length})`}
                    id="main-tab-0"
                    aria-controls="main-tabpanel-0"
                    />
                    <Tab 
                    label={`🍳 料理 (${dishes.length})`}
                    id="main-tab-1"
                    aria-controls="main-tabpanel-1"
                    />
                    <Tab 
                    label={`🏆 完成品 (${foods.length})`}
                    id="main-tab-2"
                    aria-controls="main-tabpanel-2"
                    />
                </Tabs>
                </Box>

                {/* タブコンテンツ */}
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                {/* 食材タブ */}
                <TabPanel value={activeTab} index={0}>
                    <Box sx={{ height: '55vh', overflowY: 'auto', px: 2 }}>
                    {ingredientsLoading ? (
                        <Typography>読み込み中...</Typography>
                    ) : ingredients.length === 0 ? (
                        <Box textAlign="center" py={4}>
                        <Typography variant="h6" color="text.secondary">
                            まだ食材が登録されていません
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            右下の + ボタンから食材を追加してください
                        </Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={2}>
                        {ingredients.map((ingredient: Ingredient) => (
                            <Grid item xs={12} sm={6} md={4} key={ingredient.id}>
                            <IngredientCard 
                                ingredient={ingredient}
                                onUpdate={refetchIngredients}
                            />
                            </Grid>
                        ))}
                        </Grid>
                    )}
                    </Box>
                </TabPanel>

                {/* 料理タブ */}
                <TabPanel value={activeTab} index={1}>
                    <Box sx={{ height: '55vh', overflowY: 'auto', px: 2 }}>
                    {dishesLoading ? (
                        <Typography>読み込み中...</Typography>
                    ) : dishes.length === 0 ? (
                        <Box textAlign="center" py={4}>
                        <Typography variant="h6" color="text.secondary">
                            まだ料理が作成されていません
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            右側の料理作成エリアで料理を作成してください
                        </Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={2}>
                        {dishes.map((dish: Dish) => (
                            <Grid item xs={12} sm={6} md={4} key={dish.id}>
                            <DishCard 
                                dish={dish}
                                onUpdate={refetchDishes}
                            />
                            </Grid>
                        ))}
                        </Grid>
                    )}
                    </Box>
                </TabPanel>

                {/* 完成品タブ */}
                <TabPanel value={activeTab} index={2}>
                    <Box sx={{ height: '55vh', overflowY: 'auto', px: 2 }}>
                    {foodsLoading ? (
                        <Typography>読み込み中...</Typography>
                    ) : foods.length === 0 ? (
                        <Box textAlign="center" py={4}>
                        <Typography variant="h6" color="text.secondary">
                            まだ完成品が登録されていません
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            右側の完成品作成エリアで完成品を登録してください
                        </Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={2}>
                        {foods.map((food: CompletedFood) => (
                            <Grid item xs={12} sm={6} md={4} key={food.id}>
                            <CompletedFoodCard food={food} />
                            </Grid>
                        ))}
                        </Grid>
                    )}
                    </Box>
                </TabPanel>
                </Box>
            </Paper>
            </Grid>

            {/* 右側パネル - 料理作成・完成品作成 */}
            <Grid item xs={12} lg={4}>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                <DishBuilder 
                    ingredients={ingredients} 
                    onDishCreated={handleDishCreated}
                />
                </Grid>
                <Grid item xs={12}>
                <CompletedFoodBuilder 
                    dishes={dishes} 
                    onFoodCreated={handleFoodCreated}
                />
                </Grid>
            </Grid>
            </Grid>
        </Grid>

        {/* 食材追加FAB */}
        <Fade in={activeTab === 0}>
            <Fab
            color="primary"
            aria-label="add ingredient"
            onClick={() => setAddIngredientModalOpen(true)}
            sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 1000,
            }}
            >
            <AddIcon />
            </Fab>
        </Fade>

        {/* 食材追加モーダル */}
        <AddIngredientModal
            open={addIngredientModalOpen}
            onClose={() => setAddIngredientModalOpen(false)}
            onSuccess={handleIngredientAdded}
        />
        </Box>
    );
};

export default MainPage;
