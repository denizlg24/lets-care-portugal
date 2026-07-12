/**
 * Default content of the public about page, shown until the admin saves the
 * first version. Bodies are markdown rendered by `MarkdownRenderer`; images
 * are bundled files under `public/about`. Shared by the public page and the
 * admin editor, which starts prefilled with these sections.
 */
export interface DefaultAboutSection {
  title: string;
  body: string;
  image?: string;
  imageAlt?: string;
}

export const DEFAULT_ABOUT_SECTIONS: DefaultAboutSection[] = [
  {
    title: "Quem Somos",
    body: "No LeTs-Care Portugal, acreditamos que o envelhecimento não é apenas um indicador demográfico, mas sim um dos maiores e mais estimulantes desafios sociais do nosso tempo. Somos um ecossistema que une a investigação de excelência à ação prática, focado em transformar a forma como cuidamos e somos cuidados.",
    image: "/about/active_ageing.png",
    imageAlt: "Envelhecimento ativo — pessoas mais velhas em atividade",
  },
  {
    title: "A Nossa Missão",
    body: [
      "**Levar a ciência para onde a vida acontece: ao serviço das pessoas e das comunidades.**",
      "A nossa missão é cocriar, avaliar e otimizar programas e serviços de apoio que respondam de forma eficaz aos desafios do envelhecimento. Fazemo-lo quebrando as barreiras tradicionais do conhecimento: praticamos uma ciência aberta, viva e sem muros, que sai dos laboratórios e das universidades para se fixar no terreno.",
      "Desenvolvemos respostas sociais inovadoras e baseadas em evidência, capacitando quem cuida e qualificando o ecossistema de cuidados em Portugal.",
    ].join("\n\n"),
  },
  {
    title: "A Nossa Visão",
    body: [
      "**Ser a plataforma de referência nacional na intersecção entre a investigação social, a inovação em serviços de cuidado e as políticas públicas para o envelhecimento.**",
      "Aspiramos a um país onde o envelhecimento seja sinónimo de dignidade, inclusão e bem-estar, servindo de ponte indispensável para:",
      [
        "- **Instituições e Profissionais:** Oferecendo ferramentas, capacitação e modelos de intervenção validados que elevam a qualidade dos cuidados diários.",
        "- **Decisores Políticos (Nacionais e Locais):** Fornecendo dados robustos, métricas de impacto e recomendações estratégicas que sustentem políticas públicas mais justas, eficientes e de proximidade.",
        "- **Comunidades:** Promovendo territórios mais colaborativos, resilientes e preparados para abraçar a longevidade.",
      ].join("\n"),
    ].join("\n\n"),
  },
  {
    title: "Os Nossos Pilares de Ação",
    body: [
      "- **Ciência com Impacto:** Investigação aplicada que resolve problemas reais, gerando respostas práticas e replicáveis.",
      "- **Proximidade e Redes:** Trabalho colaborativo direto com os atores do ecossistema de cuidados, valorizando o saber de quem está no terreno.",
      "- **Inovação Social:** Redesenho de serviços e programas de apoio para responder às necessidades emergentes da população mais velha e dos seus cuidadores.",
    ].join("\n"),
  },
  {
    title: "O Que Nos Distingue",
    body: [
      "O que nos diferencia é a nossa forma de estar e de intervir. **Não partimos de fórmulas abstratas, mas sim dos contextos reais e dos sistemas complexos onde as coisas acontecem.**",
      "Não pretendemos ensinar ninguém a fazer o seu trabalho, nem impor modelos predefinidos a quem já conhece o terreno. O nosso papel é de parceria e de facilitação: queremos ajudar a potenciar e a elevar o que de excelente já se faz em Portugal.",
      "Trabalhamos lado a lado com as instituições e decisores para:",
      [
        "- **Otimizar recursos existentes**, maximizando o impacto de cada resposta social.",
        "- **Capacitar para decisões informadas**, traduzindo a ciência em dados práticos que orientam a estratégia política e institucional.",
        "- **Valorizar a identidade local**, reconhecendo e respeitando as especificidades, desafios e dinâmicas de cada comunidade.",
      ].join("\n"),
      "No LeTs-Care Portugal, a ciência não dita ordens; alia-se à experiência do terreno para desenhar o futuro dos cuidados.",
    ].join("\n\n"),
  },
];
