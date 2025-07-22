import React, { useState, useMemo } from 'react';
import {
    Paper,
    Typography,
    Box,
    TextField,
    Grid,
    Card,
    CardContent,
    Chip,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    InputAdornment,
    Tooltip,
    Collapse,
    Button,
    Stack,
    LinearProgress,
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Restaurant as RestaurantIcon,
    Info as InfoIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useDrag } from 'react-dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { Dish } from '../../types';
import { dishApi } from '../../services/api';
import { getGenreColor } from '../../theme';

interface DishesPanelProps {
    dishes: Dish[];
    onRefresh: () => void;
}

// ドラッグ可能な料理カード
const DraggableDishCard: React.FC<{ dish: Dish }> = ({ dish }) => {
    const [{ isDragging }, drag] = useDrag({
        type: 'dish',
        item: { type: 'dish', item: dish, id: dish.id },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: (id: number) => dishApi.delete(id),
        onSuccess: () => {
            toast.success('料理を削除しました');
            queryClient.invalidateQueries({ queryKey: ['dishes'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || '削除に失敗しました');
        },
    });

    const [showDetails, setShowDetails] = useState(false);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`「${dish.name}」を削除しますか？`)) {
            deleteMutation.mutate(dish.id!);
        }
    };

    const handleToggleDetails = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDetails(!showDetails);
    };

    // コスト効率の計算（仮想的な指標）
    const costEfficiency = useMemo(() => {
        const baseCost = 100; // 基準コスト
        const efficiency = Math.max(0, Math.min(100, ((baseCost / dish.total_cost) * 100)));
        return efficiency;
    }, [dish.total_cost]);

    const getEfficiencyColor = (efficiency: number) => {
        if (efficiency >= 80) return 'success';
        if (efficiency >= 60) return 'warning';
        return 'error';
    };

    return (
        <Card
            ref={drag}
            sx={{
                cursor: 'grab',
                opacity: isDragging ? 0.5 : 1,
                transform: isDragging ? 'rotate(3deg)' : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                },
                borderLeft: `4px solid ${getGenreColor(dish.genre)}`,
                position: 'relative',
                overflow: 'visible',
            }}
        >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ flexGrow: 1 }}>
                        {dish.name}
                    </Typography>
                    <Box display="flex" gap={0.5}>
                        <Tooltip title="詳細情報">
                            <IconButton 
                                size="small" 
                                color="info"
                                onClick={handleToggleDetails}
                            >
                                <InfoIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="編集">
                            <IconButton size="small" color="primary">
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="削除">
                            <IconButton
                                size="small"
                                color="error"
                                onClick={handleDelete}
                                disabled={deleteMutation.isLoading}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Chip
                        label={dish.genre}
                        size="small"
                        sx={{
                            bgcolor: getGenreColor(dish.genre),
                            color: 'white',
                            fontSize: '0.7rem',
                        }}
                    />
                    <Chip
                        label={`¥${dish.total_cost.toFixed(2)}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                </Box>

                {/* コスト効率インジケーター */}
                <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">
                            コスト効率
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">
                            {costEfficiency.toFixed(0)}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={costEfficiency}
                        color={getEfficiencyColor(costEfficiency) as any}
                        sx={{ height: 6, borderRadius: 3 }}
                    />
                </Box>

                {dish.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mb: 1
                    }}>
                        {dish.description}
                    </Typography>
                )}

                {/* 詳細情報（折りたたみ） */}
                <Collapse in={showDetails}>
                    <Box mt={2} p={1} bgcolor="grey.50" borderRadius={1}>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                            詳細情報
                        </Typography>
                        
                        {dish.ingredients && dish.ingredients.length > 0 ? (
                            <Box>
                                <Typography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                                    食材 ({dish.ingredients.length}種類)
                                </Typography>
                                {dish.ingredients.slice(0, 3).map((ing, index) => (
                                    <Typography key={index} variant="caption" display="block" color="text.secondary">
                                        • {ing.ingredient?.name} ({ing.used_quantity}{ing.ingredient?.unit})
                                    </Typography>
                                ))}
                                {dish.ingredients.length > 3 && (
                                    <Typography variant="caption" color="text.secondary">
                                        ... 他{dish.ingredients.length - 3}種類
                                    </Typography>
                                )}
                            </Box>
                        ) : (
                            <Typography variant="caption" color="text.secondary">
                                食材情報なし
                            </Typography>
                        )}
                        
                        <Box mt={1}>
                            <Typography variant="caption" color="text.secondary">
                                作成日: {new Date(dish.created_at!).toLocaleDateString()}
                            </Typography>
                        </Box>
                    </Box>
                </Collapse>

                {/* 使用頻度インジケーター */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                    <Typography variant="caption" color="text.secondary">
                        完成品で使用中
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <TrendingUpIcon fontSize="small" color="success" />
                        <Typography variant="caption" fontWeight="bold" color="success.main">
                            {Math.floor(Math.random() * 5) + 1} 件
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

const DishesPanel: React.FC<DishesPanelProps> = ({ dishes, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGenre, setSelectedGenre] = useState<string>('');
    const [costRange, setCostRange] = useState<'all' | 'low' | 'medium' | 'high'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'total_cost' | 'created_at'>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [showFilters, setShowFilters] = useState(false);

    // フィルタリングとソート
    const filteredAndSortedDishes = useMemo(() => {
        let filtered = dishes.filter((dish) => {
            const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                dish.description?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesGenre = !selectedGenre || dish.genre === selectedGenre;
            
            let matchesCostRange = true;
            if (costRange !== 'all') {
                if (costRange === 'low' && dish.total_cost > 200) matchesCostRange = false;
                if (costRange === 'medium' && (dish.total_cost <= 200 || dish.total_cost > 500)) matchesCostRange = false;
                if (costRange === 'high' && dish.total_cost <= 500) matchesCostRange = false;
            }
            
            return matchesSearch && matchesGenre && matchesCostRange;
        });

        // ソート
        filtered.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = (bValue as string).toLowerCase();
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    }, [dishes, searchTerm, selectedGenre, costRange, sortBy, sortOrder]);

    // 統計情報
    const stats = useMemo(() => {
        const totalDishes = filteredAndSortedDishes.length;
        const totalCost = filteredAndSortedDishes.reduce((sum, dish) => sum + dish.total_cost, 0);
        const avgCost = totalDishes > 0 ? totalCost / totalDishes : 0;

        const genreDistribution = filteredAndSortedDishes.reduce((acc, dish) => {
            acc[dish.genre] = (acc[dish.genre] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const costRanges = {
            low: filteredAndSortedDishes.filter(d => d.total_cost <= 200).length,
            medium: filteredAndSortedDishes.filter(d => d.total_cost > 200 && d.total_cost <= 500).length,
            high: filteredAndSortedDishes.filter(d => d.total_cost > 500).length,
        };

        return {
            totalDishes,
            totalCost,
            avgCost,
            genreDistribution,
            costRanges,
        };
    }, [filteredAndSortedDishes]);

    return (
        <Paper sx={{ p: 2, height: '80vh', display: 'flex', flexDirection: 'column' }}>
            {/* ヘッダー */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" color="secondary" fontWeight="bold">
                    🍳 料理一覧 ({stats.totalDishes})
                </Typography>
                <Box display="flex" gap={1}>
                    <Tooltip title="フィルター">
                        <IconButton
                            size="small"
                            onClick={() => setShowFilters(!showFilters)}
                            color={showFilters ? 'primary' : 'default'}
                        >
                            <FilterIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* 統計情報 */}
            <Box mb={2}>
                <Grid container spacing={1}>
                    <Grid item xs={4}>
                        <Box textAlign="center" p={1} bgcolor="secondary.light" borderRadius={1}>
                            <Typography variant="caption" color="white">
                                平均原価
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="white">
                                ¥{stats.avgCost.toFixed(0)}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={4}>
                        <Box textAlign="center" p={1} bgcolor="info.light" borderRadius={1}>
                            <Typography variant="caption" color="white">
                                低コスト
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="white">
                                {stats.costRanges.low}品
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={4}>
                        <Box textAlign="center" p={1} bgcolor="warning.light" borderRadius={1}>
                            <Typography variant="caption" color="white">
                                高コスト
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="white">
                                {stats.costRanges.high}品
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* 検索バー */}
            <TextField
                fullWidth
                size="small"
                placeholder="料理名・説明で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
                sx={{ mb: 1 }}
            />

            {/* フィルター */}
            <Collapse in={showFilters}>
                <Box mb={2} p={2} bgcolor="grey.50" borderRadius={1}>
                    <Grid container spacing={2}>
                        <Grid item xs={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>ジャンル</InputLabel>
                                <Select
                                    value={selectedGenre}
                                    label="ジャンル"
                                    onChange={(e) => setSelectedGenre(e.target.value)}
                                >
                                    <MenuItem value="">すべて</MenuItem>
                                    <MenuItem value="meat">肉類</MenuItem>
                                    <MenuItem value="vegetable">野菜</MenuItem>
                                    <MenuItem value="fish">魚類</MenuItem>
                                    <MenuItem value="soup">スープ</MenuItem>
                                    <MenuItem value="dessert">デザート</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>コスト範囲</InputLabel>
                                <Select
                                    value={costRange}
                                    label="コスト範囲"
                                    onChange={(e) => setCostRange(e.target.value as any)}
                                >
                                    <MenuItem value="all">すべて</MenuItem>
                                    <MenuItem value="low">低コスト (¥200以下)</MenuItem>
                                    <MenuItem value="medium">中コスト (¥200-500)</MenuItem>
                                    <MenuItem value="high">高コスト (¥500以上)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>並び順</InputLabel>
                                <Select
                                    value={`${sortBy}_${sortOrder}`}
                                    label="並び順"
                                    onChange={(e) => {
                                        const [field, order] = e.target.value.split('_');
                                        setSortBy(field as any);
                                        setSortOrder(order as any);
                                    }}
                                >
                                    <MenuItem value="name_asc">名前 (昇順)</MenuItem>
                                    <MenuItem value="name_desc">名前 (降順)</MenuItem>
                                    <MenuItem value="total_cost_asc">原価 (安い順)</MenuItem>
                                    <MenuItem value="total_cost_desc">原価 (高い順)</MenuItem>
                                    <MenuItem value="created_at_desc">作成日 (新しい順)</MenuItem>
                                    <MenuItem value="created_at_asc">作成日 (古い順)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Box>
            </Collapse>

            {/* 料理リスト */}
            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    pr: 1,
                }}
            >
                {filteredAndSortedDishes.length === 0 ? (
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        height="100%"
                        color="text.secondary"
                    >
                        <RestaurantIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                        <Typography variant="body1">
                            {searchTerm || selectedGenre !== '' || costRange !== 'all' 
                                ? '条件に一致する料理が見つかりません' 
                                : '料理がありません'}
                        </Typography>
                        {(searchTerm || selectedGenre !== '' || costRange !== 'all') ? (
                            <Button
                                size="small"
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedGenre('');
                                    setCostRange('all');
                                }}
                                sx={{ mt: 1 }}
                            >
                                フィルターをクリア
                            </Button>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                食材をドラッグして料理作成エリアで料理を作成してください
                            </Typography>
                        )}
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        {filteredAndSortedDishes.map((dish) => (
                            <Grid item xs={12} sm={6} md={4} key={dish.id}>
                                <DraggableDishCard dish={dish} />
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>

            {/* フッター情報 */}
            <Box mt={2} pt={1} borderTop="1px solid" borderColor="divider">
                <Typography variant="caption" color="text.secondary" textAlign="center">
                    料理をドラッグして完成品作成エリアにドロップしてください
                </Typography>
            </Box>
        </Paper>
    );
};

export default DishesPanel;