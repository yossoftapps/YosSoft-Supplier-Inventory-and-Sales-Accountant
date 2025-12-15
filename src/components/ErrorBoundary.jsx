import React from 'react';
import { Result, Button } from 'antd';
import { FrownOutlined } from '@ant-design/icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px' }}>
          <Result
            status="error"
            title="حدث خطأ غير متوقع"
            subTitle="نأسف لحدوث هذا الخطأ. يرجى المحاولة مرة أخرى."
            extra={[
              <Button 
                type="primary" 
                key="retry" 
                onClick={this.handleRetry}
                icon={<FrownOutlined />}
              >
                إعادة المحاولة
              </Button>
            ]}
          >
            {process.env.NODE_ENV === 'development' && (
              <div style={{ 
                textAlign: 'left', 
                backgroundColor: '#fff2f0', 
                border: '1px solid #ffccc7', 
                borderRadius: '4px', 
                padding: '16px',
                marginTop: '24px'
              }}>
                <h3>تفاصيل الخطأ:</h3>
                <p>{this.state.error && this.state.error.toString()}</p>
                <details style={{ direction: 'ltr', textAlign: 'left' }}>
                  {this.state.errorInfo.componentStack}
                </details>
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;