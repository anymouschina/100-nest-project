import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import weekday from 'dayjs/plugin/weekday';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

// 配置dayjs
dayjs.locale('zh-cn');
dayjs.extend(relativeTime);
dayjs.extend(weekday);
dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

export const DateUtils = {
  // 格式化日期
  format: (date: string | Date, format = 'YYYY-MM-DD HH:mm:ss') => {
    return dayjs(date).format(format);
  },

  // 相对时间
  fromNow: (date: string | Date) => {
    return dayjs(date).fromNow();
  },

  // 获取时间范围
  getTimeRange: (type: string): [string, string] => {
    const now = dayjs();
    
    switch (type) {
      case 'today':
        return [
          now.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
          now.endOf('day').format('YYYY-MM-DD HH:mm:ss')
        ];
      
      case 'yesterday':
        const yesterday = now.subtract(1, 'day');
        return [
          yesterday.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
          yesterday.endOf('day').format('YYYY-MM-DD HH:mm:ss')
        ];
      
      case 'thisWeek':
        return [
          now.startOf('week').format('YYYY-MM-DD HH:mm:ss'),
          now.endOf('week').format('YYYY-MM-DD HH:mm:ss')
        ];
      
      case 'lastWeek':
        const lastWeek = now.subtract(1, 'week');
        return [
          lastWeek.startOf('week').format('YYYY-MM-DD HH:mm:ss'),
          lastWeek.endOf('week').format('YYYY-MM-DD HH:mm:ss')
        ];
      
      case 'thisMonth':
        return [
          now.startOf('month').format('YYYY-MM-DD HH:mm:ss'),
          now.endOf('month').format('YYYY-MM-DD HH:mm:ss')
        ];
      
      case 'lastMonth':
        const lastMonth = now.subtract(1, 'month');
        return [
          lastMonth.startOf('month').format('YYYY-MM-DD HH:mm:ss'),
          lastMonth.endOf('month').format('YYYY-MM-DD HH:mm:ss')
        ];
      
      case 'thisQuarter':
        return [
          now.startOf('quarter').format('YYYY-MM-DD HH:mm:ss'),
          now.endOf('quarter').format('YYYY-MM-DD HH:mm:ss')
        ];
      
      case 'lastQuarter':
        const lastQuarter = now.subtract(1, 'quarter');
        return [
          lastQuarter.startOf('quarter').format('YYYY-MM-DD HH:mm:ss'),
          lastQuarter.endOf('quarter').format('YYYY-MM-DD HH:mm:ss')
        ];
      
      default:
        return [
          now.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
          now.endOf('day').format('YYYY-MM-DD HH:mm:ss')
        ];
    }
  },

  // 获取时间范围描述
  getTimeRangeLabel: (type: string): string => {
    const labels: Record<string, string> = {
      today: '今天',
      yesterday: '昨天',
      thisWeek: '本周',
      lastWeek: '上周',
      thisMonth: '本月',
      lastMonth: '上月',
      thisQuarter: '本季度',
      lastQuarter: '上季度',
    };
    
    return labels[type] || type;
  },

  // 检查日期是否有效
  isValid: (date: string | Date) => {
    return dayjs(date).isValid();
  },

  // 获取两个日期之间的天数
  daysBetween: (start: string | Date, end: string | Date) => {
    return dayjs(end).diff(dayjs(start), 'day');
  },

  // 生成日期范围数组
  generateDateRange: (start: string | Date, end: string | Date, unit: 'day' | 'week' | 'month' = 'day') => {
    const startDate = dayjs(start);
    const endDate = dayjs(end);
    const dates: string[] = [];
    
    let current = startDate;
    while (current.isBefore(endDate) || current.isSame(endDate)) {
      dates.push(current.format('YYYY-MM-DD'));
      current = current.add(1, unit);
    }
    
    return dates;
  },

  // 获取一周的日期标签
  getWeekLabels: () => {
    return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  },

  // 获取24小时标签
  getHourLabels: () => {
    return Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
  },
};

export default DateUtils; 