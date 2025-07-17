import React, { useState } from 'react';
import {
    Paper,
    Typography,
    Box,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Divider,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useDrop } from 'react-dnd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { Ingredient, DragItem } from '../types';
import { dishApi } from '../services/api';

interface DishBuilderProps {
    ingredients: Ingredient[];
    onDishCreated: () => void;
}

interface DishIngredientItem {
    ingredient: Ingredient;
    usedQuantity: number;
    usedCost: number;
}

const DishBuilder: React.FC<DishBuilderProps> = ({ ingredients, onDishCreated }) => {
    const [dishName, setDishName] = useState('');
    const [dishIngredients, setDishIngredients] = useState<DishIngredientItem[]>([]);
    const [quantityModal, setQuantityModal] = useState<{
        open: boolean;
        ingredient: Ingredient | null;
        quantity: string;
    }>({ open: false, ingredient: null, quantity: '' });

    const queryClient = useQueryClient();

    const createDishMutation = useMutation({
        mutationFn: dishApi.create,
        onSuccess: () => {
            toast.success('料理を作成しました');
            queryClient.invalidateQueries({ queryKey: ['dishes'] });
            setDishName('');
            setDishIngredients([]);
            onDishCreated();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || '料理作成に失敗しました');
        },
    });

    const [{ isOver }, drop] = useDrop({
        accept: 'ingredient',
        drop: (item: DragItem) => {
            const ingredient = item.item as Ingredient;
            const existingIndex = dishIngredients.findIndex(di => di.ingredient.id === ingredient.id);
            
            if (existingIndex !== -1) {
                toast.error('この食材は既に追加されています');
                return;
            }

            setQuantityModal({
                open: true,
                ingredient,
                quantity: '',
            });
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    const handleQuantitySubmit = () => {
        if (!quantityModal.ingredient || !quantityModal.quantity) return;

        const quantity = parseFloat(quantityModal.quantity);
        if (quantity <= 0) {
            toast.error('使用量は0より大きい値を入力してください');
            return;
        }

        const usedCost = quantityModal.ingredient.unit_price * quantity;
        
        setDishIngredients(prev => [...prev, {
            ingredient: quantityModal.ingredient!,
            usedQuantity: quantity,
            usedCost,
        }]);

        setQuantityModal({ open: false, ingredient: null, quantity: '' });
        toast.success('食材を追加しました');
    };

    const removeIngredient = (index: number) => {
        setDishIngredients(prev => prev.filter((_, i) => i !== index));
    };

    const totalCost = dishIngredients.reduce((sum, item) => sum + item.usedCost, 0);

    const handleCreateDish = () => {
        if (!dishName.trim()) {
            toast.error('料理名を入力してください');
            return;
        }

        if (dishIngredients.length === 0) {
            toast.error('食材を追加してください');
            return;
        }

        createDishMutation.mutate({
            name: dishName,
            ingredients: dishIngredients.map(item => ({
                ingredient_id: item.ingredient.id!,
                used_quantity: item.usedQuantity,
            })),
        });
    };

    return (
        <Paper sx={{ p: 2, height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" color="primary" fontWeight="bold" mb={2}>
                🍳 料理作成
            </Typography>

            <TextField
                fullWidth
                label="料理名"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                sx={{ mb: 2 }}
            />

            <Box
                ref={drop}
                sx={{
                    flexGrow: 1,
                    border: '2px dashed',
                    borderColor: isOver ? 'primary.main' : 'grey.300',
                    borderRadius: 2,
                    p: 2,
                    mb: 2,
                    backgroundColor: isOver ? 'primary.light' : 'transparent',
                    opacity: isOver ? 0.8 : 1,
                    transition: 'all 0.2s ease',
                    overflowY: 'auto',
                }}
            >
                {dishIngredients.length === 0 ? (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                        py={4}
                    >
                        食材をここにドラッグ&ドロップしてください
                    </Typography>
                ) : (
                    <List dense>
                        {dishIngredients.map((item, index) => (
                            <React.Fragment key={index}>
                                <ListItem>
                                    <ListItemText
                                        primary={item.ingredient.name}
                                        secondary={`${item.usedQuantity}${item.ingredient.unit} - ¥${item.usedCost.toFixed(2)}`}
                                    />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        onClick={() => removeIngredient(index)}
                                        color="error"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                            {index < dishIngredients.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>
            )}
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" color="error">
                合計原価: ¥{totalCost.toFixed(2)}
            </Typography>
        </Box>

        <Button
            variant="contained"
            fullWidth
            onClick={handleCreateDish}
            disabled={!dishName.trim() || dishIngredients.length === 0 || createDishMutation.isLoading}
        >
            {createDishMutation.isLoading ? '作成中...' : '料理を作成'}
        </Button>

        {/* 使用量入力モーダル */}
        {quantityModal.open && (
            <Box
                position="fixed"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bgcolor="rgba(0,0,0,0.5)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                zIndex={1300}
            >
                <Paper sx={{ p: 3, minWidth: 300 }}>
                    <Typography variant="h6" mb={2}>
                        {quantityModal.ingredient?.name} の使用量
                    </Typography>
                <TextField
                    fullWidth
                    label={`使用量 (${quantityModal.ingredient?.unit})`}
                    type="number"
                    value={quantityModal.quantity}
                    onChange={(e) => setQuantityModal(prev => ({ ...prev, quantity: e.target.value }))}
                    sx={{ mb: 2 }}
                />
                <Box display="flex" gap={1}>
                    <Button
                        variant="contained"
                        onClick={handleQuantitySubmit}
                        fullWidth
                    >
                        追加
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => setQuantityModal({ open: false, ingredient: null, quantity: '' })}
                        fullWidth
                    >
                        キャンセル
                    </Button>
                </Box>
            </Paper>
        </Box>
        )}
    </Paper>
    );
};

export default DishBuilder;
