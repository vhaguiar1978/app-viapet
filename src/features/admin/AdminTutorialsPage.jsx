import { useEffect, useMemo, useState } from "react";
import "./AdminPages.css";
import { normalizeTutorialCategories, TUTORIAL_COLOR_OPTIONS } from "./tutorialsCatalog.js";

const EMPTY_CATEGORY_FORM = {
  id: "",
  name: "",
  description: "",
  color: "green",
  active: true,
  sort_order: 0,
};

const EMPTY_VIDEO_FORM = {
  id: "",
  category_id: "",
  title: "",
  youtube_url: "",
  description: "",
  active: true,
  sort_order: 0,
};

export default function AdminTutorialsPage({ apiRequest }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);
  const [videoForm, setVideoForm] = useState(EMPTY_VIDEO_FORM);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest("/admin/tutorial-categories");
      const nextCategories = normalizeTutorialCategories(response?.data || [], { includeInactive: true });
      setCategories(nextCategories);
      setVideoForm((current) => ({
        ...current,
        category_id: current.category_id || nextCategories[0]?.id || "",
      }));
    } catch (err) {
      setError(err?.message || "Falha ao carregar os tutoriais.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const totalVideos = useMemo(
    () => categories.reduce((sum, category) => sum + (category.videos?.length || 0), 0),
    [categories],
  );

  async function handleCategorySubmit(event) {
    event?.preventDefault();
    setError("");
    setFeedback("");
    try {
      const payload = {
        name: categoryForm.name,
        description: categoryForm.description,
        color: categoryForm.color,
        active: categoryForm.active,
        sort_order: Number(categoryForm.sort_order) || 0,
      };
      if (categoryForm.id) {
        await apiRequest(`/admin/tutorial-categories/${categoryForm.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setFeedback("Categoria atualizada com sucesso.");
      } else {
        await apiRequest("/admin/tutorial-categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setFeedback("Categoria criada com sucesso.");
      }
      setCategoryForm(EMPTY_CATEGORY_FORM);
      await load();
    } catch (err) {
      setError(err?.message || "Falha ao salvar a categoria.");
    }
  }

  async function handleVideoSubmit(event) {
    event?.preventDefault();
    setError("");
    setFeedback("");
    try {
      const payload = {
        category_id: videoForm.category_id,
        title: videoForm.title,
        youtube_url: videoForm.youtube_url,
        description: videoForm.description,
        active: videoForm.active,
        sort_order: Number(videoForm.sort_order) || 0,
      };
      if (videoForm.id) {
        await apiRequest(`/admin/tutorial-videos/${videoForm.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setFeedback("Vídeo atualizado com sucesso.");
      } else {
        await apiRequest("/admin/tutorial-videos", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setFeedback("Vídeo criado com sucesso.");
      }
      setVideoForm((current) => ({
        ...EMPTY_VIDEO_FORM,
        category_id: current.category_id || categories[0]?.id || "",
      }));
      await load();
    } catch (err) {
      setError(err?.message || "Falha ao salvar o vídeo.");
    }
  }

  function editCategory(category) {
    setCategoryForm({
      id: category.id,
      name: category.name || "",
      description: category.description || "",
      color: category.color || "green",
      active: category.active !== false,
      sort_order: Number(category.sort_order || 0),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editVideo(video, categoryId) {
    setVideoForm({
      id: video.id,
      category_id: categoryId,
      title: video.title || "",
      youtube_url: video.youtube_url || "",
      description: video.description || "",
      active: video.active !== false,
      sort_order: Number(video.sort_order || 0),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteCategory(category) {
    if (!window.confirm(`Excluir a categoria "${category.name}" e todos os vídeos dentro dela?`)) return;
    try {
      await apiRequest(`/admin/tutorial-categories/${category.id}`, { method: "DELETE" });
      setFeedback("Categoria removida com sucesso.");
      if (categoryForm.id === category.id) setCategoryForm(EMPTY_CATEGORY_FORM);
      await load();
    } catch (err) {
      setError(err?.message || "Falha ao excluir a categoria.");
    }
  }

  async function deleteVideo(video) {
    if (!window.confirm(`Excluir o vídeo "${video.title}"?`)) return;
    try {
      await apiRequest(`/admin/tutorial-videos/${video.id}`, { method: "DELETE" });
      setFeedback("Vídeo removido com sucesso.");
      if (videoForm.id === video.id) {
        setVideoForm((current) => ({
          ...EMPTY_VIDEO_FORM,
          category_id: current.category_id || categories[0]?.id || "",
        }));
      }
      await load();
    } catch (err) {
      setError(err?.message || "Falha ao excluir o vídeo.");
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h2>Tutoriais ViaPet</h2>
          <small>Cadastre categorias coloridas e organize os vídeos do botão de tutoriais do sistema.</small>
        </div>
        <div className="admin-page-actions">
          <button type="button" className="admin-btn-secondary" onClick={load} disabled={loading}>
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </header>

      {error ? <div className="admin-error">{error}</div> : null}
      {feedback ? <div className="admin-feedback">{feedback}</div> : null}

      <section className="admin-cards-row">
        <article className="admin-stat-card admin-stat-primary">
          <span className="admin-stat-kicker">Categorias ativas</span>
          <strong>{categories.length}</strong>
          <small>Grupos visíveis no botão de tutoriais.</small>
        </article>
        <article className="admin-stat-card admin-stat-info">
          <span className="admin-stat-kicker">Vídeos ativos</span>
          <strong>{totalVideos}</strong>
          <small>Itens ordenados dentro das categorias.</small>
        </article>
      </section>

      <section className="admin-form-grid admin-tutorials-forms">
        <div className="admin-form-card">
          <h3>{categoryForm.id ? "Editar categoria" : "Nova categoria"}</h3>
          <form onSubmit={handleCategorySubmit} className="admin-form-grid">
            <label className="admin-field">
              <span>Nome da categoria *</span>
              <input
                required
                className="admin-input"
                value={categoryForm.name}
                onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
                placeholder="Ex.: Agenda, Financeiro, Banho e tosa"
              />
            </label>
            <label className="admin-field">
              <span>Cor</span>
              <select
                className="admin-input"
                value={categoryForm.color}
                onChange={(event) => setCategoryForm({ ...categoryForm, color: event.target.value })}
              >
                {TUTORIAL_COLOR_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Ordem</span>
              <input
                type="number"
                min="0"
                className="admin-input"
                value={categoryForm.sort_order}
                onChange={(event) => setCategoryForm({ ...categoryForm, sort_order: event.target.value })}
              />
            </label>
            <label className="admin-field admin-field-grow">
              <span>Descrição da categoria</span>
              <input
                className="admin-input"
                value={categoryForm.description}
                onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })}
                placeholder="Resumo curto para identificar essa área"
              />
            </label>
            <label className="admin-field admin-field-checkbox">
              <input
                type="checkbox"
                checked={categoryForm.active}
                onChange={(event) => setCategoryForm({ ...categoryForm, active: event.target.checked })}
              />
              <span>Categoria ativa</span>
            </label>
            <div className="admin-form-actions">
              {categoryForm.id ? (
                <button type="button" className="admin-btn-secondary" onClick={() => setCategoryForm(EMPTY_CATEGORY_FORM)}>
                  Cancelar
                </button>
              ) : null}
              <button type="submit" className="admin-btn-primary">
                {categoryForm.id ? "Salvar categoria" : "Criar categoria"}
              </button>
            </div>
          </form>
        </div>

        <div className="admin-form-card">
          <h3>{videoForm.id ? "Editar vídeo" : "Novo vídeo"}</h3>
          <form onSubmit={handleVideoSubmit} className="admin-form-grid">
            <label className="admin-field">
              <span>Categoria *</span>
              <select
                required
                className="admin-input"
                value={videoForm.category_id}
                onChange={(event) => setVideoForm({ ...videoForm, category_id: event.target.value })}
              >
                <option value="">Selecione</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Ordem</span>
              <input
                type="number"
                min="0"
                className="admin-input"
                value={videoForm.sort_order}
                onChange={(event) => setVideoForm({ ...videoForm, sort_order: event.target.value })}
              />
            </label>
            <label className="admin-field admin-field-grow">
              <span>Título do vídeo *</span>
              <input
                required
                className="admin-input"
                value={videoForm.title}
                onChange={(event) => setVideoForm({ ...videoForm, title: event.target.value })}
                placeholder="Ex.: Como cadastrar responsável"
              />
            </label>
            <label className="admin-field admin-field-grow">
              <span>Link do YouTube *</span>
              <input
                required
                className="admin-input"
                value={videoForm.youtube_url}
                onChange={(event) => setVideoForm({ ...videoForm, youtube_url: event.target.value })}
                placeholder="https://youtube.com/..."
              />
            </label>
            <label className="admin-field admin-field-grow">
              <span>Descrição do vídeo</span>
              <textarea
                className="admin-input admin-textarea"
                value={videoForm.description}
                onChange={(event) => setVideoForm({ ...videoForm, description: event.target.value })}
                placeholder="Explique rapidamente o que esse tutorial ensina"
              />
            </label>
            <label className="admin-field admin-field-checkbox">
              <input
                type="checkbox"
                checked={videoForm.active}
                onChange={(event) => setVideoForm({ ...videoForm, active: event.target.checked })}
              />
              <span>Vídeo ativo</span>
            </label>
            <div className="admin-form-actions">
              {videoForm.id ? (
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setVideoForm({ ...EMPTY_VIDEO_FORM, category_id: categories[0]?.id || "" })}
                >
                  Cancelar
                </button>
              ) : null}
              <button type="submit" className="admin-btn-primary" disabled={!categories.length}>
                {videoForm.id ? "Salvar vídeo" : "Criar vídeo"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="admin-table-card">
        <header className="admin-table-header">
          <h3>Prévia do botão de tutoriais</h3>
        </header>
        <div className="tutorials-grid">
          {categories.map((category) => (
            <article key={category.id} className={`tutorial-card tutorial-${category.color}`}>
              <div className="admin-tutorial-card-head">
                <div>
                  <h3>{category.name}</h3>
                  {category.description ? <p className="admin-tutorial-card-copy">{category.description}</p> : null}
                </div>
                <span className="admin-pill admin-pill-info">{category.videos.length} vídeo(s)</span>
              </div>
              <div className="tutorial-list tutorial-video-list">
                {category.videos.map((video) => (
                  <article key={video.id} className="tutorial-video-item">
                    <strong>{video.title}</strong>
                    {video.youtube_url ? (
                      <a className="tutorial-video-link" href={video.youtube_url} target="_blank" rel="noreferrer">
                        Assistir no YouTube
                      </a>
                    ) : null}
                    {video.description ? <p className="tutorial-video-description">{video.description}</p> : null}
                    <div className="admin-addon-actions">
                      <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => editVideo(video, category.id)}>
                        Editar vídeo
                      </button>
                      <button type="button" className="admin-btn-danger admin-btn-sm" onClick={() => deleteVideo(video)}>
                        Excluir vídeo
                      </button>
                    </div>
                  </article>
                ))}
                {!category.videos.length ? <div className="admin-empty">Nenhum vídeo nessa categoria.</div> : null}
              </div>
              <div className="admin-addon-actions">
                <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => editCategory(category)}>
                  Editar categoria
                </button>
                <button type="button" className="admin-btn-danger admin-btn-sm" onClick={() => deleteCategory(category)}>
                  Excluir categoria
                </button>
              </div>
            </article>
          ))}
          {!categories.length ? <div className="admin-empty">Crie a primeira categoria para começar.</div> : null}
        </div>
      </section>
    </div>
  );
}
