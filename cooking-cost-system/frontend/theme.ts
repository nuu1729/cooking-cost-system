import { createTheme, ThemeOptions } from '@mui/material/styles';
import { jaJP } from '@mui/material/locale';

// カスタムカラーパレット
declare module '@mui/material/styles' {
    interface Palette {
        gradient: {
        primary: string;
        secondary: string;
        };
        genre: {
        meat: string;
        vegetable: string;
        seasoning: string;
        sauce: string;
        frozen: string;
        drink: string;
        };
    }

    interface PaletteOptions {
        gradient?: {
        primary?: string;
        secondary?: string;
        };
        genre?: {
        meat?: string;
        vegetable?: string;
        seasoning?: string;
        sauce?: string;
        frozen?: string;
        drink?: string;
        };
    }
}

// ベーステーマ設定
const baseTheme: ThemeOptions = {
    palette: {
        mode: 'light',
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
        error: {
        main: '#f44336',
        light: '#e57373',
        dark: '#d32f2f',
        },
        warning: {
        main: '#ff9800',
        light: '#ffb74d',
        dark: '#f57c00',
        },
        info: {
        main: '#2196f3',
        light: '#64b5f6',
        dark: '#1976d2',
        },
        success: {
        main: '#4caf50',
        light: '#81c784',
        dark: '#388e3c',
        },
        background: {
        default: '#fafafa',
        paper: '#ffffff',
        },
        text: {
        primary: 'rgba(0, 0, 0, 0.87)',
        secondary: 'rgba(0, 0, 0, 0.6)',
        disabled: 'rgba(0, 0, 0, 0.38)',
        },
        // カスタムカラー
        gradient: {
        primary: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
        secondary: 'linear-gradient(45deg, #dc004e 30%, #ff5983 90%)',
        },
        genre: {
        meat: '#d32f2f',
        vegetable: '#388e3c',
        seasoning: '#fbc02d',
        sauce: '#ff5722',
        frozen: '#2196f3',
        drink: '#9c27b0',
        },
    },
    typography: {
        fontFamily: [
        '"Noto Sans JP"',
        '"Roboto"',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        ].join(','),
        h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
        lineHeight: 1.2,
        },
        h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
        },
        h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.4,
        },
        h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
        },
        h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.5,
        },
        h6: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.5,
        },
        subtitle1: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.5,
        },
        subtitle2: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.57,
        },
        body1: {
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: 1.6,
        },
        body2: {
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: 1.6,
        },
        button: {
        fontSize: '0.875rem',
        fontWeight: 600,
        textTransform: 'none' as const,
        },
        caption: {
        fontSize: '0.75rem',
        fontWeight: 400,
        lineHeight: 1.66,
        },
        overline: {
        fontSize: '0.75rem',
        fontWeight: 500,
        textTransform: 'uppercase' as const,
        lineHeight: 2.66,
        },
    },
    shape: {
        borderRadius: 8,
    },
    spacing: 8,
};

// コンポーネントのデフォルト設定
const componentsTheme: ThemeOptions['components'] = {
    MuiButton: {
        styleOverrides: {
        root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            },
        },
        contained: {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
        },
        },
        defaultProps: {
        disableElevation: true,
        },
    },
    MuiCard: {
        styleOverrides: {
        root: {
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            },
            transition: 'box-shadow 0.3s ease-in-out',
        },
        },
    },
    MuiPaper: {
        styleOverrides: {
        root: {
            borderRadius: 12,
        },
        },
    },
    MuiTextField: {
        styleOverrides: {
        root: {
            '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            },
        },
        },
    },
    MuiChip: {
        styleOverrides: {
        root: {
            borderRadius: 16,
            fontWeight: 500,
        },
        },
    },
    MuiAppBar: {
        styleOverrides: {
        root: {
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            backgroundImage: 'none',
        },
        },
    },
    MuiDrawer: {
        styleOverrides: {
        paper: {
            backgroundImage: 'none',
        },
        },
    },
    MuiDialog: {
        styleOverrides: {
        paper: {
            borderRadius: 16,
        },
        },
    },
    MuiTooltip: {
        styleOverrides: {
        tooltip: {
            borderRadius: 8,
            fontSize: '0.75rem',
        },
        },
    },
    MuiAlert: {
        styleOverrides: {
        root: {
            borderRadius: 8,
        },
        },
    },
    MuiSnackbar: {
        styleOverrides: {
        root: {
            '& .MuiSnackbarContent-root': {
            borderRadius: 8,
            },
        },
        },
    },
    MuiLinearProgress: {
        styleOverrides: {
        root: {
            borderRadius: 4,
        },
        },
    },
    MuiTableContainer: {
        styleOverrides: {
        root: {
            borderRadius: 12,
            border: '1px solid rgba(224, 224, 224, 1)',
        },
        },
    },
    MuiDataGrid: {
        styleOverrides: {
        root: {
            borderRadius: 12,
            border: '1px solid rgba(224, 224, 224, 1)',
        },
        },
    },
};

// ブレークポイント設定
const breakpoints = {
    values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
    },
};

// ダークテーマ設定
const darkTheme: ThemeOptions = {
    palette: {
        mode: 'dark',
        primary: {
        main: '#90caf9',
        light: '#bbdefb',
        dark: '#42a5f5',
        },
        secondary: {
        main: '#f48fb1',
        light: '#ffc1cc',
        dark: '#f06292',
        },
        background: {
        default: '#121212',
        paper: '#1e1e1e',
        },
        text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.7)',
        disabled: 'rgba(255, 255, 255, 0.5)',
        },
        genre: {
        meat: '#ef5350',
        vegetable: '#66bb6a',
        seasoning: '#ffeb3b',
        sauce: '#ff7043',
        frozen: '#42a5f5',
        drink: '#ab47bc',
        },
    },
};

// アニメーション設定
const transitions = {
    duration: {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195,
    },
    easing: {
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
};

// メインテーマの作成
export const theme = createTheme(
    {
        ...baseTheme,
        breakpoints,
        transitions,
        components: componentsTheme,
        zIndex: {
        mobileStepper: 1000,
        fab: 1050,
        speedDial: 1050,
        appBar: 1100,
        drawer: 1200,
        modal: 1300,
        snackbar: 1400,
        tooltip: 1500,
        },
    },
    jaJP // 日本語ロケール
);

// ダークテーマ
export const darkThemeInstance = createTheme(
    {
        ...baseTheme,
        ...darkTheme,
        breakpoints,
        transitions,
        components: componentsTheme,
    },
    jaJP
);

// テーマユーティリティ関数
export const getGenreColor = (genre: string): string => {
    const genreColors = theme.palette.genre as any;
    return genreColors[genre] || theme.palette.primary.main;
};

export const getGenreInfo = (genre: string) => {
    const genreMap: Record<string, { name: string; icon: string; color: string }> = {
        meat: { name: '肉類', icon: '🥩', color: getGenreColor('meat') },
        vegetable: { name: '野菜', icon: '🥬', color: getGenreColor('vegetable') },
        seasoning: { name: '調味料', icon: '🧂', color: getGenreColor('seasoning') },
        sauce: { name: 'ソース', icon: '🍅', color: getGenreColor('sauce') },
        frozen: { name: '冷凍', icon: '🧊', color: getGenreColor('frozen') },
        drink: { name: 'ドリンク', icon: '🥤', color: getGenreColor('drink') },
    };
    
    return genreMap[genre] || { name: '不明', icon: '❓', color: theme.palette.grey[500] };
};

// レスポンシブヘルパー
export const useResponsive = () => {
    return {
        isMobile: `@media (max-width: ${theme.breakpoints.values.sm}px)`,
        isTablet: `@media (min-width: ${theme.breakpoints.values.sm}px) and (max-width: ${theme.breakpoints.values.md}px)`,
        isDesktop: `@media (min-width: ${theme.breakpoints.values.md}px)`,
    };
};

// カスタムシャドウ
export const customShadows = {
    card: '0 2px 8px rgba(0,0,0,0.1)',
    cardHover: '0 4px 16px rgba(0,0,0,0.15)',
    button: '0 2px 4px rgba(0,0,0,0.1)',
    buttonHover: '0 4px 12px rgba(0,0,0,0.15)',
    modal: '0 8px 32px rgba(0,0,0,0.2)',
    dropdown: '0 4px 16px rgba(0,0,0,0.1)',
};

export default theme;