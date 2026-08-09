import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('GymsLab Error Boundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          padding: '2rem',
          textAlign: 'center',
          color: '#ffffff',
          background: 'var(--bg-dark, #080c14)'
        }}>
          <AlertTriangle size={48} color="var(--accent-rose, #ef4444)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Oops! Something went wrong</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', maxWidth: '420px', marginBottom: '1.5rem' }}>
            The app encountered a temporary UI state issue. Your workout data is safely saved in local storage!
          </p>

          <button
            onClick={this.handleReload}
            className="btn-primary"
            style={{ padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} /> Reload App & Restore
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
