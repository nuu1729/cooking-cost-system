import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const AdminPage: React.FC = () => {
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box textAlign="center">
            <Typography variant="h4" component="h1" gutterBottom>
            🔧 管理ページ
            </Typography>
            <Typography variant="body1" color="text.secondary">
            システム管理機能は現在開発中です
            </Typography>
        </Box>
        </Container>
    );
};

export default AdminPage;