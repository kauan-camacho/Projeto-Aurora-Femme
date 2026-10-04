/* ==========================================================================
   AURORA FEMME — data.js
   Catálogo de produtos, coleções e imagens.
   Basta editar/adicionar itens neste arquivo que o site inteiro se atualiza.
   ========================================================================== */
(function () {
  "use strict";

  /* Atalhos de imagem (Unsplash) para evitar repetir a URL inteira */
  var IMG = {
    // Vestidos
    midi: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop",
    longo: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=800&auto=format&fit=crop",
    canelado: "https://images.unsplash.com/photo-1612336307429-8a898d10e223?q=80&w=800&auto=format&fit=crop",
    branco: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=800&auto=format&fit=crop",
    floral: "https://images.unsplash.com/photo-1550639525-c97d455acf70?q=80&w=800&auto=format&fit=crop",
    rosa: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=800&auto=format&fit=crop",
    alfaiataria: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?q=80&w=800&auto=format&fit=crop",
    // Conjuntos
    conjAlfaiataria: "https://images.unsplash.com/photo-1551163943-3f6a855d1153?q=80&w=800&auto=format&fit=crop",
    conjUrbano: "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=800&auto=format&fit=crop",
    conjSeda: "https://images.unsplash.com/photo-1509319117193-57bab727e09d?q=80&w=800&auto=format&fit=crop",
    // Blusas
    seda: "https://images.unsplash.com/photo-1502716115624-b56ced477c9e?q=80&w=800&auto=format&fit=crop",
    ombroNu: "https://images.unsplash.com/photo-1515347619362-6712b3223000?q=80&w=800&auto=format&fit=crop",
    crop: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    // Saias
    plissada: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=800&auto=format&fit=crop",
    longa: "https://images.unsplash.com/photo-1583496661160-fb5886a13d77?q=80&w=800&auto=format&fit=crop",
    // Acessórios
    lenco: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=800&auto=format&fit=crop",
    brinco: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop",
    bolsa: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?q=80&w=800&auto=format&fit=crop",
    // extras / destaque
    editorial: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop",
    vitrine: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1600&auto=format&fit=crop",
    detalhe: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1200&auto=format&fit=crop"
  };

  /* Paleta de cores reutilizada entre produtos */
  var C = {
    preto: { n: "Preto Noir", h: "#2A2526" },
    offwhite: { n: "Off White", h: "#F5F1EA" },
    rosa: { n: "Rosa Aurora", h: "#E64A70" },
    vinho: { n: "Vinho", h: "#8C2332" },
    azul: { n: "Azul Noite", h: "#3B5998" },
    camel: { n: "Camel", h: "#C89B7A" },
    verde: { n: "Verde Oliva", h: "#7A8B5A" },
    areia: { n: "Areia", h: "#E5D5C0" },
    dourado: { n: "Dourado", h: "#C9A227" },
    cinza: { n: "Cinza Mescla", h: "#9AA0A6" }
  };

  /* Tabela de tamanhos padrão. "q" = estoque (0 = esgotado). */
  function sizes(a, b, c, d, e) {
    var all = [
      { l: "PP", q: 6 },
      { l: "P", q: 9 },
      { l: "M", q: 11 },
      { l: "G", q: 7 },
      { l: "GG", q: 3 }
    ];
    var stock = { PP: a, P: b, M: c, G: d, GG: e };
    if (stock.PP == null && stock.P == null) return all;
    return all.map(function (s) {
      return { l: s.l, q: typeof stock[s.l] === "number" ? stock[s.l] : s.q };
    });
  }

  /* ------------------------------------------------------------------------
     COLEÇÕES
     ------------------------------------------------------------------------ */
  var collections = [
    {
      id: "essencial",
      nome: "Aurora Essencial",
      tagline: "Atemporal",
      desc: "Peças que resolvem o dia inteiro: do escritório ao jantar. Corte preciso, tecido encorpado e bege que combina com tudo.",
      img: IMG.vitrine,
      accent: "#E8DED3"
    },
    {
      id: "noir",
      nome: "Noir Glam",
      tagline: "Noite & dourado",
      desc: "Preto absoluto, brilho contido e silhuetas que pedem presença. Para quem sabe que menos é mais.",
      img: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1200&auto=format&fit=crop",
      accent: "#2B2124"
    },
    {
      id: "floral",
      nome: "Alma Floral",
      tagline: "Romancebotismo",
      desc: "Estampas autorais, leveza e movimento. Um convite a usar cor sem medo.",
      img: "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?q=80&w=1200&auto=format&fit=crop",
      accent: "#D21F50"
    },
    {
      id: "verao",
      nome: "Verão Vibrante",
      tagline: "Cores vivas",
      desc: "Tons que sugerem sol. Linho, algodão e caimento solto para os dias mais longos do ano.",
      img: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1200&auto=format&fit=crop",
      accent: "#FBDDE7"
    }
  ];

  /* ------------------------------------------------------------------------
     PRODUTOS
     ------------------------------------------------------------------------ */
  var products = [
    /* ------------------------------ VESTIDOS ------------------------------ */
    {
      id: "vestido-midi-serena",
      nome: "Vestido Midi Serena",
      cat: "Vestidos",
      colecao: "essencial",
      preco: 189.9,
      precoAntigo: null,
      img: IMG.midi,
      imgs: [
        IMG.midi,
        "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1200&auto=format&fit=crop&sat=-20",
        IMG.detalhe
      ],
      cores: [C.preto, C.rosa, C.areia],
      tamanhos: sizes(4, 8, 12, 6, 2),
      tag: { txt: "Mais vendido", cls: "af-tag--soft" },
      lancamento: "2024-03-12",
      rating: 4.9,
      reviews: 128,
      sku: "AF-VES-014",
      desc: "A elegância minimalista elevada a outro nível. O Vestido Serena tem caimento fluido em tecido premium, decote sutil e fenda lateral que dá um toque vibrante à produção. O forro interno garante conforto o dia todo, sem transparência.",
      detalhes: [
        "Modelagem: midi, levemente evasê",
        "Tecido: viscose premium com forro em poliéster",
        "Decote V suave e fenda lateral de 45cm",
        "Fechamento: zíper invisível nas costas"
      ],
      composicao: "52% viscose, 48% poliéster. Forro: 100% poliéster.",
      cuidados: "Lavar à mão ou ciclo delicado com água fria. Não usar alvejante. Secar à sombra.",
      medidas: "Busto 84–92 cm · cintura 66–74 cm · comprimento 118 cm (tamanho M)."
    },
    {
      id: "vestido-longo-aurora",
      nome: "Vestido Longo Aurora",
      cat: "Vestidos",
      colecao: "noir",
      preco: 239.9,
      precoAntigo: 299.9,
      img: IMG.longo,
      imgs: [
        IMG.longo,
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=1200&auto=format&fit=crop&sat=-20",
        IMG.conjSeda
      ],
      cores: [C.preto, C.vinho],
      tamanhos: sizes(3, 7, 9, 5, 0),
      tag: { txt: "-20% off", cls: "af-tag--promo" },
      lancamento: "2024-02-20",
      rating: 4.8,
      reviews: 96,
      sku: "AF-VES-021",
      desc: "Silhueta longa e fluida para ocasiões que pedem presença sem excessos. Ombro marcado, cintura empire e saia que acompanha o movimento. Um clássico reinventado na cor da Aurora.",
      detalhes: [
        "Modelagem: longa, saia evasê",
        "Cintura empire com costura embutida",
        "Ombro a mostra com elástico interno",
        "Fenda lateral discreta"
      ],
      composicao: "68% poliéster, 32% viscose. Forro: 100% poliéster.",
      cuidados: "Lavar a seco ou ciclo delicado. Passar em temperatura média pelo avesso.",
      medidas: "Busto 82–90 cm · cintura 64–72 cm · comprimento 142 cm (tamanho M)."
    },
    {
      id: "vestido-canelado-noir",
      nome: "Vestido Canelado Noir",
      cat: "Vestidos",
      colecao: "noir",
      preco: 119.9,
      precoAntigo: null,
      img: IMG.canelado,
      imgs: [IMG.canelado, IMG.midi],
      cores: [C.preto, C.cinza, C.verde],
      tamanhos: sizes(8, 12, 14, 9, 4),
      tag: null,
      lancamento: "2024-01-18",
      rating: 4.7,
      reviews: 214,
      sku: "AF-VES-033",
      desc: "Malha canelada que acentua a silhueta sem apertar. Gola alta, mangas longas e comprimento midi. O vestido que resolve a semana inteira com elegância discreta.",      detalhes: [
        "Modelagem: midi, ajuste confortável",
        "Malha canelada com poder de recuperação",
        "Gola alta e mangas longas",
        "Comprimento midi na altura do tornozelo"
      ],
      composicao: "70% algodão, 28% poliamida, 2% elastano.",
      cuidados: "Lavar em ciclo delicado com água fria. Secar à sombra para preservar a elastância.",
      medidas: "Busto 80–90 cm · cintura 62–72 cm · comprimento 112 cm (tamanho M)."
    },
    {
      id: "vestido-branco-fluido",
      nome: "Vestido Branco Fluido",
      cat: "Vestidos",
      colecao: "essencial",
      preco: 199.9,
      precoAntigo: null,
      img: IMG.branco,
      imgs: [IMG.branco, "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=1200&auto=format&fit=crop&sat=-20"],
      cores: [C.offwhite, C.areia],
      tamanhos: sizes(5, 8, 10, 6, 2),
      tag: { txt: "Novo", cls: "af-tag--new" },
      lancamento: "2024-04-02",
      rating: 4.9,
      reviews: 41,
      sku: "AF-VES-040",
      desc: "O branco que não marca, não amassa e transborda. Caimento reto, mangas bufantes discretas e amarração na cintura para você definir o quanto quer mostrar.",
      detalhes: [
        "Modelagem: reta com amarração na cintura",
        "Tecido leve com toque seco",
        "Mangas bufantes com elástico no punho",
        "Bolso lateral discreto"
      ],
      composicao: "100% algodão premium (viscose vegetal).",
      cuidados: "Lavar à mão com água fria. Passar em temperatura baixa. Não torcer.",
      medidas: "Busto 86–94 cm · cintura 68–76 cm · comprimento 120 cm (tamanho M, sem amarração)."
    },
    {
      id: "vestido-floral-aurora",
      nome: "Vestido Floral Aurora",
      cat: "Vestidos",
      colecao: "floral",
      preco: 179.9,
      precoAntigo: null,
      img: IMG.floral,
      imgs: [IMG.floral, "https://images.unsplash.com/photo-1550639525-c97d455acf70?q=80&w=1200&auto=format&fit=crop&sat=-20"],
      cores: [C.rosa, C.verde],
      tamanhos: sizes(6, 9, 11, 7, 3),
      tag: { txt: "Tendência", cls: "af-tag--soft" },
      lancamento: "2024-03-28",
      rating: 4.8,
      reviews: 77,
      sku: "AF-VES-052",
      desc: "Estampa floral exclusiva, exclusiva da Aurora, sobre viscose leve. Alças finas, decote em V e saia com movimento — feito para dias de sol e fotos ao ar livre.",
      detalhes: [
        "Modelagem: midi com saia evasê",
        "Estampa exclusiva em tubo",
        "Alças finas reguláveis",
        "Forro acetinado nas costas"
      ],
      composicao: "100% viscose. Forro: 100% poliéster.",
      cuidados: "Lavar à mão ou ciclo delicado. Não passar sobre a estampa. Secar à sombra.",
      medidas: "Busto 82–90 cm · cintura 64–72 cm · comprimento 114 cm (tamanho M)."
    },
    {
      id: "vestido-rosa-elegance",
      nome: "Vestido Rosa Elegance",
      cat: "Vestidos",
      colecao: "verao",
      preco: 210.0,
      precoAntigo: 250.0,
      img: IMG.rosa,
      imgs: [IMG.rosa, "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1200&auto=format&fit=crop&sat=-20"],
      cores: [C.rosa, C.camel],
      tamanhos: sizes(4, 7, 9, 5, 1),
      tag: { txt: "-16% off", cls: "af-tag--promo" },
      lancamento: "2024-02-05",
      rating: 4.6,
      reviews: 63,
      sku: "AF-VES-061",
      desc: "Rosa em satueta mais sofisticada. Decote ombro a ombro e saia ampla com forro godet. Para fins de semana e festas que pedem cor.",
      detalhes: [
        "Modelagem: longa com saia godet",
        "Decote ombro a ombro com elástico embutido",
        "Forro interno em cada peça",
        "Zíper lateral invisível"
      ],
      composicao: "75% poliéster, 25% viscose. Forro: 100% poliéster.",
      cuidados: "Lavar a seco. Passar em temperatura média pelo avesso.",
      medidas: "Busto 82–90 cm · cintura 64–72 cm · comprimento 138 cm (tamanho M)."
    },
    {
      id: "vestido-alfaiataria-iris",
      nome: "Vestido Alfaiataria Íris",
      cat: "Vestidos",
      colecao: "essencial",
      preco: 269.9,
      precoAntigo: null,
      img: IMG.alfaiataria,
      imgs: [IMG.alfaiataria, "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?q=80&w=1200&auto=format&fit=crop&sat=-20"],
      cores: [C.preto, C.vinho, C.azul],
      tamanhos: sizes(3, 6, 8, 4, 0),
      tag: null,
      lancamento: "2024-01-30",
      rating: 4.9,
      reviews: 58,
      sku: "AF-VES-070",
      desc: "Tecido estruturado, abotoamento frontal e cinto que transforma a silhueta. Um vestido alfaiataria que funciona do escritório ao jantar sem trocar de roupa.",
      detalhes: [
        "Modelagem: alfaiataria, ajuste ao corpo",
        "Abotoamento frontal em metal dourado",
        "Cinto de cetim incluso",
        "Bolsos frontais com ilhós"
      ],
      composicao: "62% poliéster, 34% viscose, 4% elastano.",
      cuidados: "Lavar a seco exclusivamente.",
      medidas: "Busto 84–92 cm · cintura 68–76 cm · comprimento 110 cm (tamanho M)."
    },

    /* ------------------------------ CONJUNTOS ----------------------------- */
    {
      id: "conjunto-alfaiataria-clara",
      nome: "Conjunto Alfaiataria Clara",
      cat: "Conjuntos",
      colecao: "essencial",
      preco: 319.9,
      precoAntigo: null,
      img: IMG.conjAlfaiataria,
      imgs: [IMG.conjAlfaiataria, "https://images.unsplash.com/photo-1551163943-3f6a855d1153?q=80&w=1200&auto=format&fit=crop&sat=-20"],
      cores: [C.offwhite, C.preto, C.camel],
      tamanhos: sizes(3, 6, 8, 4, 1),
      tag: { txt: "Novo", cls: "af-tag--new" },
      lancamento: "2024-04-10",
      rating: 5.0,
      reviews: 34,
      sku: "AF-CON-011",
      desc: "Blazer alongado com ombro leve e calça de alfaiataria de cintura alta. Vendido separado ou junto — dois em um, do jeito que você quiser usar.",
      detalhes: [
        "Blazer alongado com 1 botão",
        "Calça de cintura alta e bainha reta",
        "Peças vendidas juntas ou separadas",
        "Forro em cetim no blazer"
      ],
      composicao: "64% poliéster, 33% viscose, 3% elastano.",
      cuidados: "Lavar a seco. Pendurar imediatamente após o uso.",
      medidas: "Blazer: ombro 40 cm · peito 96 cm. Calça: cintura 70 cm · comprimento 104 cm (M)."
    },
    {
      id: "conjunto-casual-urbano",
      nome: "Conjunto Casual Urbano",
      cat: "Conjuntos",
      colecao: "verao",
      preco: 179.9,
      precoAntigo: null,
      img: IMG.conjUrbano,
      imgs: [IMG.conjUrbano, "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=1200&auto=format&fit=crop&sat=-20"],
      cores: [C.areia, C.verde, C.preto],
      tamanhos: sizes(6, 10, 12, 8, 3),
      tag: { txt: "Tendência", cls: "af-tag--soft" },
      lancamento: "2024-03-05",
      rating: 4.7,
      reviews: 89,
      sku: "AF-CON-024",
      desc: "Camiseta canelada e saia plissada no mesmo tom — só falta dobrar a barra. Conjunto que sai do dia para a noite sem trocar de sapato.",
      detalhes: [
        "Camiseta canelada com gola careca",
        "Saia plissada com cós elástico",
        "Tons neutros com acabamento premium",
        "Vendido como conjunto"
      ],
      composicao: "68% viscose, 28% poliéster, 4% elastano.",
      cuidados: "Lavar em ciclo delicado com água fria. Secar pendurado.",
      medidas: "Camiseta: busto 84 cm · comprimento 58 cm. Saia: cintura elástica 64–76 cm · comprimento 78 cm (M)."
    },
    {
      id: "conjunto-seda-noturna",
      nome: "Conjunto Seda Noturna",
      cat: "Conjuntos",
      colecao: "noir",
      preco: 349.9,
      precoAntigo: 419.9,
      img: IMG.conjSeda,
      imgs: [IMG.conjSeda, "https://images.unsplash.com/photo-1509319117193-57bab727e09d?q=80&w=1200&auto=format&fit=crop&sat=-20"],
      cores: [C.preto, C.vinho],
      tamanhos: sizes(2, 5, 7, 3, 0),
      tag: { txt: "-17% off", cls: "af-tag--promo" },
      lancamento: "2024-02-14",
      rating: 4.9,
      reviews: 45,
      sku: "AF-CON-033",
      desc: "Seda com toque fluido e brilho sutil. Blusa cropped e calça de cintura média com amarração lateral. O conjunto que faz o look inteiro sozinho.",
      detalhes: [
        "Blusa cropped de seda com amarração",
        "Calça de cintura média com cordão",
        "Acabamento em viés nas barras",
        "Forro acetinado"
      ],
      composicao: "95% poliéster, 5% elastano. Forro: 100% poliéster.",
      cuidados: "Lavar a seco. Não usar amaciante.",
      medidas: "Blusa: busto 82 cm. Calça: cintura 68 cm · comprimento 102 cm (M)."
    },

    /* ------------------------------- BLUSAS ------------------------------ */
    {
      id: "blusa-seda-minimalista",
      nome: "Blusa Seda Minimalista",
      cat: "Blusas",
      colecao: "essencial",
      preco: 129.9,
      precoAntigo: null,
      img: IMG.seda,
      imgs: [IMG.seda, "https://images.unsplash.com/photo-1502716115624-b56ced477c9e?q=80&w=1200&auto=format&fit=crop&sat=-20"],
      cores: [C.offwhite, C.preto, C.camel],
      tamanhos: sizes(8, 12, 15, 10, 5),
      tag: null,
      lancamento: "2024-01-10",
      rating: 4.8,
      reviews: 156,
      sku: "AF-BLU-007",
      desc: "Seda com pegada minimalista: gola redonda, manga 7/8 e caimento reto. A peça que sabe conviver com qualquer coisa na gaveta.",
      detalhes: [
        "Manga 7/8 com barra ajustada",
        "Gola redonda estruturada",
        "Caimento reto sem transparência",
        "Tecido com toque acetinado"
      ],
      composicao: "100% poliéster (seda vegetal).",
      cuidados: "Lavar a seco. Passar em temperatura baixa pelo avesso.",
      medidas: "Busto 90 cm · comprimento 62 cm (tamanho M)."
    },
    {
      id: "blusa-social-ombro-nu",
      nome: "Blusa Social Ombro Nu",
      cat: "Blusas",
      colecao: "verao",
      preco: 149.9,
      precoAntigo: null,
      img: IMG.ombroNu,
      imgs: [IMG.ombroNu, "https://images.unsplash.com/photo-1515347619362-6712b3223000?q=80&w=1200&auto=format&fit=crop&sat=-20"],
      cores: [C.rosa, C.preto, C.areia],
      tamanhos: sizes(5, 9, 11, 7, 2),
      tag: null,
      lancamento: "2024-02-22",
      rating: 4.6,
      reviews: 71,
      sku: "AF-BLU-019",
      desc: "Ombro a mostra e amarração na nuca que libera o cabelo. Decente estruturado no busto e cintura levemente solta. Elegante sem esforço.",
      detalhes: [
        "Amarração regulável na nuca",
        "Decente estruturado com bojo leve",
        "Cintura levemente evasê",
        "Tecido de crepe com elasticidade"
      ],
      composicao: "90% poliéster, 10% elastano.",
      cuidados: "Lavar em ciclo delicado. Não passar sobre a amarração.",
      medidas: "Busto 88 cm · cintura 72 cm · comprimento 58 cm (tamanho M)."
    },
    {
      id: "blusa-crop-floral",
      nome: "Blusa Crop Floral",
      cat: "Blusas",
      colecao: "floral",
      preco: 99.9,
      precoAntigo: 129.9,
      img: IMG.crop,
      imgs: [IMG.crop, "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop&sat=-20"],
      cores: [C.rosa, C.verde, C.areia],
      tamanhos: sizes(10, 14, 16, 11, 6),
      tag: { txt: "-23% off", cls: "af-tag--promo" },
      lancamento: "2024-03-18",
      rating: 4.5,
      reviews: 198,
      sku: "AF-BLU-028",
      desc: "Cropped curto em estampa floral, com alças largas e elástico embutido na barra. Vence qualquer look de verão sem esconder nada.",
      detalhes: [
        "Crop com barra em elástico embutido",
        "Alças largas reforçadas",
        "Estampa exclusiva em malha",
        "Modelagem ajustado"
      ],
      composicao: "92% poliéster, 8% elastano.",
      cuidados: "Lavar em ciclo delicado com água fria. Não passar a ferro quente.",
      medidas: "Busto 78–84 cm · comprimento 40 cm (tamanho M, alongado)."
    },

    /* ------------------------------- SAIAS ------------------------------- */
    {
      id: "saia-midi-plissada",
      nome: "Saia Midi Plissada",
      cat: "Saias",
      colecao: "essencial",
      preco: 169.9,
      precoAntigo: null,
      img: IMG.plissada,
      imgs: [IMG.plissada, "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1200&auto=format&fit=crop&sat=-20"],
      cores: [C.preto, C.areia, C.vinho],
      tamanhos: sizes(6, 10, 12, 8, 3),
      tag: null,
      lancamento: "2024-02-08",
      rating: 4.8,
      reviews: 67,
      sku: "AF-SAI-015",
      desc: "Plissado permanente que não desmancha na lavagem. Cós confortável, forro interno e comprimento midi. A saia que salva qualquer look.",
      detalhes: [
        "Plissado permanent (não desfaz)",
        "Forro interno em cetim",
        "Cós confortável com elástico na traseira",
        "Abertura lateral com zíper"
      ],
      composicao: "100% poliéster. Forro: 100% poliéster.",
      cuidados: "Lavar à mão ou ciclo delicado. Pendurar imediatamente para manter o plissado.",
      medidas: "Cintura 66–74 cm · quadril 92–100 cm · comprimento 78 cm (tamanho M)."
    },
    {
      id: "saia-longa-estampada",
      nome: "Saia Longa Estampada",
      cat: "Saias",
      colecao: "floral",
      preco: 189.9,
      precoAntigo: null,
      img: IMG.longa,
      imgs: [IMG.longa, "https://images.unsplash.com/photo-1583496661160-fb5886a13d77?q=80&w=1200&auto=format&fit=crop&sat=-20"],
      cores: [C.rosa, C.verde],
      tamanhos: sizes(4, 8, 10, 6, 2),
      tag: { txt: "Novo", cls: "af-tag--new" },
      lancamento: "2024-04-06",
      rating: 4.7,
      reviews: 29,
      sku: "AF-SAI-022",
      desc: "Comprimento maxi com estampa exclusiva e franzimento na cintura. Cai bem, balança bonito e vai do almoço ao jantar sem mudar de acessório.",
      detalhes: [
        "Comprimento maxi até o tornozelo",
        "Cós com franzimento e elástico",
        "Estampa exclusiva em tela",
        "Fenda lateral discreta"
      ],
      composicao: "100% viscose leve.",
      cuidados: "Lavar à mão com água fria. Secar à sombra.",
      medidas: "Cintura elástica 64–78 cm · comprimento 118 cm (tamanho M)."
    },

    /* ---------------------------- ACESSÓRIOS ---------------------------- */
    {
      id: "lenco-seda-aura",
      nome: "Lenço de Seda Aura",
      cat: "Acessórios",
      colecao: "floral",
      preco: 59.9,
      precoAntigo: null,
      img: IMG.lenco,
      imgs: [IMG.lenco, "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=1200&auto=format&fit=crop&sat=-20"],
      cores: [C.rosa, C.dourado, C.verde],
      tamanhos: [{ l: "Único", q: 20 }],
      tag: null,
      lancamento: "2024-03-22",
      rating: 4.9,
      reviews: 143,
      sku: "AF-ACE-005",
      desc: "Seda 90x90 cm com estampa autoral e bordas enroladas à mão. No pescoço, na bolsa ou na cintura — o detalhe que transforma o look.",
      detalhes: [
        "Seda 90 x 90 cm",
        "Bordas enroladas à mão",
        "Estampa exclusiva Aurora Femme",
        "Caixa própria inclusa"
      ],
      composicao: "100% seda.",
      cuidados: "Lavar à mão com sabão neutro. Secar à sombra sobre superfície plana.",
      medidas: "90 x 90 cm."
    },
    {
      id: "brinco-sol-aurora",
      nome: "Brinco Sol Aurora",
      cat: "Acessórios",
      colecao: "noir",
      preco: 79.9,
      precoAntigo: null,
      img: IMG.brinco,
      imgs: [IMG.brinco, "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1200&auto=format&fit=crop&sat=-20"],
      cores: [C.dourado, C.preto],
      tamanhos: [{ l: "Único", q: 15 }],
      tag: { txt: "Exclusivo", cls: "af-tag--soft" },
      lancamento: "2024-04-14",
      rating: 5.0,
      reviews: 62,
      sku: "AF-ACE-012",
      desc: "Argola com pingente solar texturizado e acabamento dourado 18k. Peça única, leve e resistente à água, adequada para o uso diário.",
      detalhes: [
        "Dourado 18k sobre latão",
        "Pingente 3,5 cm",
        "Resistente à água",
        "Fecho de pressão"
      ],
      composicao: "Latão com banho de ouro 18k. Sem níquel.",
      cuidados: "Evitar contato com perfumes e produtos químicos. Guardar no estojo incluso.",
      medidas: "Comprimento total 4,2 cm."
    },
    {
      id: "bolsa-mini-serena",
      nome: "Bolsa Mini Serena",
      cat: "Acessórios",
      colecao: "verao",
      preco: 159.9,
      precoAntigo: 199.9,
      img: IMG.bolsa,
      imgs: [IMG.bolsa, "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?q=80&w=1200&auto=format&fit=crop&sat=-20"],
      cores: [C.camel, C.preto, C.rosa],
      tamanhos: [{ l: "Único", q: 8 }],
      tag: { txt: "-20% off", cls: "af-tag--promo" },
      lancamento: "2024-02-27",
      rating: 4.8,
      reviews: 94,
      sku: "AF-ACE-018",
      desc: "Couro sintético de toque macio, alça de corrente dourada e compartimento interno com zíper. Tamanho perfeito para o essencial — celular, carteirinha, batom.",
      detalhes: [
        "Medidas 22 x 15 x 8 cm",
        "Alça de corrente dourada removível",
        "Compartimento interno com zíper",
        "Forro em cetim"
      ],
      composicao: "Couro sintético PU. Forro: 100% poliéster.",
      cuidados: "Limpar com pano seco e levemente úmido. Guardar dentro do saco de algodão para não riscar.",
      medidas: "22 x 15 x 8 cm; alça 110 cm."
    }
  ];

  /* ------------------------------------------------------------------------
     Índices auxiliares (acesso rápido por id)
     ------------------------------------------------------------------------ */
  var byId = {};
  products.forEach(function (p) {
    byId[p.id] = p;
  });

  var colById = {};
  collections.forEach(function (c) {
    colById[c.id] = c;
  });

  /* Garante coerência: completa campos derivados. */
  products.forEach(function (p) {
    p.imgs = p.imgs && p.imgs.length ? p.imgs : [p.img];
    p.desc = p.desc || "";
    p.sku = p.sku || ("AF-" + AF.util.slug(p.cat).slice(0, 3).toUpperCase() + "-" + p.id.length);
    p.parcelasTexto = AF.util.textoParcelas(p.preco);
    p.desconto = p.precoAntigo
      ? Math.round((1 - p.preco / p.precoAntigo) * 100)
      : 0;
    p.slug = AF.util.slug(p.nome);
  });

  /* Categorias com contagem calculada (usada no filtro e no menu). */
  var categories = (function () {
    var map = {};
    products.forEach(function (p) {
      map[p.cat] = (map[p.cat] || 0) + 1;
    });
    return Object.keys(map)
      .map(function (k) {
        return { nome: k, total: map[k] };
      })
      .sort(function (a, b) {
        return b.total - a.total;
      });
  })();

  /* Tamanhos únicos disponíveis no catálogo. */
  var allSizes = (function () {
    var seen = {};
    var out = [];
    products.forEach(function (p) {
      p.tamanhos.forEach(function (s) {
        if (!seen[s.l]) {
          seen[s.l] = true;
          out.push(s.l);
        }
      });
    });
    var order = ["PP", "P", "M", "G", "GG", "Único"];
    return out.sort(function (a, b) {
      var ia = order.indexOf(a);
      var ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  })();

  /* Cores únicas, com contagem. */
  var allColors = (function () {
    var map = {};
    products.forEach(function (p) {
      p.cores.forEach(function (c) {
        if (!map[c.n]) map[c.n] = { nome: c.n, hex: c.h, total: 0 };
        map[c.n].total++;
      });
    });
    return Object.keys(map)
      .map(function (k) {
        return map[k];
      })
      .sort(function (a, b) {
        return b.total - a.total;
      });
  })();

  /* Preço máximo para o slider de faixa. */
  var priceMax = Math.ceil(
    products.reduce(function (m, p) {
      return Math.max(m, p.preco);
    }, 0) / 50
  ) * 50;

  /* ------------------------------------------------------------------------
     API pública
     ------------------------------------------------------------------------ */
  AF.data = {
    img: IMG,
    products: products,
    collections: collections,
    categories: categories,
    sizes: allSizes,
    colors: allColors,
    priceMax: priceMax,

    /** Busca produto por id. */
    get: function (id) {
      return byId[id] || null;
    },

    /** Busca coleção por id. */
    collection: function (id) {
      return colById[id] || null;
    },

    /** Produtos de uma categoria. */
    byCategory: function (cat) {
      return products.filter(function (p) {
        return p.cat === cat;
      });
    },

    /** Produtos de uma coleção. */
    byCollection: function (id) {
      return products.filter(function (p) {
        return p.colecao === id;
      });
    },

    /** Destaques da home: tag + lanamentos + mais vendidos. */
    destaques: function (limit) {
      var scored = products.slice().sort(function (a, b) {
        var sa = (a.tag ? 3 : 0) + a.rating + a.reviews / 500;
        var sb = (b.tag ? 3 : 0) + b.rating + b.reviews / 500;
        return sb - sa;
      });
      return scored.slice(0, limit || 8);
    },

    /**
     * Busca inteligente por texto.
     * Casa nome, categoria, coleção, cor, descrição e SKU.
     * Retorna array ordenado por relevância.
     */
    search: function (term) {
      var q = AF.util.norm(term).trim();
      if (!q) return [];
      var words = q.split(/\s+/).filter(Boolean);

      var resultados = products
        .map(function (p) {
          var col = colById[p.colecao];
          var corNames = p.cores
            .map(function (c) {
              return c.n;
            })
            .join(" ");

          var campos = {
            nome: AF.util.norm(p.nome),
            cat: AF.util.norm(p.cat),
            colecao: AF.util.norm(col ? col.nome : ""),
            cor: AF.util.norm(corNames),
            desc: AF.util.norm(p.desc),
            sku: AF.util.norm(p.sku)
          };

          var score = 0;
          var casouTodos = true;
          var casouAlgum = false;

          words.forEach(function (w) {
            var melhor = 0;
            Object.keys(campos).forEach(function (k) {
              var v = campos[k];
              if (!v) return;
              if (v === w) {
                melhor = Math.max(melhor, 30);
              } else if (v.indexOf(w) === 0) {
                melhor = Math.max(melhor, 20);
              } else if (v.indexOf(" " + w) > -1) {
                melhor = Math.max(melhor, 15);
              } else if (v.indexOf(w) > -1) {
                melhor = Math.max(melhor, 9);
              }
            });
            if (melhor === 0) casouTodos = false;
            else casouAlgum = true;
            score += melhor;
          });

          if (!casouAlgum) return { produto: p, score: 0, todos: false };

          // bônus para quem casou com todas as palavras
          if (casouTodos) score += 25;
          if (campos.nome.indexOf(q) === 0) score += 20;
          if (p.desconto) score += 3;

          return { produto: p, score: score, todos: casouTodos };
        })
        .filter(function (r) {
          return r.score > 0;
        });

      /* Sem correspondência para todas as palavras: usa as que casaram
         alguma palavra, para o cliente não ver uma tela totalmente vazia. */
      var exatos = resultados.filter(function (r) {
        return r.todos;
      });
      if (exatos.length) resultados = exatos;

      return resultados
        .sort(function (a, b) {
          return b.score - a.score;
        })
        .map(function (r) {
          return r.produto;
        });
    },

    /** Sugestões rápidas para a tela de busca. */
    suggestions: function () {
      return {
        termos: ["vestido midi", "conjunto", "floral", "preto", "seda", "acessórios"],
        categorias: categories.slice(0, 4).map(function (c) {
          return c.nome;
        })
      };
    }
  };
})();
