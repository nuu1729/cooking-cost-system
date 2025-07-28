import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    LinearProgress,
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { CompletedFood } from '../../types';
import { completedFoodApi } from '../../services/api';

interface CompletedFoodCardProps {
    food: CompletedFood;
    onUpdate?: () => void;
}

export const CompletedFoodCard: React.FC<CompletedFoodCardProps> = ({ food, onUpdate }) => {
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const queryClient = useQueryClient();

    // 削除ミューテーション
    const deleteMutation = useMutation({
        mutationFn: (id: number) => completedFoodApi.delete(id),
        onSuccess: () => {
        toast.success('完成品を削除しました');
        queryClient.invalidateQueries({ queryKey: ['completedFoods'] });
        onUpdate?.();
        },
        onError: (error: any) => {
        toast.error(error.response?.data?.message || '削除に失敗しました');
        },
    });

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchor(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
    };

    const handleDelete = () => {
        if (window.confirm(`「${food.name}」を削除しますか？`)) {
        deleteMutation.mutate(food.id!);
        }
        handleMenuClose();
    };

    // 利益計算
    const profit = food.price ? food.price - food.total_cost : 0;
    const profitRate = food.price ? (profit / food.price) * 100 : 0;

    // 利益率の色とアイコン
    const getProfitColor = (rate: number) => {
        if (rate > 30) return 'success';
        if (rate > 15) return 'warning';
        return 'error';
    };

    const getProfitIcon = (rate: number) => {
        if (rate > 30) return <TrendingUpIcon fontSize="small" />;
        if (rate > 15) return <TrendingFlatIcon fontSize="small" />;
        return <TrendingDownIcon fontSize="small" />;
    };

    return (
        <Card
        sx={{
            transition: 'all 0.2s ease',
            '&:hover': {
            transform: 'translateY(-2px)',
            },
        }}
        >
        <CardContent sx={{ pb: '16px !important' }}>
            {/* ヘッダー */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Typography variant="h6" component="div" noWrap sx={{ flex: 1, mr: 1 }}>
                {food.name}
            </Typography>
            <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{ mt: -1, mr: -1 }}
            >
                <MoreVertIcon />
            </IconButton>
            </Box>

            {/* 価格情報 */}
            <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="body2" color="text.secondary">
                販売価格
                </Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">
                {food.price ? `¥${food.price.toLocaleString()}` : '未設定'}
                </Typography>
            </Box>
            
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="body2" color="text.secondary">
                原価
                </Typography>
                <Typography variant="body1" color="error">
                ¥{food.total_cost.toFixed(2)}
                </Typography>
            </Box>

            {food.price && (
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="text.secondary">
                    利益
                </Typography>
                <Typography 
                    variant="body1" 
                    color={profit > 0 ? 'success.main' : 'error.main'}
                    fontWeight="bold"
                >
                    ¥{profit.toFixed(2)}
                </Typography>
                </Box>
            )}
            </Box>

            {/* 利益率 */}
            {food.price && (
            <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="body2" color="text.secondary">
                    利益率
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                    {getProfitIcon(profitRate)}
                    <Chip
                    label={`${profitRate.toFixed(1)}%`}
                    size="small"
                    color={getProfitColor(profitRate) as any}
                    variant="outlined"
                    />
                </Box>
                </Box>
                
                <LinearProgress
                variant="determinate"
                value={Math.min(profitRate, 100)}
                color={getProfitColor(profitRate) as any}
                sx={{ height: 6, borderRadius: 3 }}
                />
            </Box>
            )}

            {/* 説明 */}
            {food.description && (
            <Box mt={1}>
                <Typography variant="body2" color="text.secondary" noWrap>
                {food.description}
                </Typography>
            </Box>
            )}

            {/* メニュー */}
            <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
            >
            <MenuItem onClick={handleMenuClose}>
                <ListItemIcon>
                <EditIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>編集</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>削除</ListItemText>
            </MenuItem>
            </Menu>
        </CardContent>
        </Card>
    );
};
