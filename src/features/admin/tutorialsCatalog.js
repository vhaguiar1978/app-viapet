export const TUTORIAL_COLOR_OPTIONS = [
  { value: "green", label: "Verde dashboard" },
  { value: "purple", label: "Roxo dashboard" },
  { value: "gold", label: "Dourado dashboard" },
  { value: "blue", label: "Azul dashboard" },
  { value: "navy", label: "Azul escuro dashboard" },
];

export const DEFAULT_TUTORIAL_CATEGORIES = [
  {
    id: "tutorial-category-pets",
    name: "Cadastro de Animais",
    description: "Tutoriais de pets, prontuários e documentos.",
    color: "green",
    active: true,
    sort_order: 1,
    videos: [
      { id: "tutorial-video-pets-1", title: "Cadastrando Pets", youtube_url: "", description: "", active: true, sort_order: 1 },
      { id: "tutorial-video-pets-2", title: "Anotando Eventos Clínicos", youtube_url: "", description: "", active: true, sort_order: 2 },
      { id: "tutorial-video-pets-3", title: "Emitindo Prescrições", youtube_url: "", description: "", active: true, sort_order: 3 },
      { id: "tutorial-video-pets-4", title: "Emitindo Documentos Padronizados", youtube_url: "", description: "", active: true, sort_order: 4 },
    ],
  },
  {
    id: "tutorial-category-products",
    name: "Produtos e Serviços",
    description: "Produtos, serviços, meios de pagamento e estoque.",
    color: "purple",
    active: true,
    sort_order: 2,
    videos: [
      { id: "tutorial-video-products-1", title: "Cadastrando Produtos", youtube_url: "", description: "", active: true, sort_order: 1 },
      { id: "tutorial-video-products-2", title: "Cadastrando Serviços", youtube_url: "", description: "", active: true, sort_order: 2 },
      { id: "tutorial-video-products-3", title: "Cadastrando Meios de Pagamento", youtube_url: "", description: "", active: true, sort_order: 3 },
      { id: "tutorial-video-products-4", title: "Controlando Estoque", youtube_url: "", description: "", active: true, sort_order: 4 },
    ],
  },
  {
    id: "tutorial-category-finance",
    name: "Controle Financeiro",
    description: "Caixa, ViaCentral e gestão financeira.",
    color: "gold",
    active: true,
    sort_order: 3,
    videos: [
      { id: "tutorial-video-finance-1", title: "Realizando o Controle Financeiro", youtube_url: "", description: "", active: true, sort_order: 1 },
      { id: "tutorial-video-finance-2", title: "Controlando o Caixa", youtube_url: "", description: "", active: true, sort_order: 2 },
      { id: "tutorial-video-finance-3", title: "Utilizando o Painel ViaCentral", youtube_url: "", description: "", active: true, sort_order: 3 },
      { id: "tutorial-video-finance-4", title: "Pesquisando Devedores", youtube_url: "", description: "", active: true, sort_order: 4 },
    ],
  },
  {
    id: "tutorial-category-vaccines",
    name: "Vacinas e Exames",
    description: "Rotinas de vacinação e exames.",
    color: "blue",
    active: true,
    sort_order: 4,
    videos: [
      { id: "tutorial-video-vaccines-1", title: "Cadastrando Planos de Vacinação", youtube_url: "", description: "", active: true, sort_order: 1 },
    ],
  },
  {
    id: "tutorial-category-others",
    name: "Outros Tutoriais",
    description: "Fluxos gerais do sistema.",
    color: "navy",
    active: true,
    sort_order: 5,
    videos: [
      { id: "tutorial-video-others-1", title: "Cadastrando Usuários", youtube_url: "", description: "", active: true, sort_order: 1 },
    ],
  },
];

export function normalizeTutorialCategories(items = [], { includeInactive = false } = {}) {
  return (Array.isArray(items) ? items : [])
    .map((category, index) => ({
      id: category?.id || `tutorial-category-${index}`,
      name: String(category?.name || "Categoria sem nome"),
      description: String(category?.description || ""),
      color: TUTORIAL_COLOR_OPTIONS.some((item) => item.value === category?.color) ? category.color : "green",
      active: category?.active !== false,
      sort_order: Number(category?.sort_order || index + 1) || index + 1,
      videos: (Array.isArray(category?.videos) ? category.videos : [])
        .filter((video) => includeInactive || video?.active !== false)
        .map((video, videoIndex) => ({
          id: video?.id || `${category?.id || index}-video-${videoIndex}`,
          title: String(video?.title || "Vídeo sem título"),
          youtube_url: String(video?.youtube_url || ""),
          description: String(video?.description || ""),
          active: video?.active !== false,
          sort_order: Number(video?.sort_order || videoIndex + 1) || videoIndex + 1,
        }))
        .sort((left, right) => {
          if (left.sort_order !== right.sort_order) return left.sort_order - right.sort_order;
          return left.title.localeCompare(right.title, "pt-BR");
        }),
    }))
    .filter((category) => includeInactive || category.active !== false)
    .sort((left, right) => {
      if (left.sort_order !== right.sort_order) return left.sort_order - right.sort_order;
      return left.name.localeCompare(right.name, "pt-BR");
    });
}
