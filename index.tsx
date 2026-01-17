
import React, { Component, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

// Added ErrorBoundaryProps and ErrorBoundaryState to Component generic definition
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Use public/private modifiers or standard class syntax to ensure state is recognized
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Critical UI Error:", error, errorInfo);
  }

  render() {
    const { hasError, error } = this.state;

    if (hasError) {
      return (
        <div style={{
          padding: '40px', 
          fontFamily: 'Inter, sans-serif', 
          textAlign: 'center', 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: '#f9fafb'
        }}>
          <h1 style={{color: '#ef4444', fontSize: '24px', fontWeight: 'bold'}}>Erro de Inicialização</h1>
          <p style={{color: '#6b7280', marginTop: '10px'}}>Algo deu errado na renderização do App.</p>
          <pre style={{
            background: '#ffffff', 
            padding: '20px', 
            borderRadius: '12px', 
            border: '1px solid #e5e7eb',
            marginTop: '20px', 
            fontSize: '12px',
            maxWidth: '80%',
            overflowX: 'auto'
          }}>
            {error?.message || error?.toString()}
          </pre>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }} 
            style={{
              marginTop: '20px',
              padding: '10px 24px', 
              background: '#4f46e5', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Resetar App e Tentar Novamente
          </button>
        </div>
      );
    }
    
    // Using this.props correctly after adding props to generic
    return this.props.children;
  }
}

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}