import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const SettingsPage: React.FC = () => {
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box textAlign="center">
            <Typography variant="h4" component="h1" gutterBottom>
            ⚙️ 設定ページ
            </Typography>
            <Typography variant="body1" color="text.secondary">
            システム設定機能は現在開発中です
            </Typography>
        </Box>
        </Container>
    );
};

export default SettingsPage;