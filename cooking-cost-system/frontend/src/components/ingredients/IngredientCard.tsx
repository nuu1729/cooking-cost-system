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
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Store as StoreIcon,
} from '@mui/icons-material';
import { useDrag } from 'react-dnd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { Ingredient, GENRE_INFO } from '../../types';
import { ingredientApi } from '../../services/api';
import { getGenreColor } from '../../theme';

interface IngredientCardProps {
    ingredient: Ingredient;
    onUpdate?: () => void;
}

export const IngredientCard: React.FC<IngredientCardProps> = ({ ingredient, onUpdate }) => {
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const queryClient = useQueryClient();

    // ドラッグ機能
    const [{ isDragging }, drag] = useDrag({
        type: 'ingredient',
        item: { type: 'ingredient', item: ingredient, id: ingredient.id },
        collect: (monitor) => ({
        isDragging: monitor.isDragging(),
        }),
    });

    // 削除ミューテーション
    const deleteMutation = useMutation({
        mutationFn: (id: number) => ingredientApi.delete(id),
        onSuccess: () => {
        toast.success('食材を削除しました');
        queryClient.invalidateQueries({ queryKey: ['ingredients'] });
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
        if (window.confirm(`「${ingredient.name}」を削除しますか？`)) {
        deleteMutation.mutate(ingredient.id!);
        }
        handleMenuClose();
    };

    const genreInfo = GENRE_INFO[ingredient.genre];

    return (
        <Card
        ref={drag}
        sx={{
            cursor: isDragging ? 'grabbing' : 'grab',
            opacity: isDragging ? 0.5 : 1,
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
                {ingredient.name}
            </Typography>
            <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{ mt: -1, mr: -1 }}
            >
                <MoreVertIcon />
            </IconButton>
            </Box>

            {/* ジャンルチップ */}
            <Box mb={1}>
            <Chip
                label={`${genreInfo.icon} ${genreInfo.name}`}
                size="small"
                sx={{
                backgroundColor: getGenreColor(ingredient.genre) + '20',
                color: getGenreColor(ingredient.genre),
                fontWeight: 500,
                }}
            />
            </Box>

            {/* 店舗情報 */}
            <Box display="flex" alignItems="center" mb={1}>
            <StoreIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary" noWrap>
                {ingredient.store}
            </Typography>
            </Box>

            {/* 数量・価格情報 */}
            <Box>
            <Typography variant="body2" color="text.secondary">
                {ingredient.quantity}{ingredient.unit} - ¥{ingredient.price.toLocaleString()}
            </Typography>
            <Typography variant="h6" color="primary" fontWeight="bold">
                ¥{ingredient.unit_price.toFixed(2)}/{ingredient.unit}
            </Typography>
            </Box>

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