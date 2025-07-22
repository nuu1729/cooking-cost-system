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
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Sort as SortIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    LocalDining as LocalDiningIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useDrag } from 'react-dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { Ingredient, GENRE_INFO } from '../../types';
import { ingredientApi } from '../../services/api';
import { getGenreColor } from '../../theme';

interface IngredientsPanelProps {
    ingredients: Ingredient[];
    onRefresh: () => void;
}

// ドラッグ可能な食材カード
const DraggableIngredientCard: React.FC<{ ingredient: Ingredient }> = ({ ingredient }) => {
    const [{ isDragging }, drag] = useDrag({
        type: 'ingredient',
        item: { type: 'ingredient', item: ingredient, id: ingredient.id },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: (id: number) => ingredientApi.delete(id),
        onSuccess: () => {
            toast.success('食材を削除しました');
            queryClient.invalidateQueries({ queryKey: ['ingredients'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || '削除に失敗しました');
        },
    });

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`「${ingredient.name}」を削除しますか？`)) {
            deleteMutation.mutate(ingredient.id!);
        }
    };

    const genreInfo = GENRE_INFO[ingredient.genre];

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
                borderLeft: `4px solid ${getGenreColor(ingredient.genre)}`,
            }}
        >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ flexGrow: 1 }}>
                        {ingredient.name}
                    </Typography>
                    <Box display="flex" gap={0.5}>
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
                        label={genreInfo.name}
                        size="small"
                        sx={{
                            bgcolor: getGenreColor(ingredient.genre),
                            color: 'white',
                            fontSize: '0.7rem',
                        }}
                    />
                    <Typography variant="caption" color="text.secondary">
                        {ingredient.store}
                    </Typography>
                </Box>

                <Grid container spacing={1} sx={{ fontSize: '0.75rem' }}>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                            購入量
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                            {ingredient.quantity}{ingredient.unit}
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                            価格
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                            ¥{ingredient.price}
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                            単価
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                            ¥{ingredient.unit_price.toFixed(2)}/{ingredient.unit}
                        </Typography>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

const IngredientsPanel: React.FC<IngredientsPanelProps> = ({ ingredients, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGenre, setSelectedGenre] = useState<string>('');
    const [sortBy, setSortBy] = useState<'name' | 'price' | 'unit_price' | 'created_at'>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // フィルタリングとソート
    const filteredAndSortedIngredients = useMemo(() => {
        let filtered = ingredients.filter((ingredient) => {
            const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                ingredient.store.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesGenre = !selectedGenre || ingredient.genre === selectedGenre;
            return matchesSearch && matchesGenre;
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
    }, [ingredients, searchTerm, selectedGenre, sortBy, sortOrder]);

    // 統計情報
    const stats = useMemo(() => {
        const totalIngredients = filteredAndSortedIngredients.length;
        const totalValue = filteredAndSortedIngredients.reduce((sum, ing) => sum + ing.price, 0);
        const avgUnitPrice = filteredAndSortedIngredients.length > 0
            ? filteredAndSortedIngredients.reduce((sum, ing) => sum + ing.unit_price, 0) / filteredAndSortedIngredients.length
            : 0;

        const genreDistribution = filteredAndSortedIngredients.reduce((acc, ing) => {
            acc[ing.genre] = (acc[ing.genre] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalIngredients,
            totalValue,
            avgUnitPrice,
            genreDistribution,
        };
    }, [filteredAndSortedIngredients]);

    return (
        <Paper sx={{ p: 2, height: '80vh', display: 'flex', flexDirection: 'column' }}>
            {/* ヘッダー */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" color="primary" fontWeight="bold">
                    🛒 食材一覧 ({stats.totalIngredients})
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
                    <Tooltip title="表示切替">
                        <IconButton
                            size="small"
                            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        >
                            <ViewIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* 統計情報 */}
            <Box mb={2}>
                <Grid container spacing={1}>
                    <Grid item xs={4}>
                        <Box textAlign="center" p={1} bgcolor="primary.light" borderRadius={1}>
                            <Typography variant="caption" color="white">
                                総価値
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="white">
                                ¥{stats.totalValue.toLocaleString()}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={4}>
                        <Box textAlign="center" p={1} bgcolor="secondary.light" borderRadius={1}>
                            <Typography variant="caption" color="white">
                                平均単価
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="white">
                                ¥{stats.avgUnitPrice.toFixed(2)}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={4}>
                        <Box textAlign="center" p={1} bgcolor="success.light" borderRadius={1}>
                            <Typography variant="caption" color="white">
                                ジャンル数
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="white">
                                {Object.keys(stats.genreDistribution).length}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* 検索バー */}
            <TextField
                fullWidth
                size="small"
                placeholder="食材名・店舗名で検索..."
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
                        <Grid item xs={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>ジャンル</InputLabel>
                                <Select
                                    value={selectedGenre}
                                    label="ジャンル"
                                    onChange={(e) => setSelectedGenre(e.target.value)}
                                >
                                    <MenuItem value="">すべて</MenuItem>
                                    {Object.entries(GENRE_INFO).map(([key, info]) => (
                                        <MenuItem key={key} value={key}>
                                            {info.icon} {info.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
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
                                    <MenuItem value="price_asc">価格 (安い順)</MenuItem>
                                    <MenuItem value="price_desc">価格 (高い順)</MenuItem>
                                    <MenuItem value="unit_price_asc">単価 (安い順)</MenuItem>
                                    <MenuItem value="unit_price_desc">単価 (高い順)</MenuItem>
                                    <MenuItem value="created_at_desc">作成日 (新しい順)</MenuItem>
                                    <MenuItem value="created_at_asc">作成日 (古い順)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Box>
            </Collapse>

            {/* 食材リスト */}
            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    pr: 1,
                }}
            >
                {filteredAndSortedIngredients.length === 0 ? (
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        height="100%"
                        color="text.secondary"
                    >
                        <LocalDiningIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                        <Typography variant="body1">
                            {searchTerm || selectedGenre ? '条件に一致する食材が見つかりません' : '食材がありません'}
                        </Typography>
                        {searchTerm || selectedGenre ? (
                            <Button
                                size="small"
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedGenre('');
                                }}
                                sx={{ mt: 1 }}
                            >
                                フィルターをクリア
                            </Button>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                右下の + ボタンから食材を追加してください
                            </Typography>
                        )}
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        {filteredAndSortedIngredients.map((ingredient) => (
                            <Grid
                                item
                                xs={viewMode === 'grid' ? 12 : 12}
                                sm={viewMode === 'grid' ? 6 : 12}
                                md={viewMode === 'grid' ? 4 : 12}
                                key={ingredient.id}
                            >
                                <DraggableIngredientCard ingredient={ingredient} />
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>

            {/* フッター情報 */}
            <Box mt={2} pt={1} borderTop="1px solid" borderColor="divider">
                <Typography variant="caption" color="text.secondary" textAlign="center">
                    食材をドラッグして料理作成エリアにドロップしてください
                </Typography>
            </Box>
        </Paper>
    );
};

export default IngredientsPanel;