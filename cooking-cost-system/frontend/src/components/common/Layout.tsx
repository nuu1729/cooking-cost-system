import React, { useState } from 'react';
import {
    AppBar,
    Box,
    CssBaseline,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    useTheme,
    useMediaQuery,
    Avatar,
    Menu,
    MenuItem,
    Divider,
    Badge,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Home as HomeIcon,
    Assessment as ReportsIcon,
    Settings as SettingsIcon,
    AdminPanelSettings as AdminIcon,
    AccountCircle as AccountIcon,
    Logout as LogoutIcon,
    Notifications as NotificationsIcon,
    RestaurantMenu as RestaurantIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const drawerWidth = 240;

interface Props {
    children: React.ReactNode;
}

const Layout: React.FC<Props> = ({ children }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const navigate = useNavigate();
    const location = useLocation();
    
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setUserMenuAnchor(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setUserMenuAnchor(null);
    };

    const menuItems = [
        { text: 'ホーム', icon: <HomeIcon />, path: '/' },
        { text: 'レポート', icon: <ReportsIcon />, path: '/reports' },
        { text: '管理', icon: <AdminIcon />, path: '/admin' },
        { text: '設定', icon: <SettingsIcon />, path: '/settings' },
    ];

    const drawer = (
        <Box>
        {/* ロゴエリア */}
        <Box
            sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            }}
        >
            <RestaurantIcon color="primary" />
            <Typography variant="h6" component="div" color="primary" fontWeight="bold">
            料理原価システム
            </Typography>
        </Box>

        {/* メニューリスト */}
        <List sx={{ pt: 2 }}>
            {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
                <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                    navigate(item.path);
                    if (isMobile) {
                    setMobileOpen(false);
                    }
                }}
                sx={{
                    mx: 1,
                    borderRadius: 2,
                    '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.main + '15',
                    color: theme.palette.primary.main,
                    '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.main,
                    },
                    },
                }}
                >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    }}
                />
                </ListItemButton>
            </ListItem>
            ))}
        </List>

        {/* フッター情報 */}
        <Box
            sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            textAlign: 'center',
            borderTop: `1px solid ${theme.palette.divider}`,
            }}
        >
            <Typography variant="caption" color="text.secondary">
            Version 2.0.0
            </Typography>
        </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        
        {/* アプリバー */}
        <AppBar
            position="fixed"
            sx={{
            width: { lg: `calc(100% - ${drawerWidth}px)` },
            ml: { lg: `${drawerWidth}px` },
            bgcolor: 'background.paper',
            boxShadow: 1,
            }}
        >
            <Toolbar>
            <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { lg: 'none' } }}
            >
                <MenuIcon />
            </IconButton>
            
            <Typography 
                variant="h6" 
                noWrap 
                component="div" 
                sx={{ flexGrow: 1, color: 'text.primary' }}
            >
                {menuItems.find(item => item.path === location.pathname)?.text || 'ホーム'}
            </Typography>

            {/* 通知アイコン */}
            <IconButton color="inherit" sx={{ mr: 1 }}>
                <Badge badgeContent={0} color="error">
                <NotificationsIcon />
                </Badge>
            </IconButton>

            {/* ユーザーメニュー */}
            <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleUserMenuOpen}
                color="inherit"
            >
                <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                A
                </Avatar>
            </IconButton>
            
            <Menu
                id="menu-appbar"
                anchorEl={userMenuAnchor}
                anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
                }}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
            >
                <MenuItem onClick={handleUserMenuClose}>
                <ListItemIcon>
                    <AccountIcon fontSize="small" />
                </ListItemIcon>
                プロフィール
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleUserMenuClose}>
                <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                </ListItemIcon>
                ログアウト
                </MenuItem>
            </Menu>
            </Toolbar>
        </AppBar>

        {/* サイドドロワー */}
        <Box
            component="nav"
            sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
        >
            <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
                keepMounted: true, // モバイルでのパフォーマンス向上
            }}
            sx={{
                display: { xs: 'block', lg: 'none' },
                '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth 
                },
            }}
            >
            {drawer}
            </Drawer>
            
            <Drawer
            variant="permanent"
            sx={{
                display: { xs: 'none', lg: 'block' },
                '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth 
                },
            }}
            open
            >
            {drawer}
            </Drawer>
        </Box>

        {/* メインコンテンツ */}
        <Box
            component="main"
            sx={{
            flexGrow: 1,
            width: { lg: `calc(100% - ${drawerWidth}px)` },
            minHeight: '100vh',
            bgcolor: 'background.default',
            }}
        >
            <Toolbar /> {/* アプリバーのスペース確保 */}
            
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            >
            {children}
            </motion.div>
        </Box>
        </Box>
  );
};

export default Layout;