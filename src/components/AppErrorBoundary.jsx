import { Component } from "react";

export class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Erro inesperado ao exibir o ViaPet:", error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="app-error-screen" role="alert">
        <section className="app-error-card">
          <span className="app-error-kicker">ViaPet</span>
          <h1>Não foi possível exibir esta tela</h1>
          <p>Seus dados continuam salvos. Tente abrir a tela novamente ou volte ao início.</p>
          <div className="app-error-actions">
            <button type="button" onClick={() => window.location.reload()}>
              Tentar novamente
            </button>
            <button type="button" className="app-error-secondary" onClick={() => window.location.assign("/")}>
              Voltar ao início
            </button>
          </div>
        </section>
      </main>
    );
  }
}
