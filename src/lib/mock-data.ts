export interface IndicadorKAN {
  Campo: string;
  Valor: string;
  Descricao: string;
}

export interface SoftSkillScore {
  perfil: string;
  score: number;
  cor: string;
}

export type KanType = "Criação" | "Movimento" | "Finalidade";

export interface TalentoProfile {
  id: string;
  codigo: string;
  nome: string;
  email: string;
  data_nascimento: string;
  profissao: string;
  cargo: string;
  grupo: string;
  departamento: string;
  empresa: string;
  status: "Ativo" | "Em Avaliação" | "Candidato";
  avatar: string;
  linkedin_url?: string;
  experiencias?: string;
  kan_numero: number;
  kan_nome: KanType;
  estrutural: number;
  direcionamento: number;
  perfil_dominante: string;
  perfis_lista: string[];
  categorias_lista: string[];
  qualidades_lista: string[];
  vertices_triangulo: [number, number, number]; // [KAN vertex, Estrutural, Direcionamento]
  aderencia_vaga: number;
  indicadores_perfil: IndicadorKAN[];
  soft_skills: SoftSkillScore[];
  ai_diagnosis: string[];
}

export interface EquipeMember {
  nome: string;
  lider?: boolean;
}

export interface EquipeData {
  id: string;
  nome: string;
  empresa: string;
  departamento: string;
  foto_url?: string;
  membros: EquipeMember[];
  harmonia: number;
  triangulo_status: string;
  distribuicao: {
    Lider: number;
    Criativo: number;
    Executor: number;
    Resultado: number;
  };
}

export interface VagaData {
  id: number;
  nome_vaga: string;
  senioridade: "Junior" | "Pleno" | "Senior" | "Executivo";
  link_vaga?: string;
  empresa: string;
  departamento: string;
  kan_ideal: string[];
  perfis_ideais: string[];
  categorias_ideais: string[];
  qualidades_ideais: string[];
  descricao_vaga: string;
  equipe_associada?: string;
  candidatos_associados: string[];
  created_at: string;
}

export const KAN_OPCOES: KanType[] = ["Criação", "Movimento", "Finalidade"];

export const PERFIS_OPCOES = [
  "Lider",
  "Criativo",
  "Executor",
  "Resultado",
  "Vendedor",
  "Influenciador",
  "Comunicador",
];

export const CATEGORIAS_OPCOES = [
  "Justo",
  "Inovador",
  "Diplomático",
  "Realizador",
  "Versátil",
  "Visionário",
  "Magnético",
  "Analítico",
  "Organizado",
  "Harmônico",
  "Comunicativo",
  "Intuitivo",
  "Conhecimento",
];

export const QUALIDADES_OPCOES = [
  "Relacionamento",
  "Execução",
  "Análise",
  "Coletividade",
  "Justiça",
  "Praticidade e disciplina",
  "Comunicação",
  "Versatilidade",
  "Intuição",
  "Organização",
  "Serviço",
];

export const DEPARTAMENTOS_OPCOES = [
  "Diretoria Executiva",
  "Produto & Inovação",
  "Engenharia & Dados",
  "Comercial & Growth",
  "Gente & Cultura",
  "Operações & Finanças",
];

export const EMPRESAS_TENANT = [
  { id: "kan-corp", nome: "KantechRH Enterprise", plano: "Scale Master", cor: "#ea580c" },
  { id: "nexus-tech", nome: "Nexus Tecnologia S.A.", plano: "Corporate Pro", cor: "#8b5cf6" },
  { id: "valora-group", nome: "Grupo Valora Holding", plano: "Business", cor: "#10b981" },
];

export const TALENTOS_MOCK: TalentoProfile[] = [
  {
    id: "1",
    codigo: "58386974",
    nome: "Cristiano Corrêa de Almeida",
    email: "cristiano@kantechrh.com.br",
    data_nascimento: "14/08/1982",
    profissao: "Diretor Executivo & Estrategista RH",
    cargo: "CEO / Founder",
    grupo: "Board Executivo",
    departamento: "Diretoria Executiva",
    empresa: "KantechRH Enterprise",
    status: "Ativo",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    linkedin_url: "https://linkedin.com/in/cristiano-almeida",
    experiencias:
      "Mais de 18 anos liderando transformação organizacional, arquitetura comportamental e gestão de talentos de alta performance.",
    kan_numero: 8,
    kan_nome: "Finalidade",
    estrutural: 1,
    direcionamento: 7,
    perfil_dominante: "Líder Estrategista",
    perfis_lista: ["Lider", "Resultado", "Executor"],
    categorias_lista: ["Realizador", "Visionário", "Analítico"],
    qualidades_lista: ["Execução", "Análise", "Praticidade e disciplina", "Organização"],
    vertices_triangulo: [8, 1, 7],
    aderencia_vaga: 96,
    indicadores_perfil: [
      {
        Campo: "Índice KAN Central",
        Valor: "8 — Finalidade (Realizador Executivo)",
        Descricao:
          "Forte orientação para resultados concretos, governança, visão sistêmica de negócios e capacidade natural de estruturar operações escaláveis com alto padrão de exigência.",
      },
      {
        Campo: "Base Estrutural",
        Valor: "1 — Pioneirismo & Autonomia",
        Descricao:
          "Iniciativa proativa, independência intelectual e tração para abrir novos mercados. Atua melhor quando possui liberdade decisória para inovar em processos.",
      },
      {
        Campo: "Vetor de Direcionamento",
        Valor: "7 — Especialista Analítico",
        Descricao:
          "Busca constante por profundidade técnica, método científico e precisão estratégica. Não toma decisões por impulso; valida cenários com dados e indicadores.",
      },
      {
        Campo: "Fortaleza Comportamental",
        Valor: "Visão de Longo Prazo & Comando",
        Descricao:
          "Capacidade de manter a serenidade sob pressão, organizando equipes multidisciplinares em torno de metas claras e mensuráveis.",
      },
      {
        Campo: "Ponto de Atenção na Gestão",
        Valor: "Delegação & Ritmo de Exigência",
        Descricao:
          "Por possuir régua técnica elevada, pode centralizar decisões críticas se perceber baixa velocidade na equipe. Recomenda-se rituais objetivos de acompanhamento.",
      },
    ],
    soft_skills: [
      { perfil: "Líder", score: 94, cor: "#510851" },
      { perfil: "Resultado", score: 91, cor: "#ea580c" },
      { perfil: "Executor", score: 86, cor: "#8b5cf6" },
      { perfil: "Criativo", score: 82, cor: "#10b981" },
      { perfil: "Comunicador", score: 78, cor: "#6366f1" },
      { perfil: "Influenciador", score: 75, cor: "#f59e0b" },
      { perfil: "Vendedor", score: 72, cor: "#ec4899" },
    ],
    ai_diagnosis: [
      "O perfil avaliado apresenta uma combinação rara entre tração executiva de comando e rigor analítico. No ambiente corporativo, destaca-se pela capacidade de traduzir visões complexas em planos de ação estruturados, assumindo naturalmente a dianteira em projetos de expansão, reestruturação ou criação de novos produtos.",
      "Em termos de estilo de trabalho e dinâmica de equipe, opera com alta autonomia e foco em eficiência pragmática. Valoriza profissionais diretos, preparados e comprometidos com entregas mensuráveis, demonstrando excelente aderência a posições de Diretoria, C-Level ou liderança de unidades estratégicas de negócio.",
      "Para maximizar sua performance e sinergia organizacional, recomenda-se pareá-lo com gestores operacionais de acompanhamento contínuo (perfil integrador/processual), permitindo que seu foco permaneça concentrado nas decisões críticas, negociações de alto impacto e arquitetura estratégica da empresa.",
    ],
  },
  {
    id: "2",
    codigo: "47958597",
    nome: "Mariana Vasconcelos",
    email: "mariana.v@kantechrh.com.br",
    data_nascimento: "23/05/1991",
    profissao: "Head de Produto & UX",
    cargo: "Product Manager",
    grupo: "Product Squad",
    departamento: "Produto & Inovação",
    empresa: "KantechRH Enterprise",
    status: "Ativo",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    linkedin_url: "https://linkedin.com/in/marianavasconcelos",
    experiencias:
      "Liderança de squads ágeis, discovery de produto B2B SaaS e design organizacional centrado no usuário.",
    kan_numero: 5,
    kan_nome: "Movimento",
    estrutural: 3,
    direcionamento: 2,
    perfil_dominante: "Comunicador Criativo",
    perfis_lista: ["Criativo", "Comunicador", "Influenciador"],
    categorias_lista: ["Versátil", "Inovador", "Diplomático"],
    qualidades_lista: ["Comunicação", "Versatilidade", "Relacionamento", "Intuição"],
    vertices_triangulo: [5, 3, 2],
    aderencia_vaga: 92,
    indicadores_perfil: [
      {
        Campo: "Índice KAN Central",
        Valor: "5 — Movimento (Agente de Transformação)",
        Descricao:
          "Versatilidade cognitiva, adaptabilidade rápida a mudanças de mercado e facilidade para conectar diferentes áreas da empresa.",
      },
      {
        Campo: "Base Estrutural",
        Valor: "3 — Expressão & Criatividade",
        Descricao:
          "Alta fluência comunicativa, poder de síntese visual e habilidade para engajar stakeholders em apresentações executivas.",
      },
      {
        Campo: "Vetor de Direcionamento",
        Valor: "2 — Diplomacia & Sinergia",
        Descricao:
          "Atua como ponte entre áreas técnicas e comerciais, reduzindo atritos e promovendo colaboração genuína entre os membros.",
      },
    ],
    soft_skills: [
      { perfil: "Criativo", score: 95, cor: "#10b981" },
      { perfil: "Comunicador", score: 92, cor: "#6366f1" },
      { perfil: "Influenciador", score: 88, cor: "#f59e0b" },
      { perfil: "Líder", score: 79, cor: "#510851" },
      { perfil: "Vendedor", score: 81, cor: "#ec4899" },
      { perfil: "Resultado", score: 74, cor: "#ea580c" },
      { perfil: "Executor", score: 70, cor: "#8b5cf6" },
    ],
    ai_diagnosis: [
      "Profissional com forte inclinação para inovação, comunicação executiva e adaptabilidade em cenários dinâmicos. Possui leitura rápida de contexto e facilidade para destravar gargalos de relacionamento entre equipes técnicas e áreas de negócio.",
      "Seu estilo de atuação combina entusiasmo criativo com diplomacia tática, tornando-a altamente eficaz em papéis de Gestão de Produto, Liderança de Projetos Ágeis e Desenvolvimento de Negócios.",
      "Como recomendação de gestão, seu potencial atinge o ápice em ambientes com desafios variados e ciclos curtos de entrega, evitando rotinas excessivamente burocráticas ou repetitivas.",
    ],
  },
  {
    id: "3",
    codigo: "30583964",
    nome: "Rafael Mendonça",
    email: "rafael.m@kantechrh.com.br",
    data_nascimento: "11/11/1988",
    profissao: "Tech Lead & Arquiteto de Sistemas",
    cargo: "Engineering Lead",
    grupo: "Core Tech",
    departamento: "Engenharia & Dados",
    empresa: "KantechRH Enterprise",
    status: "Ativo",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    linkedin_url: "https://linkedin.com/in/rafaelmendonca",
    experiencias:
      "Arquitetura de microsserviços, segurança em nuvem, sistemas distribuídos em Python e React/Next.js.",
    kan_numero: 4,
    kan_nome: "Criação",
    estrutural: 7,
    direcionamento: 6,
    perfil_dominante: "Executor Analítico",
    perfis_lista: ["Executor", "Resultado", "Lider"],
    categorias_lista: ["Organizado", "Analítico", "Conhecimento"],
    qualidades_lista: ["Execução", "Organização", "Análise", "Praticidade e disciplina"],
    vertices_triangulo: [4, 7, 6],
    aderencia_vaga: 89,
    indicadores_perfil: [
      {
        Campo: "Índice KAN Central",
        Valor: "4 — Criação (Construtor de Processos)",
        Descricao:
          "Foco absoluto em estabilidade, qualidade arquitetural, cumprimento de prazos e organização metodológica.",
      },
      {
        Campo: "Base Estrutural",
        Valor: "7 — Profundidade Técnica",
        Descricao:
          "Domínio de sistemas complexos, investigação de causa-raiz e tomada de decisão embasada em evidências.",
      },
    ],
    soft_skills: [
      { perfil: "Executor", score: 96, cor: "#8b5cf6" },
      { perfil: "Resultado", score: 89, cor: "#ea580c" },
      { perfil: "Líder", score: 78, cor: "#510851" },
      { perfil: "Criativo", score: 72, cor: "#10b981" },
      { perfil: "Comunicador", score: 65, cor: "#6366f1" },
      { perfil: "Influenciador", score: 62, cor: "#f59e0b" },
      { perfil: "Vendedor", score: 58, cor: "#ec4899" },
    ],
    ai_diagnosis: [
      "Perfil altamente estruturado, metódico e orientado à excelência técnica. Representa o pilar de sustentação operacional de qualquer equipe de engenharia ou operações críticas.",
      "Trabalha com máxima eficiência quando os requisitos são claros e a qualidade técnica é valorizada acima de soluções improvisadas.",
      "Recomenda-se envolvê-lo desde o início no planejamento técnico de grandes entregas para garantir previsibilidade e mitigação de riscos.",
    ],
  },
  {
    id: "4",
    codigo: "48276925",
    nome: "Camila Albuquerque",
    email: "camila.alb@kantechrh.com.br",
    data_nascimento: "04/02/1994",
    profissao: "Executiva de Contas Enterprise",
    cargo: "Account Executive",
    grupo: "Growth B2B",
    departamento: "Comercial & Growth",
    empresa: "KantechRH Enterprise",
    status: "Em Avaliação",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    linkedin_url: "https://linkedin.com/in/camilaalbuquerque",
    experiencias: "Vendas complexas B2B SaaS, gestão de pipeline executivo e expansão de contas.",
    kan_numero: 3,
    kan_nome: "Movimento",
    estrutural: 5,
    direcionamento: 8,
    perfil_dominante: "Vendedor Influenciador",
    perfis_lista: ["Vendedor", "Influenciador", "Comunicador", "Resultado"],
    categorias_lista: ["Magnético", "Comunicativo", "Realizador"],
    qualidades_lista: ["Comunicação", "Relacionamento", "Versatilidade", "Execução"],
    vertices_triangulo: [3, 5, 8],
    aderencia_vaga: 94,
    indicadores_perfil: [
      {
        Campo: "Índice KAN Central",
        Valor: "3 — Movimento (Magnetismo & Persuasão)",
        Descricao:
          "Comunicação envolvente, presença executiva marcante e alta capacidade de contornar objeções em negociações complexas.",
      },
    ],
    soft_skills: [
      { perfil: "Vendedor", score: 95, cor: "#ec4899" },
      { perfil: "Influenciador", score: 93, cor: "#f59e0b" },
      { perfil: "Comunicador", score: 90, cor: "#6366f1" },
      { perfil: "Resultado", score: 87, cor: "#ea580c" },
      { perfil: "Líder", score: 80, cor: "#510851" },
      { perfil: "Criativo", score: 77, cor: "#10b981" },
      { perfil: "Executor", score: 69, cor: "#8b5cf6" },
    ],
    ai_diagnosis: [
      "Profissional com vocação comercial nata, combinando carisma interpessoal com ambição por metas agressivas de receita.",
      "Excelente desempenho em prospecção consultiva, fechamento de contas Enterprise e representação institucional da marca.",
      "Beneficia-se de metas claras de bonificação e CRM bem estruturado para canalizar sua energia em conversões de alto ticket.",
    ],
  },
  {
    id: "5",
    codigo: "51820437",
    nome: "Lucas Bittencourt",
    email: "lucas.b@kantechrh.com.br",
    data_nascimento: "19/09/1989",
    profissao: "Business Partner de RH",
    cargo: "HRBP Senior",
    grupo: "People & Culture",
    departamento: "Gente & Cultura",
    empresa: "KantechRH Enterprise",
    status: "Ativo",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    linkedin_url: "https://linkedin.com/in/lucasbittencourt",
    experiencias: "Desenvolvimento organizacional, clima, cultura e assessoria direta a lideranças.",
    kan_numero: 6,
    kan_nome: "Finalidade",
    estrutural: 2,
    direcionamento: 9,
    perfil_dominante: "Integrador Harmonizador",
    perfis_lista: ["Influenciador", "Comunicador", "Lider"],
    categorias_lista: ["Harmônico", "Diplomático", "Justo"],
    qualidades_lista: ["Coletividade", "Relacionamento", "Justiça", "Serviço"],
    vertices_triangulo: [6, 2, 9],
    aderencia_vaga: 91,
    indicadores_perfil: [
      {
        Campo: "Índice KAN Central",
        Valor: "6 — Finalidade (Guardião do Clima & Coesão)",
        Descricao:
          "Senso aguçado de justiça, empatia organizacional e mediação de conflitos em equipes sob alta pressão.",
      },
    ],
    soft_skills: [
      { perfil: "Influenciador", score: 90, cor: "#f59e0b" },
      { perfil: "Comunicador", score: 89, cor: "#6366f1" },
      { perfil: "Executor", score: 83, cor: "#8b5cf6" },
      { perfil: "Líder", score: 77, cor: "#510851" },
      { perfil: "Criativo", score: 75, cor: "#10b981" },
      { perfil: "Resultado", score: 73, cor: "#ea580c" },
      { perfil: "Vendedor", score: 68, cor: "#ec4899" },
    ],
    ai_diagnosis: [
      "Atua como elemento estabilizador da cultura organizacional, identificando rapidamente desalinhamentos comportamentais e promovendo retenção de talentos.",
      "Forte aderência à condução de avaliações de desempenho, onboarding executivo e desenvolvimento de lideranças.",
      "Gera alto valor quando posicionado próximo aos gestores de área para assessorar decisões de movimentação interna.",
    ],
  },
  {
    id: "6",
    codigo: "63947210",
    nome: "Beatriz Nogueira",
    email: "beatriz.n@kantechrh.com.br",
    data_nascimento: "28/03/1996",
    profissao: "Especialista em People Analytics",
    cargo: "Data Analyst",
    grupo: "Core Tech",
    departamento: "Engenharia & Dados",
    empresa: "KantechRH Enterprise",
    status: "Candidato",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    linkedin_url: "https://linkedin.com/in/beatriznogueira",
    experiencias: "Modelagem preditiva de turnover, dashboards executivos e estatística aplicada a RH.",
    kan_numero: 7,
    kan_nome: "Criação",
    estrutural: 4,
    direcionamento: 1,
    perfil_dominante: "Especialista Analítico",
    perfis_lista: ["Executor", "Resultado", "Criativo"],
    categorias_lista: ["Analítico", "Conhecimento", "Intuitivo"],
    qualidades_lista: ["Análise", "Organização", "Praticidade e disciplina", "Intuição"],
    vertices_triangulo: [7, 4, 1],
    aderencia_vaga: 88,
    indicadores_perfil: [
      {
        Campo: "Índice KAN Central",
        Valor: "7 — Criação (Inteligência de Dados & Precisão)",
        Descricao:
          "Capacidade investigativa superior, modelagem estatística e leitura de padrões ocultos em grandes volumes de dados.",
      },
    ],
    soft_skills: [
      { perfil: "Executor", score: 93, cor: "#8b5cf6" },
      { perfil: "Resultado", score: 86, cor: "#ea580c" },
      { perfil: "Criativo", score: 80, cor: "#10b981" },
      { perfil: "Líder", score: 72, cor: "#510851" },
      { perfil: "Comunicador", score: 68, cor: "#6366f1" },
      { perfil: "Influenciador", score: 64, cor: "#f59e0b" },
      { perfil: "Vendedor", score: 60, cor: "#ec4899" },
    ],
    ai_diagnosis: [
      "Perfil técnico de alta precisão, ideal para transformar indicadores brutos de RH em insights acionáveis para a diretoria.",
      "Prefere ambientes focados, com objetivos analíticos bem estruturados e baixa interrupção operacional.",
      "Excelente contratação para fortalecer o núcleo de inteligência de dados e diagnóstico preditivo.",
    ],
  },
];

export const WEEKLY_DIAGNOSTICS_CHART = [
  { dia: "Seg", mapeados: 42, lideranca: 14, aderencia: 12 },
  { dia: "Ter", mapeados: 58, lideranca: 19, aderencia: 15 },
  { dia: "Qua", mapeados: 49, lideranca: 16, aderencia: 11 },
  { dia: "Qui", mapeados: 64, lideranca: 22, aderencia: 18 },
  { dia: "Sex", mapeados: 52, lideranca: 18, aderencia: 14 },
  { dia: "Sáb", mapeados: 28, lideranca: 9, aderencia: 7 },
  { dia: "Dom", mapeados: 16, lideranca: 5, aderencia: 4 },
];

export const EQUIPES_MOCK: EquipeData[] = [
  {
    id: "eq-1",
    nome: "Squad Core Product & IA",
    empresa: "KantechRH Enterprise",
    departamento: "Produto & Inovação",
    membros: [
      { nome: "Cristiano Corrêa de Almeida", lider: true },
      { nome: "Mariana Vasconcelos", lider: false },
      { nome: "Rafael Mendonça", lider: false },
      { nome: "Beatriz Nogueira", lider: false },
    ],
    harmonia: 91.4,
    triangulo_status: "Encaixe Muito Alto",
    distribuicao: { Lider: 28, Criativo: 32, Executor: 25, Resultado: 15 },
  },
  {
    id: "eq-2",
    nome: "Comitê Executivo & Expansão",
    empresa: "KantechRH Enterprise",
    departamento: "Diretoria Executiva",
    membros: [
      { nome: "Mariana Vasconcelos", lider: true },
      { nome: "Cristiano Corrêa de Almeida", lider: false },
      { nome: "Camila Albuquerque", lider: false },
      { nome: "Lucas Bittencourt", lider: false },
    ],
    harmonia: 86.8,
    triangulo_status: "Encaixe Muito Alto",
    distribuicao: { Lider: 38, Criativo: 22, Executor: 18, Resultado: 22 },
  },
  {
    id: "eq-3",
    nome: "Engenharia de Plataforma & Dados",
    empresa: "KantechRH Enterprise",
    departamento: "Engenharia & Dados",
    membros: [
      { nome: "Rafael Mendonça", lider: true },
      { nome: "Beatriz Nogueira", lider: false },
      { nome: "Cristiano Corrêa de Almeida", lider: false },
    ],
    harmonia: 84.2,
    triangulo_status: "Bom Encaixe",
    distribuicao: { Lider: 15, Criativo: 20, Executor: 45, Resultado: 20 },
  },
];

export const VAGAS_MOCK: VagaData[] = [
  {
    id: 101,
    nome_vaga: "Head de Operações Comerciais",
    senioridade: "Senior",
    link_vaga: "https://kantechrh.com.br/vagas/head-comercial",
    empresa: "KantechRH Enterprise",
    departamento: "Comercial & Growth",
    kan_ideal: ["Movimento", "Finalidade"],
    perfis_ideais: ["Lider", "Resultado", "Vendedor", "Influenciador"],
    categorias_ideais: ["Realizador", "Magnético", "Visionário"],
    qualidades_ideais: ["Comunicação", "Execução", "Relacionamento", "Versatilidade"],
    descricao_vaga:
      "Liderar a operação de vendas B2B Enterprise, estruturar playbook comercial consultivo e escalar receita recorrente (ARR) junto a grandes contas.",
    equipe_associada: "Comitê Executivo & Expansão",
    candidatos_associados: [
      "Camila Albuquerque",
      "Cristiano Corrêa de Almeida",
      "Mariana Vasconcelos",
      "Lucas Bittencourt",
    ],
    created_at: "2026-10-15",
  },
  {
    id: 102,
    nome_vaga: "Tech Lead Full-Stack (Next.js / Python)",
    senioridade: "Senior",
    link_vaga: "https://kantechrh.com.br/vagas/tech-lead",
    empresa: "KantechRH Enterprise",
    departamento: "Engenharia & Dados",
    kan_ideal: ["Criação", "Finalidade"],
    perfis_ideais: ["Executor", "Resultado", "Lider"],
    categorias_ideais: ["Analítico", "Organizado", "Conhecimento"],
    qualidades_ideais: ["Execução", "Análise", "Organização", "Praticidade e disciplina"],
    descricao_vaga:
      "Conduzir a arquitetura de microsserviços em contenedores Docker, liderar code reviews, garantir segurança de dados no Supabase e alta disponibilidade.",
    equipe_associada: "Squad Core Product & IA",
    candidatos_associados: [
      "Rafael Mendonça",
      "Beatriz Nogueira",
      "Cristiano Corrêa de Almeida",
    ],
    created_at: "2026-10-20",
  },
  {
    id: 103,
    nome_vaga: "Business Partner de Gente & Cultura",
    senioridade: "Pleno",
    link_vaga: "https://kantechrh.com.br/vagas/hrbp-pleno",
    empresa: "KantechRH Enterprise",
    departamento: "Gente & Cultura",
    kan_ideal: ["Movimento", "Finalidade"],
    perfis_ideais: ["Comunicador", "Influenciador", "Criativo"],
    categorias_ideais: ["Harmônico", "Diplomático", "Justo"],
    qualidades_ideais: ["Relacionamento", "Coletividade", "Comunicação", "Serviço"],
    descricao_vaga:
      "Atuar como guardião do clima organizacional, apoiando líderes de produto e engenharia com diagnósticos comportamentais e planos de desenvolvimento.",
    equipe_associada: "Squad Core Product & IA",
    candidatos_associados: ["Lucas Bittencourt", "Mariana Vasconcelos"],
    created_at: "2026-10-24",
  },
];
