import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    LinearProgress,
    useTheme,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    TrendingFlat,
    Info as InfoIcon,
} from '@mui/icons-material';

interface StatsCardProps {
    title: string;
    value: string | number;
    change?: number;
    trend?: 'up' | 'down' | 'stable';
    icon?: React.ReactNode;
    color?: string;
    subtitle?: string;
    description?: string;
    maxValue?: number;
    unit?: string;
    variant?: 'default' | 'progress' | 'compact';
    onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    change,
    trend,
    icon,
    color,
    subtitle,
    description,
    maxValue,
    unit,
    variant = 'default',
    onClick,
}) => {
    const theme = useTheme();

    const getTrendIcon = () => {
        switch (trend) {
            case 'up':
                return <TrendingUp fontSize="small" color="success" />;
            case 'down':
                return <TrendingDown fontSize="small" color="error" />;
            case 'stable':
                return <TrendingFlat fontSize="small" color="action" />;
            default:
                return null;
        }
    };

    const getTrendColor = () => {
        switch (trend) {
            case 'up':
                return theme.palette.success.main;
            case 'down':
                return theme.palette.error.main;
            case 'stable':
                return theme.palette.grey[500];
            default:
                return theme.palette.text.secondary;
        }
    };

    const formatValue = (val: string | number) => {
        if (typeof val === 'number') {
            if (Number.isInteger(val)) {
                return val.toLocaleString();
            } else {
                return val.toFixed(2);
            }
        }
        return val;
    };

    const formatChange = (changeValue: number) => {
        const sign = changeValue >= 0 ? '+' : '';
        return `${sign}${changeValue.toFixed(1)}%`;
    };

    const progressValue = maxValue && typeof value === 'number' 
        ? Math.min((value / maxValue) * 100, 100) 
        : 0;

    if (variant === 'compact') {
        return (
            <Card 
                sx={{ 
                    height: '100%',
                    cursor: onClick ? 'pointer' : 'default',
                    '&:hover': onClick ? {
                        boxShadow: theme.shadows[4],
                        transform: 'translateY(-2px)',
                    } : {},
                    transition: 'all 0.2s ease-in-out',
                }}
                onClick={onClick}
            >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                                variant="caption" 
                                color="text.secondary" 
                                noWrap
                                title={title}
                            >
                                {title}
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" noWrap>
                                {formatValue(value)}{unit && ` ${unit}`}
                            </Typography>
                            {change !== undefined && (
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    {getTrendIcon()}
                                    <Typography 
                                        variant="caption" 
                                        color={getTrendColor()}
                                        fontWeight="bold"
                                    >
                                        {formatChange(change)}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                        {icon && (
                            <Box
                                sx={{
                                    p: 1,
                                    borderRadius: '50%',
                                    backgroundColor: color ? `${color}20` : 'primary.light',
                                    color: color || 'primary.main',
                                }}
                            >
                                {icon}
                            </Box>
                        )}
                    </Box>
                </CardContent>
            </Card>
        );
    }

    if (variant === 'progress') {
        return (
            <Card 
                sx={{ 
                    height: '100%',
                    cursor: onClick ? 'pointer' : 'default',
                    '&:hover': onClick ? {
                        boxShadow: theme.shadows[4],
                        transform: 'translateY(-2px)',
                    } : {},
                    transition: 'all 0.2s ease-in-out',
                }}
                onClick={onClick}
            >
                <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Typography variant="subtitle2" color="text.secondary">
                            {title}
                        </Typography>
                        {icon && (
                            <Box
                                sx={{
                                    p: 1,
                                    borderRadius: '50%',
                                    backgroundColor: color ? `${color}20` : 'primary.light',
                                    color: color || 'primary.main',
                                }}
                            >
                                {icon}
                            </Box>
                        )}
                    </Box>

                    <Typography variant="h4" fontWeight="bold" mb={1}>
                        {formatValue(value)}{unit && ` ${unit}`}
                    </Typography>

                    {maxValue && (
                        <Box mb={2}>
                            <LinearProgress
                                variant="determinate"
                                value={progressValue}
                                sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: theme.palette.grey[200],
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: color || theme.palette.primary.main,
                                        borderRadius: 4,
                                    },
                                }}
                            />
                            <Box display="flex" justifyContent="space-between" mt={0.5}>
                                <Typography variant="caption" color="text.secondary">
                                    0
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {maxValue.toLocaleString()}{unit && ` ${unit}`}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {subtitle && (
                        <Typography variant="caption" color="text.secondary" display="block">
                            {subtitle}
                        </Typography>
                    )}

                    {change !== undefined && (
                        <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                            {getTrendIcon()}
                            <Typography 
                                variant="caption" 
                                color={getTrendColor()}
                                fontWeight="bold"
                            >
                                {formatChange(change)} vs 前期間
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Default variant
    return (
        <Card 
            sx={{ 
                height: '100%',
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': onClick ? {
                    boxShadow: theme.shadows[4],
                    transform: 'translateY(-2px)',
                } : {},
                transition: 'all 0.2s ease-in-out',
            }}
            onClick={onClick}
        >
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                        {title}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5}>
                        {description && (
                            <Tooltip title={description} placement="top">
                                <IconButton size="small">
                                    <InfoIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        {icon && (
                            <Box
                                sx={{
                                    p: 1.5,
                                    borderRadius: '50%',
                                    backgroundColor: color ? `${color}20` : 'primary.light',
                                    color: color || 'primary.main',
                                }}
                            >
                                {icon}
                            </Box>
                        )}
                    </Box>
                </Box>

                <Typography variant="h3" fontWeight="bold" mb={1}>
                    {formatValue(value)}
                    {unit && (
                        <Typography 
                            component="span" 
                            variant="h5" 
                            color="text.secondary"
                            sx={{ ml: 0.5 }}
                        >
                            {unit}
                        </Typography>
                    )}
                </Typography>

                {subtitle && (
                    <Typography variant="body2" color="text.secondary" mb={1}>
                        {subtitle}
                    </Typography>
                )}

                <Box display="flex" alignItems="center" justifyContent="space-between">
                    {change !== undefined && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                            {getTrendIcon()}
                            <Typography 
                                variant="body2" 
                                color={getTrendColor()}
                                fontWeight="bold"
                            >
                                {formatChange(change)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                vs 前期間
                            </Typography>
                        </Box>
                    )}

                    {trend && !change && (
                        <Chip
                            icon={getTrendIcon()}
                            label={
                                trend === 'up' ? '上昇' : 
                                trend === 'down' ? '下降' : 
                                '安定'
                            }
                            size="small"
                            variant="outlined"
                            sx={{
                                borderColor: getTrendColor(),
                                color: getTrendColor(),
                                '& .MuiChip-icon': {
                                    color: getTrendColor(),
                                },
                            }}
                        />
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default StatsCard;