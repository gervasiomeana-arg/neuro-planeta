import { Component, type ReactNode } from 'react';

/** Keep navigation and saved profiles available if an activity cannot render. */
export default class ActivityErrorBoundary extends Component<{
  children: ReactNode;
  onBack?: () => void;
  fallback?: ReactNode;
}, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return <section className="np-activity-recovery" role="alert" aria-label="Actividad no disponible">
      <h3>No pudimos abrir esta actividad</h3>
      <p>Podés volver a intentar o regresar al inicio. No borres los datos del navegador para resolverlo.</p>
      <div className="np-learning-actions">
        <button type="button" className="np-learning-primary" onClick={() => this.setState({ failed: false })}>Volver a intentar</button>
        {this.props.onBack && <button type="button" className="np-learning-secondary" onClick={this.props.onBack}>Regresar al inicio</button>}
      </div>
      <p>Si sigue ocurriendo después de una actualización, cerrá esta pestaña y volvé a abrir NeuroPlaneta. Una actividad en curso puede quedar sin registrar.</p>
    </section>;
  }
}
