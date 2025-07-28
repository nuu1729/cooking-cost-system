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
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';
import { useDrop } from 'react-dnd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { Dish, DragItem } from '../../types';
import { completedFoodApi } from '../../services/api';

interface CompletedFoodBuilderProps {
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

const CompletedFoodBuilder: React.FC<CompletedFoodBuilderProps> = ({ 
  dishes, 
  onFoodCreated 
}) => {
  const [foodName, setFoodName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [selectedDishes, setSelectedDishes] = useState<FoodDishItem[]>([]);
  const [dishModal, setDishModal] = useState<{
    open: boolean;
    dish: Dish | null;
    quantity: string;
    unit: 'ratio' | 'serving';
  }>({ open: false, dish: null, quantity: '', unit: 'ratio' });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: completedFoodApi.create,
    onSuccess: () => {
      toast.success('完成品を登録しました');
      queryClient.invalidateQueries({ queryKey: ['completedFoods'] });
      setFoodName('');
      setDescription('');
      setPrice(undefined);
      setSelectedDishes([]);
      onFoodCreated();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '完成品登録に失敗しました');
    },
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'dish',
    drop: (item: DragItem) => {
      const dish = item.item as Dish;
      const existingIndex = selectedDishes.findIndex(di => di.dish.id === dish.id);
      
      if (existingIndex !== -1) {
        toast.error('この料理は既に追加されています');
        return;
      }

      setDishModal({
        open: true,
        dish,
        quantity: '1',
        unit: 'serving',
      });
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleDishSubmit = () => {
    if (!dishModal.dish || !dishModal.quantity) return;

    const quantity = parseFloat(dishModal.quantity);
    if (quantity <= 0) {
      toast.error('使用量は0より大きい値を入力してください');
      return;
    }

    const usageCost = dishModal.dish.total_cost * quantity;
    
    setSelectedDishes(prev => [...prev, {
      dish: dishModal.dish!,
      usageQuantity: quantity,
      usageUnit: dishModal.unit,
      usageCost,
    }]);

    setDishModal({ open: false, dish: null, quantity: '', unit: 'ratio' });
    toast.success('料理を追加しました');
  };

  const removeDish = (index: number) => {
    setSelectedDishes(prev => prev.filter((_, i) => i !== index));
  };

  const totalCost = selectedDishes.reduce((sum, item) => sum + item.usageCost, 0);
  const profit = price ? Math.max(0, price - totalCost) : 0;
  const profitRate = price ? (profit / price) * 100 : 0;

  const getProfitIcon = () => {
    if (profitRate >= 30) return <TrendingUpIcon color="success" />;
    if (profitRate >= 15) return <TrendingFlatIcon color="warning" />;
    return <TrendingDownIcon color="error" />;
  };

  const getProfitColor = () => {
    if (profitRate >= 30) return 'success';
    if (profitRate >= 15) return 'warning';
    return 'error';
  };

  const handleCreateFood = () => {
    if (!foodName.trim()) {
      toast.error('完成品名を入力してください');
      return;
    }

    if (selectedDishes.length === 0) {
      toast.error('料理を追加してください');
      return;
    }

    createMutation.mutate({
      name: foodName,
      description: description.trim() || undefined,
      price: price,
      dishes: selectedDishes.map(item => ({
        dish_id: item.dish.id!,
        usage_quantity: item.usageQuantity,
        usage_unit: item.usageUnit,
        description: item.description,
      })),
    });
  };

  return (
    <Paper sx={{ p: 2, height: '80vh', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" color="primary" fontWeight="bold" mb={2}>
        🏆 完成品作成
      </Typography>

      <TextField
        fullWidth
        label="完成品名"
        value={foodName}
        onChange={(e) => setFoodName(e.target.value)}
        sx={{ mb: 1 }}
      />

      <TextField
        fullWidth
        label="説明"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        rows={2}
        sx={{ mb: 1 }}
      />

      <TextField
        fullWidth
        label="販売価格"
        type="number"
        value={price || ''}
        onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : undefined)}
        InputProps={{
          startAdornment: <InputAdornment position="start">¥</InputAdornment>,
        }}
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
        {selectedDishes.length === 0 ? (
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
            {selectedDishes.map((item, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={item.dish.name}
                    secondary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>{item.usageQuantity} {item.usageUnit === 'ratio' ? '割合' : '人前'}</span>
                        <Chip 
                          label={`¥${item.usageCost.toFixed(2)}`} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => removeDish(index)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < selectedDishes.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* 原価・利益情報 */}
      <Box mb={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" color="text.secondary">
            総原価
          </Typography>
          <Typography variant="h6" color="error">
            ¥{totalCost.toFixed(2)}
          </Typography>
        </Box>

        {price && (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                利益
              </Typography>
              <Typography variant="h6" color={profit > 0 ? 'success.main' : 'error.main'}>
                ¥{profit.toFixed(2)}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                利益率
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                {getProfitIcon()}
                <Typography variant="h6" color={`${getProfitColor()}.main`}>
                  {profitRate.toFixed(1)}%
                </Typography>
              </Box>
            </Box>

            <LinearProgress
              variant="determinate"
              value={Math.min(profitRate, 100)}
              color={getProfitColor() as any}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </>
        )}
      </Box>

      <Button
        variant="contained"
        fullWidth
        onClick={handleCreateFood}
        disabled={!foodName.trim() || selectedDishes.length === 0 || createMutation.isLoading}
      >
        {createMutation.isLoading ? '作成中...' : '完成品を作成'}
      </Button>

      {/* 使用量入力モーダル */}
      {dishModal.open && (
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
              {dishModal.dish?.name} の使用量
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>使用単位</InputLabel>
              <Select
                value={dishModal.unit}
                label="使用単位"
                onChange={(e) => setDishModal(prev => ({ 
                  ...prev, 
                  unit: e.target.value as 'ratio' | 'serving' 
                }))}
              >
                <MenuItem value="ratio">割合</MenuItem>
                <MenuItem value="serving">人前</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label={`使用量`}
              type="number"
              value={dishModal.quantity}
              onChange={(e) => setDishModal(prev => ({ ...prev, quantity: e.target.value }))}
              sx={{ mb: 2 }}
              helperText={
                dishModal.unit === 'ratio' 
                  ? '0.5（半分）、1（全部）などで入力' 
                  : '1人前、2人前などで入力'
              }
            />
            
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                onClick={handleDishSubmit}
                fullWidth
              >
                追加
              </Button>
              <Button
                variant="outlined"
                onClick={() => setDishModal({ open: false, dish: null, quantity: '', unit: 'ratio' })}
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

export default CompletedFoodBuilder;
