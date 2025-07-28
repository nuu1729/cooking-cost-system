import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    InputAdornment,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { GENRE_INFO, QUERY_KEYS } from '../../types';
import { ingredientApi } from '../../services/api';

const schema = yup.object({
    name: yup.string().required('食材名は必須です').max(255),
    store: yup.string().required('購入場所は必須です').max(100),
    quantity: yup.number().required('購入量は必須です').positive('0より大きい値を入力してください'),
    unit: yup.string().required('単位は必須です').max(20),
    price: yup.number().required('価格は必須です').positive('0より大きい値を入力してください'),
    genre: yup.string().required('ジャンルは必須です'),
});

interface AddIngredientModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddIngredientModal: React.FC<AddIngredientModalProps> = ({
    open,
    onClose,
    onSuccess,
}) => {
    const queryClient = useQueryClient();
    
    const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: '',
            store: '',
            quantity: 0,
            unit: '',
            price: 0,
            genre: 'meat',
        },
    });

    const createMutation = useMutation({
        mutationFn: ingredientApi.create,
        onSuccess: () => {
            toast.success('食材を追加しました');
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INGREDIENTS });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD });
            reset();
            onSuccess();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || '追加に失敗しました');
        },
    });

    const quantity = watch('quantity');
    const price = watch('price');
    const unitPrice = quantity > 0 && price > 0 ? (price / quantity).toFixed(2) : '0.00';

    const onSubmit = (data: any) => {
        createMutation.mutate(data);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>🛒 食材を追加</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="食材名"
                                        error={!!errors.name}
                                        helperText={errors.name?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="store"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="購入場所"
                                        error={!!errors.store}
                                        helperText={errors.store?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Controller
                                name="quantity"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="購入量"
                                        type="number"
                                        error={!!errors.quantity}
                                        helperText={errors.quantity?.message}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Controller
                                name="unit"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="単位"
                                        error={!!errors.unit}
                                        helperText={errors.unit?.message}
                                        placeholder="g, ml, 個 など"
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Controller
                                name="price"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="価格"
                                        type="number"
                                        error={!!errors.price}
                                        helperText={errors.price?.message}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                                        }}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="genre"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth error={!!errors.genre}>
                                        <InputLabel>ジャンル</InputLabel>
                                        <Select {...field} label="ジャンル">
                                            {Object.entries(GENRE_INFO).map(([key, info]) => (
                                                <MenuItem key={key} value={key}>
                                                    {info.icon} {info.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="単価"
                                value={`¥${unitPrice}`}
                                InputProps={{
                                    readOnly: true,
                                }}
                                helperText="価格 ÷ 購入量で自動計算"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>キャンセル</Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        disabled={createMutation.isPending}
                    >
                        {createMutation.isPending ? '追加中...' : '追加'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default AddIngredientModal;
