// cooking-cost-system/frontend/src/components/common/Layout.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    Box,
    useTheme,
    useMediaQuery,
    Divider,
    Chip,
    Tooltip,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Home as HomeIcon,
    Assessment as ReportsIcon,
    Settings as SettingsIcon,
    AdminPanelSettings as AdminIcon,
    Restaurant as RestaurantIcon,
    Close as CloseIcon,
    GitHub as GitHubIcon,
    Info as InfoIcon,
} from '@mui/icons-material';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const location = useLocation();
    
    const [drawerOpen, setDrawerOpen] = useState(!isMobile);

    const menuItems = [
        {
            text: 'ホーム',
            icon: <HomeIcon />,
            path: '/',
            description: 'メイン画面'
        },
        {
            text: 'レポート',
            icon: <ReportsIcon />,
            path: '/reports',
            description: '統計・分析'
        },
        {
            text: '管理',
            icon: <AdminIcon />,
            path: '/admin',
            description: 'システム管理'
        },
        {
            text: '設定',
            icon: <SettingsIcon />,
            path: '/settings',
            description: 'アプリケーション設定'
        },
    ];

    const handleDrawerToggle = () => {
        setDrawerOpen(!drawerOpen);
    };

    const handleMenuClick = (path: string) => {
        navigate(path);
        if (isMobile) {
            setDrawerOpen(false);
        }
    };

    const drawerWidth = 280;

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* ヘッダー */}
            <Box
                sx={{
                    p: 2,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <Box display="flex" alignItems="center" gap={1}>
                    <RestaurantIcon />
                    <Typography variant="h6" component="div" fontWeight="bold">
                        料理原価計算
                    </Typography>
                </Box>
                {isMobile && (
                    <IconButton
                        color="inherit"
                        onClick={handleDrawerToggle}
                        size="small"
                    >
                        <CloseIcon />
                    </IconButton>
                )}
            </Box>

            <Divider />

            {/* ナビゲーションメニュー */}
            <List sx={{ flexGrow: 1, pt: 1 }}>
                {menuItems.map((item) => (
                    <Tooltip key={item.path} title={item.description} placement="right">
                        <ListItem
                            button
                            selected={location.pathname === item.path}
                            onClick={() => handleMenuClick(item.path)}
                            sx={{
                                mx: 1,
                                borderRadius: 1,
                                mb: 0.5,
                                '&.Mui-selected': {
                                    bgcolor: 'primary.light',
                                    color: 'primary.contrastText',
                                    '&:hover': {
                                        bgcolor: 'primary.main',
                                    },
                                },
                                '&:hover': {
                                    bgcolor: 'action.hover',
                                },
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    color: location.pathname === item.path 
                                        ? 'primary.contrastText' 
                                        : 'inherit',
                                    minWidth: 40,
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText 
                                primary={item.text}
                                secondary={item.description}
                                primaryTypographyProps={{
                                    fontWeight: location.pathname === item.path ? 'bold' : 'normal'
                                }}
                                secondaryTypographyProps={{
                                    fontSize: '0.75rem',
                                    color: location.pathname === item.path 
                                        ? 'primary.contrastText' 
                                        : 'text.secondary'
                                }}
                            />
                        </ListItem>
                    </Tooltip>
                ))}
            </List>

            <Divider />

            {/* フッター情報 */}
            <Box sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    料理原価計算システム v2.0
                </Typography>
                <Box display="flex" gap={1} mb={1}>
                    <Chip 
                        label="React" 
                        size="small" 
                        variant="outlined"
                        color="primary"
                    />
                    <Chip 
                        label="Node.js" 
                        size="small" 
                        variant="outlined"
                        color="secondary"
                    />
                </Box>
                <Box display="flex" gap={1}>
                    <Tooltip title="GitHub リポジトリ">
                        <IconButton 
                            size="small" 
                            href="https://github.com/your-repo/cooking-cost-system"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <GitHubIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="システム情報">
                        <IconButton 
                            size="small"
                            onClick={() => navigate('/about')}
                        >
                            <InfoIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* アプリバー */}
            <AppBar
                position="fixed"
                sx={{
                    width: isMobile ? '100%' : `calc(100% - ${drawerOpen ? drawerWidth : 0}px)`,
                    ml: isMobile ? 0 : (drawerOpen ? `${drawerWidth}px` : 0),
                    transition: theme.transitions.create(['margin', 'width'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        {menuItems.find(item => item.path === location.pathname)?.text || 'システム'}
                    </Typography>
                    <Chip 
                        label={process.env.NODE_ENV === 'development' ? 'DEV' : 'PROD'}
                        color={process.env.NODE_ENV === 'development' ? 'warning' : 'success'}
                        size="small"
                        variant="outlined"
                    />
                </Toolbar>
            </AppBar>

            {/* サイドナビゲーション */}
            <Box
                component="nav"
                sx={{ 
                    width: isMobile ? 0 : (drawerOpen ? drawerWidth : 0),
                    flexShrink: 0,
                    transition: theme.transitions.create('width', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                }}
            >
                <Drawer
                    variant={isMobile ? 'temporary' : 'persistent'}
                    open={drawerOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // モバイル用パフォーマンス改善
                    }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                            bgcolor: 'background.paper',
                            borderRight: `1px solid ${theme.palette.divider}`,
                        },
                    }}
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* メインコンテンツ */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    bgcolor: 'background.default',
                    minHeight: '100vh',
                    width: isMobile ? '100%' : `calc(100% - ${drawerOpen ? drawerWidth : 0}px)`,
                    transition: theme.transitions.create(['margin', 'width'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                }}
            >
                {/* ツールバーのスペース確保 */}
                <Toolbar />
                
                {/* ページコンテンツ */}
                <Box sx={{ p: isMobile ? 1 : 3, maxWidth: '100%', overflow: 'hidden' }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
};

export default Layout;