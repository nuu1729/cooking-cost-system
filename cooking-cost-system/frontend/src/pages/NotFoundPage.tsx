import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box textAlign="center">
            <Typography variant="h1" component="h1" gutterBottom sx={{ fontSize: '6rem' }}>
            404
            </Typography>
            <Typography variant="h4" component="h2" gutterBottom>
            ページが見つかりません
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
            お探しのページは存在しないか、移動された可能性があります。
            </Typography>
            <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
            >
            ホームに戻る
            </Button>
        </Box>
        </Container>
    );
};

export default NotFoundPage;