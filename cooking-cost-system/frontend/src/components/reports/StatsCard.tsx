import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon?: string;
    color?: string;
    change?: number;
    trend?: 'up' | 'down' | 'stable';
}

export const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    icon,
    color = '#1976d2',
    change,
    trend,
    }) => {
    return (
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        >
        <Card
            sx={{
            height: '100%',
            background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
            border: `1px solid ${color}30`,
            transition: 'transform 0.2s ease',
            '&:hover': {
                transform: 'translateY(-2px)',
            },
            }}
        >
            <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {title}
                </Typography>
                {icon && (
                <Box
                    sx={{
                    fontSize: '1.5rem',
                    opacity: 0.8,
                    }}
                >
                    {icon}
                </Box>
                )}
            </Box>
            
            <Typography
                variant="h4"
                component="div"
                fontWeight="bold"
                sx={{ color, mb: 1 }}
            >
                {value}
            </Typography>

            {change !== undefined && (
                <Box display="flex" alignItems="center" gap={0.5}>
                <Typography
                    variant="caption"
                    sx={{
                    color: trend === 'up' ? 'success.main' : 
                            trend === 'down' ? 'error.main' : 'text.secondary',
                    fontWeight: 500,
                    }}
                >
                    {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} 
                    {change > 0 ? '+' : ''}{change}%
                </Typography>
                </Box>
            )}
            </CardContent>
        </Card>
        </motion.div>
    );
};
