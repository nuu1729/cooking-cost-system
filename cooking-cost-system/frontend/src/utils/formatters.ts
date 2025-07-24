import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CURRENCY, DATE_FORMATS, GENRE_INFO } from './constants';

// 数値フォーマット関数
export const formatters = {
  /**
   * 通貨をフォーマット
   */
  currency: (value: number | null | undefined, options?: {
    showSymbol?: boolean;
    decimalPlaces?: number;
    emptyText?: string;
  }): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return options?.emptyText || '¥0';
    }

    const { 
      showSymbol = true, 
      decimalPlaces = CURRENCY.DECIMAL_PLACES 
    } = options || {};
    
    const formatted = new Intl.NumberFormat('ja-JP', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(Math.abs(value));
    
    const symbol = showSymbol ? CURRENCY.SYMBOL : '';
    const sign = value < 0 ? '-' : '';
    
    return `${sign}${symbol}${formatted}`;
  },

  /**
   * 数値をフォーマット（3桁区切り）
   */
  number: (value: number | null | undefined, options?: {
    decimalPlaces?: number;
    emptyText?: string;
    suffix?: string;
  }): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return options?.emptyText || '0';
    }

    const { decimalPlaces, suffix = '' } = options || {};
    
    const formatted = new Intl.NumberFormat('ja-JP', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(value);
    
    return `${formatted}${suffix}`;
  },

  /**
   * パーセンテージをフォーマット
   */
  percentage: (value: number | null | undefined, options?: {
    decimalPlaces?: number;
    emptyText?: string;
  }): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return options?.emptyText || '0%';
    }

    const { decimalPlaces = 1 } = options || {};
    return `${value.toFixed(decimalPlaces)}%`;
  },

  /**
   * 単価をフォーマット（単位付き）
   */
  unitPrice: (price: number | null | undefined, unit: string, options?: {
    showSymbol?: boolean;
    decimalPlaces?: number;
  }): string => {
    if (price === null || price === undefined || isNaN(price)) {
      return `¥0/${unit}`;
    }

    const formattedPrice = formatters.currency(price, options);
    return `${formattedPrice}/${unit}`;
  },

  /**
   * 数量をフォーマット（単位付き）
   */
  quantity: (value: number | null | undefined, unit: string, options?: {
    decimalPlaces?: number;
    emptyText?: string;
  }): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return options?.emptyText || `0${unit}`;
    }

    const { decimalPlaces = 2 } = options || {};
    const formatted = value % 1 === 0 ? value.toString() : value.toFixed(decimalPlaces);
    return `${formatted}${unit}`;
  },

  /**
   * ファイルサイズをフォーマット
   */
  fileSize: (bytes: number | null | undefined): string => {
    if (bytes === null || bytes === undefined || bytes === 0) {
      return '0 Bytes';
    }

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    
    const value = bytes / Math.pow(k, i);
    const formatted = i === 0 ? value.toString() : value.toFixed(1);
    
    return `${formatted} ${sizes[i]}`;
  },

  /**
   * 大きな数値を省略形でフォーマット
   */
  compactNumber: (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }

    if (Math.abs(value) >= 1e9) {
      return `${(value / 1e9).toFixed(1)}B`;
    }
    if (Math.abs(value) >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1e3) {
      return `${(value / 1e3).toFixed(1)}K`;
    }
    
    return value.toString();
  },
};

// 日付フォーマット関数
export const dateFormatters = {
  /**
   * 日付をフォーマット
   */
  date: (date: Date | string | null | undefined, formatString?: string): string => {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(dateObj)) return '';
      
      return format(dateObj, formatString || DATE_FORMATS.DISPLAY, { locale: ja });
    } catch {
      return '';
    }
  },

  /**
   * 日時をフォーマット
   */
  dateTime: (date: Date | string | null | undefined): string => {
    return dateFormatters.date(date, DATE_FORMATS.DISPLAY_WITH_TIME);
  },

  /**
   * 相対時間をフォーマット
   */
  relative: (date: Date | string | null | undefined): string => {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(dateObj)) return '';
      
      return formatDistanceToNow(dateObj, { addSuffix: true, locale: ja });
    } catch {
      return '';
    }
  },

  /**
   * 時刻のみをフォーマット
   */
  time: (date: Date | string | null | undefined): string => {
    return dateFormatters.date(date, 'HH:mm');
  },

  /**
   * 年月をフォーマット
   */
  yearMonth: (date: Date | string | null | undefined): string => {
    return dateFormatters.date(date, 'yyyy年MM月');
  },

  /**
   * 曜日付きの日付をフォーマット
   */
  dateWithDay: (date: Date | string | null | undefined): string => {
    return dateFormatters.date(date, 'yyyy/MM/dd (E)');
  },

  /**
   * スマートな日付フォーマット（今日、昨日、それ以外）
   */
  smart: (date: Date | string | null | undefined): string => {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(dateObj)) return '';
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const targetDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      
      if (targetDate.getTime() === today.getTime()) {
        return `今日 ${format(dateObj, 'HH:mm', { locale: ja })}`;
      } else if (targetDate.getTime() === yesterday.getTime()) {
        return `昨日 ${format(dateObj, 'HH:mm', { locale: ja })}`;
      } else {
        return format(dateObj, 'MM/dd HH:mm', { locale: ja });
      }
    } catch {
      return '';
    }
  },
};

// 文字列フォーマット関数
export const stringFormatters = {
  /**
   * 文字列を切り詰める
   */
  truncate: (str: string | null | undefined, length: number, suffix: string = '...'): string => {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  },

  /**
   * 改行をHTMLの<br>タグに変換
   */
  lineBreaks: (str: string | null | undefined): string => {
    if (!str) return '';
    return str.replace(/\n/g, '<br>');
  },

  /**
   * HTMLタグを除去
   */
  stripHtml: (str: string | null | undefined): string => {
    if (!str) return '';
    return str.replace(/<[^>]*>/g, '');
  },

  /**
   * 最初の文字を大文字に
   */
  capitalize: (str: string | null | undefined): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  /**
   * キャメルケースをスペース区切りに
   */
  humanize: (str: string | null | undefined): string => {
    if (!str) return '';
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  },

  /**
   * 検索語をハイライト
   */
  highlight: (text: string | null | undefined, search: string | null | undefined): string => {
    if (!text || !search) return text || '';
    
    const regex = new RegExp(`(${search})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  },

  /**
   * プレースホルダーテキスト
   */
  placeholder: (text: string | null | undefined, placeholder: string = 'データがありません'): string => {
    return text && text.trim() !== '' ? text : placeholder;
  },
};

// ビジネスロジック用フォーマット関数
export const businessFormatters = {
  /**
   * ジャンル情報をフォーマット
   */
  genre: (genre: string | null | undefined): string => {
    if (!genre) return '不明';
    
    const info = GENRE_INFO[genre as keyof typeof GENRE_INFO];
    return info ? `${info.icon} ${info.name}` : genre;
  },

  /**
   * 利益率をフォーマット（色付き）
   */
  profitRate: (rate: number | null | undefined): {
    text: string;
    level: 'high' | 'medium' | 'low';
    color: string;
  } => {
    if (rate === null || rate === undefined || isNaN(rate)) {
      return {
        text: '0.0%',
        level: 'low',
        color: '#f44336',
      };
    }

    const level = rate >= 30 ? 'high' : rate >= 15 ? 'medium' : 'low';
    const color = level === 'high' ? '#4caf50' : level === 'medium' ? '#ff9800' : '#f44336';
    
    return {
      text: `${rate.toFixed(1)}%`,
      level,
      color,
    };
  },

  /**
   * 使用単位をフォーマット
   */
  usageUnit: (unit: 'ratio' | 'serving' | null | undefined): string => {
    switch (unit) {
      case 'ratio': return '割合';
      case 'serving': return '人前';
      default: return '不明';
    }
  },

  /**
   * ステータスをフォーマット
   */
  status: (status: string | boolean | null | undefined): {
    text: string;
    color: string;
    icon: string;
  } => {
    if (status === true || status === 'active' || status === '有効') {
      return { text: '有効', color: '#4caf50', icon: '✅' };
    }
    if (status === false || status === 'inactive' || status === '無効') {
      return { text: '無効', color: '#f44336', icon: '❌' };
    }
    if (status === 'pending' || status === '保留') {
      return { text: '保留', color: '#ff9800', icon: '⏳' };
    }
    
    return { text: '不明', color: '#9e9e9e', icon: '❓' };
  },

  /**
   * 原価効率をフォーマット
   */
  costEfficiency: (unitPrice: number | null | undefined): {
    text: string;
    level: 'excellent' | 'good' | 'average' | 'poor';
    color: string;
  } => {
    if (unitPrice === null || unitPrice === undefined || isNaN(unitPrice)) {
      return {
        text: '計算不可',
        level: 'poor',
        color: '#9e9e9e',
      };
    }

    let level: 'excellent' | 'good' | 'average' | 'poor';
    let text: string;
    let color: string;

    if (unitPrice <= 10) {
      level = 'excellent';
      text = '優秀';
      color = '#4caf50';
    } else if (unitPrice <= 50) {
      level = 'good';
      text = '良好';
      color = '#8bc34a';
    } else if (unitPrice <= 100) {
      level = 'average';
      text = '普通';
      color = '#ff9800';
    } else {
      level = 'poor';
      text = '注意';
      color = '#f44336';
    }

    return { text, level, color };
  },
};

// リスト用フォーマット関数
export const listFormatters = {
  /**
   * 配列をカンマ区切りの文字列に
   */
  join: (items: any[] | null | undefined, separator: string = ', '): string => {
    if (!items || !Array.isArray(items)) return '';
    return items.filter(item => item != null).join(separator);
  },

  /**
   * 配列を番号付きリストに
   */
  numbered: (items: string[] | null | undefined): string => {
    if (!items || !Array.isArray(items)) return '';
    return items
      .filter(item => item != null && item.trim() !== '')
      .map((item, index) => `${index + 1}. ${item}`)
      .join('\n');
  },

  /**
   * 配列をブレットポイントに
   */
  bullets: (items: string[] | null | undefined): string => {
    if (!items || !Array.isArray(items)) return '';
    return items
      .filter(item => item != null && item.trim() !== '')
      .map(item => `• ${item}`)
      .join('\n');
  },

  /**
   * 名前リストをフォーマット（「A, B, Cほか」）
   */
  names: (names: string[] | null | undefined, maxShow: number = 3): string => {
    if (!names || !Array.isArray(names) || names.length === 0) {
      return '';
    }

    const validNames = names.filter(name => name && name.trim() !== '');
    
    if (validNames.length <= maxShow) {
      return validNames.join(', ');
    }

    const shown = validNames.slice(0, maxShow);
    const remaining = validNames.length - maxShow;
    return `${shown.join(', ')}ほか${remaining}件`;
  },
};

// フォーム用フォーマット関数
export const formFormatters = {
  /**
   * 電話番号をフォーマット
   */
  phone: (phone: string | null | undefined): string => {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    
    return phone;
  },

  /**
   * 郵便番号をフォーマット
   */
  zipCode: (zip: string | null | undefined): string => {
    if (!zip) return '';
    
    const cleaned = zip.replace(/\D/g, '');
    
    if (cleaned.length === 7) {
      return cleaned.replace(/(\d{3})(\d{4})/, '$1-$2');
    }
    
    return zip;
  },

  /**
   * クレジットカード番号をフォーマット
   */
  creditCard: (card: string | null | undefined, mask: boolean = true): string => {
    if (!card) return '';
    
    const cleaned = card.replace(/\D/g, '');
    
    if (mask && cleaned.length > 4) {
      const lastFour = cleaned.slice(-4);
      const masked = '*'.repeat(cleaned.length - 4);
      return `${masked}${lastFour}`.replace(/(.{4})/g, '$1 ').trim();
    }
    
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  },
};

// テーブル用フォーマット関数
export const tableFormatters = {
  /**
   * ソート方向を矢印で表示
   */
  sortDirection: (direction: 'asc' | 'desc' | null): string => {
    switch (direction) {
      case 'asc': return '↑';
      case 'desc': return '↓';
      default: return '';
    }
  },

  /**
   * 行番号をフォーマット
   */
  rowNumber: (index: number, page: number = 1, pageSize: number = 20): string => {
    return ((page - 1) * pageSize + index + 1).toString();
  },

  /**
   * アクションボタンのラベル
   */
  actionLabel: (action: string): string => {
    const labels: Record<string, string> = {
      'view': '表示',
      'edit': '編集',
      'delete': '削除',
      'copy': 'コピー',
      'export': 'エクスポート',
      'print': '印刷',
    };
    
    return labels[action] || action;
  },
};

// エクスポート
export {
  formatters,
  dateFormatters,
  stringFormatters,
  businessFormatters,
  listFormatters,
  formFormatters,
  tableFormatters,
};

export default {
  ...formatters,
  date: dateFormatters,
  string: stringFormatters,
  business: businessFormatters,
  list: listFormatters,
  form: formFormatters,
  table: tableFormatters,
};
