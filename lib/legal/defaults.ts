import type { LegalSlug } from "@/lib/legal/constants";

export interface DefaultLegalPage {
  title: string;
  content: string;
}

/**
 * Default legal texts, written for Portuguese law (RGPD/Lei n.º 58/2019,
 * Lei n.º 41/2004, Decreto-Lei n.º 83/2018) and for what this site actually
 * does: formulário de contacto, comentários pseudónimos no blog, sem
 * analytics, vídeos YouTube em modo de privacidade melhorada, alojamento na
 * Universidade do Porto. Shown until an admin saves an edited version; also
 * used by the admin editor's "repor conteúdo padrão" action.
 *
 * These are sensible defaults, not legal advice — the project team should
 * review them (names, contactos, prazos) before launch.
 */
export const DEFAULT_LEGAL_PAGES: Record<LegalSlug, DefaultLegalPage> = {
  privacidade: {
    title: "Política de Privacidade",
    content: `Esta política explica como a equipa do projeto **LeTs-Care Portugal** trata os dados pessoais recolhidos através deste site, em conformidade com o Regulamento Geral sobre a Proteção de Dados (Regulamento (UE) 2016/679, "RGPD") e com a Lei n.º 58/2019, de 8 de agosto.

## 1. Responsável pelo tratamento

O responsável pelo tratamento dos dados é a equipa portuguesa do projeto LeTs-Care, acolhida pela Faculdade de Letras da Universidade do Porto (FLUP). Para qualquer questão sobre esta política ou sobre os seus dados, contacte-nos através da [página de contactos](/contactos).

## 2. Que dados recolhemos e porquê

### Formulário de contacto

Quando nos escreve através do formulário de contacto, recolhemos: **nome**, **endereço de email**, **assunto** e **mensagem**, e, se optar por indicá-los, **afiliação** e **cargo**. Registamos também a localização aproximada (país, região e cidade) a partir do pedido, para fins estatísticos. O endereço IP **não é conservado** — é usado apenas, de forma transitória, para prevenir abusos (limitação de pedidos).

- **Finalidade:** responder ao seu pedido e manter o histórico da conversa.
- **Fundamento jurídico:** diligências pré-contratuais a seu pedido e interesse legítimo da equipa em responder a quem a contacta (art. 6.º, n.º 1, alíneas b) e f) do RGPD).
- **Prazo de conservação:** os pedidos são conservados enquanto forem necessários à resposta e eliminados, o mais tardar, dois anos após a sua conclusão.

### Comentários no blog

Os comentários são publicados sob um **pseudónimo** escolhido por si (ou gerado automaticamente). Não pedimos email nem criação de conta. A associação entre o seu navegador e os seus comentários é feita por um identificador guardado localmente no seu dispositivo (ver a [Política de Cookies](/cookies)); podemos eliminá-la limpando os dados do site no navegador.

- **Finalidade:** permitir a participação na discussão dos artigos e a respetiva moderação.
- **Fundamento jurídico:** interesse legítimo na dinamização e moderação do blog (art. 6.º, n.º 1, alínea f) do RGPD).
- **Prazo de conservação:** enquanto o artigo estiver publicado ou até o comentário ser removido.

### Estatísticas de visualização

As contagens de visualizações dos artigos são **anónimas e agregadas**. Este site **não utiliza serviços de analytics** nem constrói perfis de visitantes.

### Área de administração

As contas de acesso à área de administração pertencem exclusivamente a membros da equipa do projeto e são tratadas no âmbito dessa relação.

## 3. Com quem partilhamos os dados

Não vendemos nem cedemos os seus dados. Recorremos apenas aos seguintes prestadores, na medida do estritamente necessário:

- **Universidade do Porto** — alojamento do site e da base de dados, em Portugal.
- **Serviço de armazenamento de ficheiros do projeto** — guarda os documentos e imagens publicados no site (não recebe dados dos formulários).
- **Resend** — envio de emails transacionais (por exemplo, notificações de contacto). Este prestador está estabelecido nos Estados Unidos; a transferência é enquadrada por cláusulas contratuais-tipo aprovadas pela Comissão Europeia.

Os vídeos incorporados são servidos pelo YouTube em **modo de privacidade melhorada** (youtube-nocookie.com): não são definidos cookies de rastreio antes de o utilizador reproduzir um vídeo.

## 4. Os seus direitos

Nos termos do RGPD, tem o direito de solicitar o **acesso** aos seus dados, a sua **retificação** ou **apagamento**, a **limitação** do tratamento, a **portabilidade** e o direito de **oposição**. Pode exercê-los através da [página de contactos](/contactos).

Tem ainda o direito de apresentar reclamação à autoridade de controlo portuguesa: **Comissão Nacional de Proteção de Dados (CNPD)** — [www.cnpd.pt](https://www.cnpd.pt).

## 5. Segurança

O site é servido exclusivamente por HTTPS, o acesso à área de administração é restrito e autenticado, e são efetuadas cópias de segurança regulares da base de dados.

## 6. Decisões automatizadas e menores

Não tomamos decisões exclusivamente automatizadas com efeitos jurídicos sobre si, nem definimos perfis. Este site não se dirige a menores de 16 anos e não recolhemos conscientemente dados de menores.

## 7. Alterações a esta política

Esta política pode ser atualizada para refletir alterações no site ou na lei. A data da última atualização é indicada no topo da página. Alterações relevantes serão destacadas na página inicial.`,
  },

  termos: {
    title: "Termos e Condições",
    content: `Estes termos regulam a utilização do site do projeto **LeTs-Care Portugal** (lets-care-portugal.letras.up.pt). Ao navegar no site, aceita estas condições.

## 1. O site e o projeto

Este site divulga a atividade da equipa portuguesa do projeto europeu **LeTs-Care — Learning from Long-Term Care practices for the European Care Strategy**, acolhida pela Faculdade de Letras da Universidade do Porto. O site tem finalidade **informativa, educativa e de divulgação científica**.

Os conteúdos publicados — incluindo artigos do blog, relatórios e recursos — **não constituem aconselhamento médico, jurídico ou profissional**. Para decisões sobre cuidados de saúde ou apoio social, consulte os profissionais e serviços competentes.

## 2. Propriedade intelectual

Salvo indicação em contrário, os textos, imagens, relatórios e restantes conteúdos deste site pertencem à equipa do projeto LeTs-Care Portugal, aos seus parceiros ou aos respetivos autores, e estão protegidos pelo Código do Direito de Autor e dos Direitos Conexos.

- É permitida a **citação e reutilização para fins educativos, de investigação e não comerciais**, com indicação da fonte e do autor.
- Os recursos disponibilizados para descarregamento (relatórios, artigos, recomendações políticas e materiais pedagógicos) destinam-se a uso pessoal, educativo e de investigação, com a devida atribuição.
- Os logótipos do projeto, dos parceiros e da União Europeia não podem ser utilizados sem autorização.

Alguns conteúdos (por exemplo, notícias na imprensa ou artigos científicos publicados em revistas) pertencem a terceiros e regem-se pelas condições desses titulares.

## 3. Comentários

Os comentários no blog destinam-se à discussão dos temas publicados. Não é permitido publicar conteúdos ilegais, difamatórios, discriminatórios, publicitários ou que identifiquem terceiros sem o seu consentimento. Os comentários são moderados: a equipa reserva-se o direito de não publicar ou de remover comentários que violem estas regras, sem aviso prévio. Cada autor é responsável pelo conteúdo que publica.

## 4. Ligações e conteúdos de terceiros

O site contém ligações para sites de terceiros (por exemplo, órgãos de comunicação social, editoras científicas e YouTube). Essas ligações são disponibilizadas por conveniência: a equipa do projeto não controla esses sites nem se responsabiliza pelos seus conteúdos ou práticas de privacidade.

## 5. Disponibilidade e responsabilidade

Procuramos manter o site disponível e os conteúdos corretos e atualizados, mas não garantimos a ausência de erros, interrupções ou desatualizações. Na máxima medida permitida pela lei portuguesa, a equipa do projeto não é responsável por danos resultantes da utilização, ou impossibilidade de utilização, do site ou dos seus conteúdos.

## 6. Financiamento europeu

Este projeto é financiado pela União Europeia. Os pontos de vista e opiniões expressos neste site são, todavia, exclusivamente dos autores e não refletem necessariamente os da União Europeia ou da entidade financiadora. Nem a União Europeia nem a entidade financiadora podem ser responsabilizadas por eles.

## 7. Lei aplicável e foro

Estes termos regem-se pela **lei portuguesa**. Para qualquer litígio emergente da utilização deste site são competentes os tribunais portugueses, sendo eleito o foro da comarca do Porto, sem prejuízo das normas legais imperativas aplicáveis.

## 8. Alterações

Estes termos podem ser alterados a qualquer momento, produzindo efeitos a partir da sua publicação nesta página. A data da última atualização é indicada no topo.`,
  },

  cookies: {
    title: "Política de Cookies",
    content: `Esta página explica, nos termos da Lei n.º 41/2004, de 18 de agosto, e do RGPD, o que este site guarda no seu dispositivo — e, sobretudo, o que **não** guarda.

## 1. O essencial

O site público do projeto LeTs-Care Portugal **não define cookies** e não utiliza cookies de análise, de publicidade ou de rastreio, nem serviços de analytics de terceiros. Por essa razão, não apresentamos um banner de consentimento de cookies: tudo o que é guardado no seu dispositivo resulta de uma ação sua e está descrito abaixo.

## 2. Armazenamento local (localStorage)

Para participar nos comentários do blog sem criar conta, o site guarda no armazenamento local do seu navegador:

| Chave | Para quê |
| --- | --- |
| lc_blog_name | O pseudónimo que escolheu (ou que foi gerado) para assinar comentários. |
| lc_blog_session | Um identificador aleatório que permite mostrar-lhe os seus próprios comentários pendentes de moderação. |

Estes valores ficam apenas no seu dispositivo, não são usados para publicidade nem partilhados com terceiros, e permanecem até limpar os dados do site no navegador.

## 3. Conteúdos de terceiros: vídeos do YouTube

Os webinars e outros vídeos são incorporados através de **youtube-nocookie.com**, o modo de privacidade melhorada do YouTube: nenhum cookie de rastreio é definido enquanto não reproduzir um vídeo. Se optar por reproduzir, o YouTube (Google) pode definir cookies próprios, regidos pela [política de privacidade da Google](https://policies.google.com/privacy).

## 4. Como gerir e eliminar

Pode, a qualquer momento, bloquear ou eliminar cookies e dados de sites nas definições do seu navegador (procure por "cookies" ou "dados de sites" nas definições de privacidade do Chrome, Firefox, Safari ou Edge). Eliminar os dados deste site apaga também o seu pseudónimo de comentador.

## 5. Alterações

Se o site passar a utilizar cookies, esta política será atualizada e, se a lei o exigir, ser-lhe-á pedido consentimento prévio.`,
  },

  acessibilidade: {
    title: "Declaração de Acessibilidade",
    content: `A equipa do projeto **LeTs-Care Portugal** está empenhada em disponibilizar este site a todas as pessoas, independentemente das suas capacidades, em linha com o Decreto-Lei n.º 83/2018, de 19 de outubro, a norma europeia **EN 301 549** e as **Diretrizes de Acessibilidade para Conteúdo Web (WCAG) 2.1**, nível AA.

## 1. Estado de conformidade

Este site está **parcialmente conforme** com as WCAG 2.1, nível AA. "Parcialmente conforme" significa que a maioria dos conteúdos cumpre a norma, existindo ainda as exceções listadas abaixo.

## 2. Medidas adotadas

- Estrutura semântica de cabeçalhos, landmarks e listas em todas as páginas;
- Navegação completa por teclado, com indicadores de foco visíveis;
- Contraste de cores conforme os rácios mínimos do nível AA;
- Textos alternativos nas imagens com significado e ocultação das decorativas;
- Respeito pela preferência do sistema por **movimento reduzido** — as animações são desativadas quando essa preferência está ativa;
- Formulários com etiquetas explícitas e mensagens de erro descritivas;
- Layout adaptável (responsive) e funcional com zoom até 200 %.

## 3. Conteúdos não acessíveis

- **Documentos PDF**: alguns relatórios e newsletters, sobretudo os produzidos por terceiros ou anteriores a esta declaração, podem não estar totalmente acessíveis (por exemplo, sem marcação de estrutura). Quando possível, disponibilizamos alternativas — contacte-nos se precisar de um documento em formato acessível.
- **Vídeos**: alguns webinars alojados no YouTube podem não ter legendas em português ou audiodescrição.
- **Materiais interativos**: alguns materiais pedagógicos interativos podem ter limitações de acessibilidade próprias.
- **Conteúdos de terceiros**: notícias e artigos alojados em sites externos estão fora do nosso controlo.

## 4. Elaboração desta declaração

Esta declaração foi elaborada em 12 de julho de 2026, com base numa **autoavaliação** realizada pela equipa do projeto, e será revista à medida que o site evolui.

## 5. Comentários e pedidos

Se encontrar uma barreira de acessibilidade neste site, ou se precisar de um conteúdo num formato alternativo, contacte-nos através da [página de contactos](/contactos). Procuramos responder no prazo de **10 dias úteis**.

## 6. Via de reclamação

Se a resposta ao seu pedido não for satisfatória, pode apresentar reclamação junto das entidades competentes, nomeadamente através do procedimento previsto no Decreto-Lei n.º 83/2018 ou junto do Provedor de Justiça ([www.provedor-jus.pt](https://www.provedor-jus.pt)).`,
  },
};
