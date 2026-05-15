import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Root-level error boundary to prevent silent white screens on web.
 * Catches any unhandled render errors and displays a styled dark-mode recovery UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console so it shows up in Netlify function logs / browser console
    console.error('[ErrorBoundary] Uncaught render error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>⚠️</Text>
          </View>
          <Text style={styles.title}>Data Loading Error</Text>
          <Text style={styles.message} selectable>
            {this.state.error?.message ?? 'An unexpected error occurred while loading app data.'}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={this.handleRetry}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
          <Text style={styles.hint}>
            If this persists, try refreshing the page or clearing your browser cache.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2E2E2E',
  },
  icon: {
    fontSize: 32,
  },
  title: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: '700',
  },
  message: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  button: {
    marginTop: 8,
    backgroundColor: '#FFD700',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  buttonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  hint: {
    color: '#555555',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 260,
  },
});
