import { createTheme, ThemeOptions } from '@mui/material/styles';
import { jaJP } from '@mui/material/locale';

// カスタムカラーパレット
const palette = {
    primary: {
        main: '#2E7D32', // 深緑色（食材をイメージ）
        light: '#60AD5E',
        dark: '#1B5E20',
        contrastText: '#FFFFFF',
    },
    secondary: {
        main: '#FF6F00', // オレンジ色（料理をイメージ）
        light: '#FF8F00',
        dark: '#E65100',
        contrastText: '#FFFFFF',
    },
    error: {
        main: '#D32F2F',
        light: '#EF5350',
        dark: '#C62828',
    },
    warning: {
        main: '#F57C00',
        light: '#FF9800',
        dark: '#E65100',
    },
    info: {
        main: '#1976D2',
        light: '#42A5F5',
        dark: '#1565C0',
    },
    success: {
        main: '#388E3C',
        light: '#66BB6A',
        dark: '#2E7D32',
    },
    grey: {
        50: '#FAFAFA',
        100: '#F5F5F5',
        200: '#EEEEEE',
        300: '#E0E0E0',
        400: '#BDBDBD',
        500: '#9E9E9E',
        600: '#757575',
        700: '#616161',
        800: '#424242',
        900: '#212121',
    },
    background: {
        default: '#FAFAFA',
        paper: '#FFFFFF',
    },
    text: {
        primary: 'rgba(0, 0, 0, 0.87)',
        secondary: 'rgba(0, 0, 0, 0.6)',
        disabled: 'rgba(0, 0, 0, 0.38)',
    },
};

// タイポグラフィ設定
const typography = {
    fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
        '"Noto Sans JP"',
        '"Hiragino Kaku Gothic ProN"',
        '"Hiragino Sans"',
        'Meiryo',
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
    body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
    },
    body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
    },
    caption: {
        fontSize: '0.75rem',
        lineHeight: 1.4,
    },
    button: {
        textTransform: 'none' as const,
        fontWeight: 600,
    },
};

// シャドウ設定
const shadows = [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)',
    '0px 3px 6px rgba(0, 0, 0, 0.16), 0px 3px 6px rgba(0, 0, 0, 0.23)',
    '0px 10px 20px rgba(0, 0, 0, 0.19), 0px 6px 6px rgba(0, 0, 0, 0.23)',
    '0px 14px 28px rgba(0, 0, 0, 0.25), 0px 10px 10px rgba(0, 0, 0, 0.22)',
    '0px 19px 38px rgba(0, 0, 0, 0.30), 0px 15px 12px rgba(0, 0, 0, 0.22)',
    // ... 他のシャドウレベル
] as any;

// コンポーネントのデフォルトプロパティとスタイル
const components = {
    MuiCssBaseline: {
        styleOverrides: {
            body: {
                scrollbarWidth: 'thin',
                scrollbarColor: '#BDBDBD #F5F5F5',
                '&::-webkit-scrollbar': {
                    width: 8,
                    height: 8,
                },
                '&::-webkit-scrollbar-track': {
                    backgroundColor: '#F5F5F5',
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#BDBDBD',
                    borderRadius: 4,
                    '&:hover': {
                        backgroundColor: '#9E9E9E',
                    },
                },
            },
        },
    },
    MuiButton: {
        styleOverrides: {
            root: {
                borderRadius: 8,
                textTransform: 'none' as const,
                fontWeight: 600,
                boxShadow: 'none',
                '&:hover': {
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
                },
            },
            contained: {
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
                '&:hover': {
                    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.25)',
                },
            },
        },
    },
    MuiCard: {
        styleOverrides: {
            root: {
                borderRadius: 12,
                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
                },
            },
        },
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                borderRadius: 8,
            },
            elevation1: {
                boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)',
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
                borderRadius: 6,
                fontWeight: 500,
            },
        },
    },
    MuiDrawer: {
        styleOverrides: {
            paper: {
                borderRadius: 0,
                borderRight: '1px solid #E0E0E0',
            },
        },
    },
    MuiAppBar: {
        styleOverrides: {
            root: {
                boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)',
            },
        },
    },
    MuiTableCell: {
        styleOverrides: {
            head: {
                fontWeight: 600,
                backgroundColor: '#F5F5F5',
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
    MuiDialog: {
        styleOverrides: {
            paper: {
                borderRadius: 12,
            },
        },
    },
    MuiTooltip: {
        styleOverrides: {
            tooltip: {
                fontSize: '0.75rem',
                borderRadius: 6,
            },
        },
    },
};

// ブレークポイント設定
const breakpoints = {
    values: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1920,
    },
};

// スペーシング設定
const spacing = 8;

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

// テーマオプション
const themeOptions: ThemeOptions = {
    palette,
    typography,
    shadows,
    components,
    breakpoints,
    spacing,
    transitions,
    shape: {
        borderRadius: 8,
    },
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
};

// メインテーマの作成
const theme = createTheme(themeOptions, jaJP);

// ダークテーマの設定
export const darkTheme = createTheme({
    ...themeOptions,
    palette: {
        ...palette,
        mode: 'dark',
        background: {
            default: '#121212',
            paper: '#1E1E1E',
        },
        text: {
            primary: 'rgba(255, 255, 255, 0.87)',
            secondary: 'rgba(255, 255, 255, 0.6)',
            disabled: 'rgba(255, 255, 255, 0.38)',
        },
    },
}, jaJP);

// カスタムテーマフック
export const useCustomTheme = () => {
    return theme;
};

// ジャンル別カラーマッピング
export const genreColors = {
    meat: '#D32F2F',      // 赤色
    vegetable: '#388E3C',  // 緑色
    seasoning: '#F57C00',  // オレンジ色
    sauce: '#FF6F00',      // 深いオレンジ色
    frozen: '#1976D2',     // 青色
    drink: '#9C27B0',      // 紫色
};

// 利益率別カラーマッピング
export const profitRateColors = {
    excellent: '#4CAF50',  // 緑色 (30%以上)
    good: '#8BC34A',       // 薄緑色 (20-30%)
    average: '#FFC107',    // 黄色 (10-20%)
    poor: '#FF9800',       // オレンジ色 (5-10%)
    bad: '#F44336',        // 赤色 (5%未満)
};

// ステータス別カラーマッピング
export const statusColors = {
    active: '#4CAF50',
    inactive: '#9E9E9E',
    pending: '#FF9800',
    error: '#F44336',
    warning: '#FFC107',
    info: '#2196F3',
};

// カスタムユーティリティ関数
export const getGenreColor = (genre: string): string => {
    return genreColors[genre as keyof typeof genreColors] || palette.grey[500];
};

export const getProfitRateColor = (rate: number): string => {
    if (rate >= 30) return profitRateColors.excellent;
    if (rate >= 20) return profitRateColors.good;
    if (rate >= 10) return profitRateColors.average;
    if (rate >= 5) return profitRateColors.poor;
    return profitRateColors.bad;
};

export default theme;