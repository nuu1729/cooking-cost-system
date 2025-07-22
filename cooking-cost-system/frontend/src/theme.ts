import { createTheme, ThemeOptions } from '@mui/material/styles';
import { jaJP } from '@mui/material/locale';

// カスタムカラーパレット
const colors = {
    primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
        contrastText: '#ffffff',
    },
    secondary: {
        main: '#dc004e',
        light: '#ff5983',
        dark: '#9a0036',
        contrastText: '#ffffff',
    },
    success: {
        main: '#2e7d32',
        light: '#4caf50',
        dark: '#1b5e20',
        contrastText: '#ffffff',
    },
    warning: {
        main: '#ed6c02',
        light: '#ff9800',
        dark: '#e65100',
        contrastText: '#ffffff',
    },
    error: {
        main: '#d32f2f',
        light: '#f44336',
        dark: '#c62828',
        contrastText: '#ffffff',
    },
    info: {
        main: '#0288d1',
        light: '#03a9f4',
        dark: '#01579b',
        contrastText: '#ffffff',
    },
    grey: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#eeeeee',
        300: '#e0e0e0',
        400: '#bdbdbd',
        500: '#9e9e9e',
        600: '#757575',
        700: '#616161',
        800: '#424242',
        900: '#212121',
    },
};

// ジャンル別カラー定義（食材ジャンル用）
export const genreColors = {
  meat: '#d32f2f',      // 赤系
  vegetable: '#388e3c',  // 緑系
  seasoning: '#fbc02d',  // 黄系
  sauce: '#ff5722',      // オレンジ系
  frozen: '#2196f3',     // 青系
  drink: '#9c27b0',      // 紫系
};

// ベーステーマ設定
const baseTheme: ThemeOptions = {
    palette: {
    mode: 'light',
        ...colors,
        background: {
        default: '#f8f9fa',
        paper: '#ffffff',
        },
        text: {
        primary: 'rgba(0, 0, 0, 0.87)',
        secondary: 'rgba(0, 0, 0, 0.6)',
        disabled: 'rgba(0, 0, 0, 0.38)',
        },
    },
    
    typography: {
        fontFamily: [
        '"Noto Sans JP"',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        ].join(','),
        
        h1: {
        fontSize: '2.125rem',
        fontWeight: 600,
        lineHeight: 1.2,
        },
        h2: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.3,
        },
        h3: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
        },
        h4: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4,
        },
        h5: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.5,
        },
        h6: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.5,
        },
        body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
        },
        body2: {
        fontSize: '0.875rem',
        lineHeight: 1.43,
        },
        caption: {
        fontSize: '0.75rem',
        lineHeight: 1.66,
        },
        button: {
        textTransform: 'none',
        fontWeight: 500,
        },
    },
    
    shape: {
        borderRadius: 8,
    },
    
    spacing: 8,
    
    components: {
        MuiCssBaseline: {
        styleOverrides: {
            body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
            },
            '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
                background: '#c1c1c1',
                borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
                background: '#a8a8a8',
            },
            },
        },
        },
        
        MuiButton: {
        styleOverrides: {
            root: {
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: '0.875rem',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            },
            },
            contained: {
            '&:hover': {
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
            },
            },
        },
        },
        
        MuiCard: {
        styleOverrides: {
            root: {
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'box-shadow 0.3s ease-in-out',
            '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            },
            },
        },
        },
        
        MuiPaper: {
        styleOverrides: {
            root: {
            borderRadius: 12,
            },
            elevation1: {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            },
            elevation2: {
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            },
            elevation3: {
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            },
        },
        },
        
        MuiTextField: {
        styleOverrides: {
            root: {
            '& .MuiOutlinedInput-root': {
                borderRadius: 8,
                '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: colors.primary.main,
                },
            },
            },
        },
        },
        
        MuiChip: {
        styleOverrides: {
            root: {
            borderRadius: 16,
            fontSize: '0.75rem',
            height: 28,
            },
        },
        },
        
        MuiAppBar: {
        styleOverrides: {
            root: {
            backgroundColor: '#ffffff',
            color: 'rgba(0, 0, 0, 0.87)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            },
        },
        },
        
        MuiDrawer: {
        styleOverrides: {
            paper: {
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            backgroundColor: '#ffffff',
            },
        },
        },
        
        MuiListItemButton: {
        styleOverrides: {
            root: {
            borderRadius: 8,
            margin: '2px 8px',
            '&.Mui-selected': {
                backgroundColor: `${colors.primary.main}15`,
                color: colors.primary.main,
                '&:hover': {
                backgroundColor: `${colors.primary.main}25`,
                },
            },
            },
        },
        },
        
        MuiTabs: {
        styleOverrides: {
            root: {
            minHeight: 48,
            },
            indicator: {
            height: 3,
            borderRadius: '3px 3px 0 0',
            },
        },
        },
        
        MuiTab: {
        styleOverrides: {
            root: {
            minHeight: 48,
            fontSize: '0.875rem',
            fontWeight: 500,
            textTransform: 'none',
            },
        },
        },
    },
};

// メインテーマ作成
export const theme = createTheme(baseTheme, jaJP);

// ダークテーマ（将来用）
export const darkTheme = createTheme({
    ...baseTheme,
    palette: {
        mode: 'dark',
        ...colors,
        background: {
        default: '#121212',
        paper: '#1e1e1e',
        },
        text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.7)',
        disabled: 'rgba(255, 255, 255, 0.5)',
        },
    },
}, jaJP);

// カスタムスタイル関数
export const getGenreColor = (genre: string): string => {
    return genreColors[genre as keyof typeof genreColors] || genreColors.meat;
};

export const createGradient = (color1: string, color2: string): string => {
    return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
};

export const createBoxShadow = (elevation: number): string => {
    const shadows = [
        'none',
        '0 2px 4px rgba(0,0,0,0.1)',
        '0 4px 8px rgba(0,0,0,0.1)',
        '0 8px 16px rgba(0,0,0,0.1)',
        '0 16px 32px rgba(0,0,0,0.1)',
    ];
    return shadows[Math.min(elevation, shadows.length - 1)];
};