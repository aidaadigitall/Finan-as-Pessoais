
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

// Fix: Correctly extend Component with generics to ensure 'this.props' is typed.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("UI Critical Error:", error, errorInfo);
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
          backgroundColor: '#0b0e14',
          color: 'white'
        }}>
          <h1 style={{color: '#ef4444', fontSize: '24px', fontWeight: 'bold'}}>Erro de Inicialização</h1>
          <p style={{color: '#9ca3af', marginTop: '10px'}}>Não foi possível renderizar a interface.</p>
          <pre style={{
            background: '#1f2937', 
            padding: '20px', 
            borderRadius: '12px', 
            border: '1px solid #374151',
            marginTop: '20px', 
            fontSize: '12px',
            maxWidth: '80%',
            overflowX: 'auto',
            color: '#f87171'
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
              padding: '12px 24px', 
              background: '#4f46e5', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Resetar e Tentar Novamente
          </button>
        </div>
      );
    }
    
    // Fix: Access children from props using this.props in a class component.
    return this.props.children || null;
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