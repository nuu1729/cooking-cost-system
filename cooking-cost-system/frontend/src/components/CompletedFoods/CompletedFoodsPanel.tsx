import React, { useState, useMemo } from 'react';
import {
    Paper,
    Typography,
    Box,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    List,
    ListItem,
    Divider,
    IconButton,
    Tooltip,
    Badge,
    LinearProgress,
    useTheme,
} from '@mui/material';
import {
    Search as SearchIcon,
    LocalDining as LocalDiningIcon,
    Sort as SortIcon,
    Clear as ClearIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Remove as RemoveIcon,
} from '@mui/icons-material';

import { CompletedFood } from '../../types';
import { getProfitRateColor } from '../../theme';

interface CompletedFoodsPanelProps {
    completedFoods: CompletedFood[];
    onRefresh: () => void;
}

interface CompletedFoodItemProps {
    food: CompletedFood;
}

const CompletedFoodItem: React.FC<CompletedFoodItemProps> = ({ food }) => {
    const theme = useTheme();
    
    const profit = food.price ? food.price - food.total_cost : null;
    const profitRate = food.price && food.price > 0 ? ((food.price - food.total_cost) / food.price) * 100 : null;

    const getProfitIcon = (rate: number | null) => {
        if (rate === null) return <RemoveIcon fontSize="small" />;
        if (rate >= 20) return <TrendingUpIcon fontSize="small" color="success" />;
        if (rate >= 10) return <TrendingUpIcon fontSize="small" color="warning" />;
        return <TrendingDownIcon fontSize="small" color="error" />;
    };

    const getProfitLabel = (rate: number | null) => {
        if (rate === null) return '未設定';
        if (rate >= 30) return '優秀';
        if (rate >= 20) return '良好';
        if (rate >= 10) return '普通';
        if (rate >= 0) return '改善要';
        return '赤字';
    };

    return (
        <ListItem
            sx={{
                border: `1px solid ${theme.palette.grey[200]}`,
                borderRadius: 1,
                mb: 1,
                bgcolor: 'background.paper',
                '&:hover': {
                    bgcolor: 'grey.50',
                    borderColor: 'success.main',
                    transform: 'translateY(-1px)',
                    boxShadow: theme.shadows[2],
                },
                transition: 'all 0.2s ease',
            }}
        >
            <Box sx={{ width: '100%' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" fontWeight="bold" noWrap sx={{ flex: 1 }}>
                        {food.name}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5}>
                        {getProfitIcon(profitRate)}
                        <Chip
                            label={getProfitLabel(profitRate)}
                            size="small"
                            sx={{
                                backgroundColor: profitRate !== null ? getProfitRateColor(profitRate) : theme.palette.grey[400],
                                color: 'white',
                                fontSize: '0.7rem',
                                height: 20,
                                '& .MuiChip-label': {
                                    px: 0.5,
                                },
                            }}
                        />
                    </Box>
                </Box>
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                            原価: ¥{food.total_cost.toFixed(2)}
                        </Typography>
                        {food.price && (
                            <Typography variant="caption" color="text.secondary" display="block">
                                販売価格: ¥{food.price.toFixed(2)}
                            </Typography>
                        )}
                    </Box>
                    <Box textAlign="right">
                        {profit !== null && (
                            <Typography 
                                variant="caption" 
                                fontWeight="bold" 
                                color={profit >= 0 ? 'success.main' : 'error.main'}
                                display="block"
                            >
                                利益: ¥{profit.toFixed(2)}
                            </Typography>
                        )}
                        {profitRate !== null && (
                            <Typography 
                                variant="caption" 
                                fontWeight="bold" 
                                color={profitRate >= 20 ? 'success.main' : profitRate >= 10 ? 'warning.main' : 'error.main'}
                                display="block"
                            >
                                {profitRate.toFixed(1)}%
                            </Typography>
                        )}
                    </Box>
                </Box>
                
                {profitRate !== null && (
                    <Box sx={{ width: '100%', mb: 0.5 }}>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(profitRate, 100)}
                            sx={{
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: theme.palette.grey[200],
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: getProfitRateColor(profitRate),
                                    borderRadius: 2,
                                },
                            }}
                        />
                    </Box>
                )}
                
                {food.description && (
                    <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {food.description}
                    </Typography>
                )}
                
                {food.dishes && (
                    <Box mt={0.5}>
                        <Typography variant="caption" color="text.secondary">
                            料理数: {food.dishes.length}件
                        </Typography>
                    </Box>
                )}
            </Box>
        </ListItem>
    );
};

const CompletedFoodsPanel: React.FC<CompletedFoodsPanelProps> = ({ completedFoods, onRefresh }) => {
    const theme = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [profitabilityFilter, setProfitabilityFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'name' | 'price' | 'total_cost' | 'profit_rate' | 'created_at'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // フィルタリングとソート
    const filteredAndSortedFoods = useMemo(() => {
        let filtered = completedFoods.filter(food => {
            const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (food.description && food.description.toLowerCase().includes(searchTerm.toLowerCase()));
            
            if (profitabilityFilter === 'all') return matchesSearch;
            
            const profitRate = food.price && food.price > 0 ? ((food.price - food.total_cost) / food.price) * 100 : null;
            
            switch (profitabilityFilter) {
                case 'excellent': return matchesSearch && profitRate !== null && profitRate >= 30;
                case 'good': return matchesSearch && profitRate !== null && profitRate >= 20 && profitRate < 30;
                case 'average': return matchesSearch && profitRate !== null && profitRate >= 10 && profitRate < 20;
                case 'poor': return matchesSearch && profitRate !== null && profitRate >= 0 && profitRate < 10;
                case 'loss': return matchesSearch && profitRate !== null && profitRate < 0;
                case 'no_price': return matchesSearch && !food.price;
                default: return matchesSearch;
            }
        });

        // ソート
        filtered.sort((a, b) => {
            let aValue: any;
            let bValue: any;
            
            if (sortBy === 'profit_rate') {
                aValue = a.price && a.price > 0 ? ((a.price - a.total_cost) / a.price) * 100 : -999;
                bValue = b.price && b.price > 0 ? ((b.price - b.total_cost) / b.price) * 100 : -999;
            } else {
                aValue = a[sortBy];
                bValue = b[sortBy];
            }
            
            if (sortBy === 'created_at') {
                aValue = new Date(aValue).getTime();
                bValue = new Date(bValue).getTime();
            }
            
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            
            if (sortOrder === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

        return filtered;
    }, [completedFoods, searchTerm, profitabilityFilter, sortBy, sortOrder]);

    const handleClearFilters = () => {
        setSearchTerm('');
        setProfitabilityFilter('all');
        setSortBy('name');
        setSortOrder('asc');
    };

    const hasActiveFilters = searchTerm || profitabilityFilter !== 'all' || sortBy !== 'name' || sortOrder !== 'asc';

    // 統計情報
    const stats = useMemo(() => {
        if (filteredAndSortedFoods.length === 0) return null;
        
        const foodsWithPrice = filteredAndSortedFoods.filter(food => food.price);
        const totalRevenue = foodsWithPrice.reduce((sum, food) => sum + (food.price || 0), 0);
        const totalCost = filteredAndSortedFoods.reduce((sum, food) => sum + food.total_cost, 0);
        const totalProfit = foodsWithPrice.reduce((sum, food) => sum + ((food.price || 0) - food.total_cost), 0);
        const avgProfitRate = foodsWithPrice.length > 0 
            ? foodsWithPrice.reduce((sum, food) => {
                const rate = ((food.price || 0) - food.total_cost) / (food.price || 1) * 100;
                return sum + rate;
            }, 0) / foodsWithPrice.length
            : 0;
        
        return { totalRevenue, totalCost, totalProfit, avgProfitRate, foodsWithPrice: foodsWithPrice.length };
    }, [filteredAndSortedFoods]);

    return (
        <Paper sx={{ p: 2, height: '80vh', display: 'flex', flexDirection: 'column' }}>
            {/* ヘッダー */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" color="success" fontWeight="bold">
                    🏆 完成品一覧
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                    <Badge badgeContent={filteredAndSortedFoods.length} color="success">
                        <Chip
                            label={`${completedFoods.length}件`}
                            size="small"
                            color="success"
                            variant="outlined"
                        />
                    </Badge>
                    {stats && (
                        <Tooltip title={`平均利益率: ${stats.avgProfitRate.toFixed(1)}%\n総売上: ¥${stats.totalRevenue.toFixed(0)}\n総利益: ¥${stats.totalProfit.toFixed(0)}`}>
                            <Chip
                                label={`${stats.avgProfitRate.toFixed(1)}%`}
                                size="small"
                                sx={{
                                    backgroundColor: getProfitRateColor(stats.avgProfitRate),
                                    color: 'white',
                                }}
                            />
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {/* 検索・フィルター */}
            <Box mb={2}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="完成品名・説明で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ mb: 1 }}
                />
                
                <Box display="flex" gap={1} alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 120, flex: 1 }}>
                        <InputLabel>利益率</InputLabel>
                        <Select
                            value={profitabilityFilter}
                            label="利益率"
                            onChange={(e) => setProfitabilityFilter(e.target.value)}
                        >
                            <MenuItem value="all">全て</MenuItem>
                            <MenuItem value="excellent">優秀 (30%以上)</MenuItem>
                            <MenuItem value="good">良好 (20-30%)</MenuItem>
                            <MenuItem value="average">普通 (10-20%)</MenuItem>
                            <MenuItem value="poor">改善要 (0-10%)</MenuItem>
                            <MenuItem value="loss">赤字 (0%未満)</MenuItem>
                            <MenuItem value="no_price">価格未設定</MenuItem>
                        </Select>
                    </FormControl>
                    
                    <FormControl size="small" sx={{ minWidth: 100, flex: 1 }}>
                        <InputLabel>並び順</InputLabel>
                        <Select
                            value={sortBy}
                            label="並び順"
                            onChange={(e) => setSortBy(e.target.value as any)}
                        >
                            <MenuItem value="name">名前</MenuItem>
                            <MenuItem value="profit_rate">利益率</MenuItem>
                            <MenuItem value="price">販売価格</MenuItem>
                            <MenuItem value="total_cost">原価</MenuItem>
                            <MenuItem value="created_at">作成日</MenuItem>
                        </Select>
                    </FormControl>
                    
                    <Tooltip title={sortOrder === 'asc' ? '昇順' : '降順'}>
                        <IconButton
                            size="small"
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            color="success"
                        >
                            <SortIcon
                                sx={{
                                    transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                                    transition: 'transform 0.2s',
                                }}
                            />
                        </IconButton>
                    </Tooltip>
                    
                    {hasActiveFilters && (
                        <Tooltip title="フィルタークリア">
                            <IconButton size="small" onClick={handleClearFilters} color="error">
                                <ClearIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {/* 完成品リスト */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {filteredAndSortedFoods.length === 0 ? (
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        sx={{ height: '100%', color: 'text.secondary' }}
                    >
                        <LocalDiningIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                        <Typography variant="body2" textAlign="center">
                            {searchTerm || profitabilityFilter !== 'all' 
                                ? '検索条件に一致する完成品がありません' 
                                : '完成品がありません\n料理をドラッグして完成品を作成してください'
                            }
                        </Typography>
                    </Box>
                ) : (
                    <List dense sx={{ p: 0 }}>
                        {filteredAndSortedFoods.map((food, index) => (
                            <React.Fragment key={food.id}>
                                <CompletedFoodItem food={food} />
                                {index < filteredAndSortedFoods.length - 1 && (
                                    <Divider sx={{ my: 0.5 }} />
                                )}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Box>

            {/* フッター情報 */}
            <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary" textAlign="center">
                    利益率の高い完成品作りを目指しましょう
                </Typography>
            </Box>
        </Paper>
    );
};

export default CompletedFoodsPanel;