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
    Collapse,
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon,
    Restaurant as RestaurantIcon,
} from '@mui/icons-material';
import { useDrag } from 'react-dnd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { Dish } from '../../types';
import { dishApi } from '../../services/api';

interface DishCardProps {
    dish: Dish;
    onUpdate?: () => void;
}

export const DishCard: React.FC<DishCardProps> = ({ dish, onUpdate }) => {
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [expanded, setExpanded] = useState(false);
    const queryClient = useQueryClient();

    // ドラッグ機能
    const [{ isDragging }, drag] = useDrag({
        type: 'dish',
        item: { type: 'dish', item: dish, id: dish.id },
        collect: (monitor) => ({
        isDragging: monitor.isDragging(),
        }),
    });

    // 削除ミューテーション
    const deleteMutation = useMutation({
        mutationFn: (id: number) => dishApi.delete(id),
        onSuccess: () => {
        toast.success('料理を削除しました');
        queryClient.invalidateQueries({ queryKey: ['dishes'] });
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
        if (window.confirm(`「${dish.name}」を削除しますか？`)) {
        deleteMutation.mutate(dish.id!);
        }
        handleMenuClose();
    };

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
                {dish.name}
            </Typography>
            <Box>
                <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                sx={{
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                }}
                >
                <ExpandMoreIcon />
                </IconButton>
                <IconButton
                size="small"
                onClick={handleMenuOpen}
                >
                <MoreVertIcon />
                </IconButton>
            </Box>
            </Box>

            {/* ジャンルチップ */}
            <Box mb={1}>
            <Chip
                label={dish.genre}
                size="small"
                color="primary"
                variant="outlined"
            />
            </Box>

            {/* 原価情報 */}
            <Box display="flex" alignItems="center" mb={1}>
            <RestaurantIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
                料理原価
            </Typography>
            </Box>

            <Typography variant="h6" color="error" fontWeight="bold">
            ¥{dish.total_cost.toFixed(2)}
            </Typography>

            {/* 説明（展開時） */}
            <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box mt={1}>
                {dish.description && (
                <Typography variant="body2" color="text.secondary">
                    {dish.description}
                </Typography>
                )}
                {(dish as any).ingredients && (
                <Box mt={1}>
                    <Typography variant="caption" color="text.secondary">
                    食材: {(dish as any).ingredients.length}種類
                    </Typography>
                </Box>
                )}
            </Box>
            </Collapse>

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
