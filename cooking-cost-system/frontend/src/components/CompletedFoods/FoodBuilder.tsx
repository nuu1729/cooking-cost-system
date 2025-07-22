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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    InputAdornment,
    Chip,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useDrop } from 'react-dnd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { Dish, DragItem, USAGE_UNIT_INFO } from '../../types';
import { completedFoodApi } from '../../services/api';

interface FoodBuilderProps {
    dishes: Dish[];
    onFoodCreated: () => void;
}

interface FoodDishItem {
    dish: Dish;
    usageQuantity: number;
    usageUnit: 'ratio' | 'serving';
    usageCost: number;
    description?: string;
}

const FoodBuilder: React.FC<FoodBuilderProps> = ({ dishes, onFoodCreated }) => {
    const [foodName, setFoodName] = useState('');
    const [foodPrice, setFoodPrice] = useState<number | ''>('');
    const [foodDescription, setFoodDescription] = useState('');
    const [foodDishes, setFoodDishes] = useState<FoodDishItem[]>([]);
    const [quantityModal, setQuantityModal] = useState<{
        open: boolean;
        dish: Dish | null;
        quantity: string;
        unit: 'ratio' | 'serving';
        description: string;
    }>({ open: false, dish: null, quantity: '', unit: 'ratio', description: '' });

    const queryClient = useQueryClient();

    const createFoodMutation = useMutation({
        mutationFn: completedFoodApi.create,
        onSuccess: () => {
            toast.success('完成品を作成しました');
            queryClient.invalidateQueries({ queryKey: ['completedFoods'] });
            setFoodName('');
            setFoodPrice('');
            setFoodDescription('');
            setFoodDishes([]);
            onFoodCreated();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || '完成品作成に失敗しました');
        },
    });

    const [{ isOver }, drop] = useDrop({
        accept: 'dish',
        drop: (item: DragItem) => {
            const dish = item.item as Dish;
            const existingIndex = foodDishes.findIndex(fd => fd.dish.id === dish.id);
            
            if (existingIndex !== -1) {
                toast.error('この料理は既に追加されています');
                return;
            }

            setQuantityModal({
                open: true,
                dish,
                quantity: '1',
                unit: 'ratio',
                description: '',
            });
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    const handleQuantitySubmit = () => {
        if (!quantityModal.dish || !quantityModal.quantity) return;

        const quantity = parseFloat(quantityModal.quantity);
        if (quantity <= 0) {
            toast.error('使用量は0より大きい値を入力してください');
            return;
        }

        let usageCost: number;
        if (quantityModal.unit === 'ratio') {
            usageCost = quantityModal.dish.total_cost * quantity;
        } else { // serving
            usageCost = quantityModal.dish.total_cost * quantity;
        }
        
        setFoodDishes(prev => [...prev, {
            dish: quantityModal.dish!,
            usageQuantity: quantity,
            usageUnit: quantityModal.unit,
            usageCost,
            description: quantityModal.description || undefined,
        }]);

        setQuantityModal({ open: false, dish: null, quantity: '', unit: 'ratio', description: '' });
        toast.success('料理を追加しました');
    };

    const removeDish = (index: number) => {
        setFoodDishes(prev => prev.filter((_, i) => i !== index));
    };

    const updateDishQuantity = (index: number, newQuantity: number) => {
        if (newQuantity <= 0) return;
        
        setFoodDishes(prev => prev.map((item, i) => {
            if (i === index) {
                const usageCost = item.usageUnit === 'ratio' 
                    ? item.dish.total_cost * newQuantity
                    : item.dish.total_cost * newQuantity;
                return { ...item, usageQuantity: newQuantity, usageCost };
            }
            return item;
        }));
    };

    const totalCost = foodDishes.reduce((sum, item) => sum + item.usageCost, 0);
    const profit = typeof foodPrice === 'number' && foodPrice > 0 ? foodPrice - totalCost : null;
    const profitRate = profit !== null && typeof foodPrice === 'number' && foodPrice > 0 
        ? (profit / foodPrice) * 100 
        : null;

    const handleCreateFood = () => {
        if (!foodName.trim()) {
            toast.error('完成品名を入力してください');
            return;
        }

        if (foodDishes.length === 0) {
            toast.error('料理を追加してください');
            return;
        }

        createFoodMutation.mutate({
            name: foodName,
            price: typeof foodPrice === 'number' ? foodPrice : undefined,
            description: foodDescription || undefined,
            dishes: foodDishes.map(item => ({
                dish_id: item.dish.id!,
                usage_quantity: item.usageQuantity,
                usage_unit: item.usageUnit,
                description: item.description,
            })),
        });
    };

    const getProfitRateColor = (rate: number) => {
        if (rate >= 30) return 'success';
        if (rate >= 20) return 'info';
        if (rate >= 10) return 'warning';
        return 'error';
    };

    return (
        <Paper sx={{ p: 2, height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" color="success" fontWeight="bold" mb={2}>
                🏆 完成品作成
            </Typography>

            {/* 基本情報入力 */}
            <Box mb={2}>
                <TextField
                    fullWidth
                    label="完成品名"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    sx={{ mb: 1 }}
                />
                
                <Box display="flex" gap={1} mb={1}>
                    <TextField
                        label="販売価格"
                        type="number"
                        value={foodPrice}
                        onChange={(e) => setFoodPrice(e.target.value ? Number(e.target.value) : '')}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                        }}
                        sx={{ flex: 1 }}
                    />
                    
                    {profitRate !== null && (
                        <Box display="flex" alignItems="center" sx={{ minWidth: 100 }}>
                            <Chip
                                label={`利益率: ${profitRate.toFixed(1)}%`}
                                color={getProfitRateColor(profitRate) as any}
                                size="small"
                            />
                        </Box>
                    )}
                </Box>
                
                <TextField
                    fullWidth
                    label="説明（オプション）"
                    value={foodDescription}
                    onChange={(e) => setFoodDescription(e.target.value)}
                    multiline
                    rows={2}
                    placeholder="完成品の説明やセット内容など..."
                />
            </Box>

            {/* ドロップゾーン */}
            <Box
                ref={drop}
                sx={{
                    flexGrow: 1,
                    border: '2px dashed',
                    borderColor: isOver ? 'success.main' : 'grey.300',
                    borderRadius: 2,
                    p: 2,
                    mb: 2,
                    backgroundColor: isOver ? 'success.light' : 'transparent',
                    opacity: isOver ? 0.8 : 1,
                    transition: 'all 0.2s ease',
                    overflowY: 'auto',
                }}
            >
                {foodDishes.length === 0 ? (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                        py={4}
                    >
                        料理をここにドラッグ&ドロップしてください
                    </Typography>
                ) : (
                    <List dense>
                        {foodDishes.map((item, index) => (
                            <React.Fragment key={index}>
                                <ListItem>
                                    <Box sx={{ width: '100%' }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                            <Typography variant="body2" fontWeight="bold">
                                                {item.dish.name}
                                            </Typography>
                                            <IconButton
                                                edge="end"
                                                onClick={() => removeDish(index)}
                                                color="error"
                                                size="small"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                        
                                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={item.usageQuantity}
                                                onChange={(e) => updateDishQuantity(index, Number(e.target.value))}
                                                inputProps={{ min: 0.01, step: 0.01 }}
                                                sx={{ width: 80 }}
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                {USAGE_UNIT_INFO[item.usageUnit].name}
                                            </Typography>
                                            <Typography variant="caption" color="error" fontWeight="bold">
                                                ¥{item.usageCost.toFixed(2)}
                                            </Typography>
                                        </Box>
                                        
                                        <Typography variant="caption" color="text.secondary">
                                            料理原価: ¥{item.dish.total_cost.toFixed(2)}
                                        </Typography>
                                        
                                        {item.description && (
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                備考: {item.description}
                                            </Typography>
                                        )}
                                    </Box>
                                </ListItem>
                                {index < foodDishes.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Box>

            {/* 合計・利益情報 */}
            <Box mb={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight="bold">
                        合計原価: ¥{totalCost.toFixed(2)}
                    </Typography>
                    {profit !== null && (
                        <Typography 
                            variant="body2" 
                            fontWeight="bold" 
                            color={profit >= 0 ? 'success.main' : 'error.main'}
                        >
                            利益: ¥{profit.toFixed(2)}
                        </Typography>
                    )}
                </Box>
                
                {typeof foodPrice === 'number' && foodPrice > 0 && (
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                            販売価格: ¥{foodPrice.toFixed(2)}
                        </Typography>
                        {profitRate !== null && (
                            <Typography 
                                variant="caption" 
                                fontWeight="bold"
                                color={profitRate >= 20 ? 'success.main' : profitRate >= 10 ? 'warning.main' : 'error.main'}
                            >
                                利益率: {profitRate.toFixed(1)}%
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>

            {/* 作成ボタン */}
            <Button
                variant="contained"
                fullWidth
                onClick={handleCreateFood}
                disabled={!foodName.trim() || foodDishes.length === 0 || createFoodMutation.isLoading}
                color="success"
            >
                {createFoodMutation.isLoading ? '作成中...' : '完成品を作成'}
            </Button>

            {/* 使用量・単位入力モーダル */}
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
                    <Paper sx={{ p: 3, minWidth: 300, maxWidth: 400 }}>
                        <Typography variant="h6" mb={2}>
                            {quantityModal.dish?.name} の使用設定
                        </Typography>
                        
                        <Box display="flex" gap={1} mb={2}>
                            <TextField
                                label="使用量"
                                type="number"
                                value={quantityModal.quantity}
                                onChange={(e) => setQuantityModal(prev => ({ 
                                    ...prev, 
                                    quantity: e.target.value 
                                }))}
                                inputProps={{ min: 0.01, step: 0.01 }}
                                sx={{ flex: 1 }}
                            />
                            
                            <FormControl sx={{ minWidth: 120 }}>
                                <InputLabel>単位</InputLabel>
                                <Select
                                    value={quantityModal.unit}
                                    label="単位"
                                    onChange={(e) => setQuantityModal(prev => ({ 
                                        ...prev, 
                                        unit: e.target.value as 'ratio' | 'serving'
                                    }))}
                                >
                                    <MenuItem value="ratio">
                                        {USAGE_UNIT_INFO.ratio.icon} {USAGE_UNIT_INFO.ratio.name}
                                    </MenuItem>
                                    <MenuItem value="serving">
                                        {USAGE_UNIT_INFO.serving.icon} {USAGE_UNIT_INFO.serving.name}
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        
                        <TextField
                            fullWidth
                            label="備考（オプション）"
                            value={quantityModal.description}
                            onChange={(e) => setQuantityModal(prev => ({ 
                                ...prev, 
                                description: e.target.value 
                            }))}
                            placeholder="メイン、サイド、ガーニッシュなど"
                            sx={{ mb: 2 }}
                        />
                        
                        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                            料理原価: ¥{quantityModal.dish?.total_cost.toFixed(2)}
                            {quantityModal.quantity && parseFloat(quantityModal.quantity) > 0 && (
                                <> → 使用コスト: ¥{(quantityModal.dish?.total_cost || 0) * parseFloat(quantityModal.quantity)}</>
                            )}
                        </Typography>
                        
                        <Box display="flex" gap={1}>
                            <Button
                                variant="contained"
                                onClick={handleQuantitySubmit}
                                fullWidth
                                disabled={!quantityModal.quantity || parseFloat(quantityModal.quantity) <= 0}
                            >
                                追加
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => setQuantityModal({ 
                                    open: false, 
                                    dish: null, 
                                    quantity: '', 
                                    unit: 'ratio',
                                    description: ''
                                })}
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

export default FoodBuilder;