import React from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('GymsLab Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleResetApp = () => {
    if (window.confirm('Reset app storage and reload? This will clear local cache and restore standard split.')) {
      localStorage.clear();
      try {
        indexedDB.deleteDatabase('GymsLabDB');
      } catch (e) {}
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '85vh',
          padding: '2rem 1rem',
          textAlign: 'center',
          color: '#ffffff',
          background: 'var(--bg-dark, #080c14)'
        }}>
          <AlertTriangle size={52} color="var(--accent-rose, #ef4444)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>UI State Error Encountered</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', maxWidth: '480px', marginBottom: '1rem' }}>
            The app caught a rendering issue. Detailed error details are below:
          </p>

          {/* Exact Error Message Display */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            maxWidth: '520px',
            width: '100%',
            marginBottom: '1.5rem',
            textAlign: 'left',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            color: '#fca5a5',
            overflowX: 'auto',
            maxHeight: '160px'
          }}>
            <strong>{this.state.error ? this.state.error.toString() : 'Unknown UI Error'}</strong>
            {this.state.errorInfo?.componentStack && (
              <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', color: '#94a3b8', fontSize: '0.7rem' }}>
                {this.state.errorInfo.componentStack.slice(0, 300)}
              </pre>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleReload}
              className="btn-primary"
              style={{ padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={16} /> Reload App
            </button>

            <button
              onClick={this.handleResetApp}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--accent-rose, #ef4444)',
                color: 'var(--accent-rose, #ef4444)',
                padding: '0.85rem 1.25rem',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Trash2 size={16} /> Clear Storage & Reset
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
