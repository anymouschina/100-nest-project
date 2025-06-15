import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import DailyReportPage from './pages/DailyReportPage';
import './index.css';

// Ant Design 主题配置
const theme = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    borderRadius: 6,
  },
};

function App() {
  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/daily-report" replace />} />
            <Route path="/daily-report" element={<DailyReportPage />} />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App; 