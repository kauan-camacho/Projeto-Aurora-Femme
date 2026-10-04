/* ==========================================================================
   AURORA FEMME — whatsapp.js
   --------------------------------------------------------------------------
   Integração 100% funcional com o WhatsApp via wa.me

   COMO FUNCIONA
   O link wa.me/<numero>?text=<mensagem codificada> abre o WhatsApp já com a
   conversa iniciada e o texto preenchido. Funciona no celular (app instalado
   ou WhatsApp Web), no tablet e no computador.

   TODOS OS FLUXOS ABAIXO USAM ESTE MÓDULO:
     1. Sacola  -> finaliza o pedido com itens, tamanhos, cores e total
     2. Produto -> "Tenho interesse" com nome, SKU e link da peça
     3. Favoritos -> envia a lista de desejos de uma vez
     4. Busca  -> "não encontrei, quero pedir pelo WhatsApp"
     5. Atendimento, guia de medidas, rastreio
   ========================================================================== */
(function () {
  "use strict";

  var money = AF.util.money;

  /* ------------------------------------------------------------------
     NÚMERO
     ------------------------------------------------------------------ */
  function digits() {
    return AF.util.digits(AF.config.whatsapp);
  }

  /** Link wa.me simples, sem mensagem. */
  function link() {
    return "https://wa.me/" + digits();
  }

  /** Monta o link com a mensagem codificada (wa.me exige UTF-8 em `text`). */
  function linkWith(text) {
    var msg = String(text == null ? "" : text);
    var base = "https://wa.me/" + digits();
    return msg ? base + "?text=" + encodeURIComponent(msg) : base;
  }

  /**
   * Valida o número configurado.
   * Rejeita o placeholder e números com tamanho inválido, evitando
   * mandar a cliente para um chat inexistente sem avisar.
   */
  function status() {
    var d = digits();
    var placeholder = /^(\d)\1{7,}$/.test(d) || d === "5511900000000";
    if (!d) return { ok: false, reason: "empty" };
    if (placeholder) return { ok: false, reason: "placeholder" };
    if (d.length < 10 || d.length > 15) return { ok: false, reason: "length" };
    return { ok: true, digits: d };
  }

  /* ------------------------------------------------------------------
     ABERTURA — sempre com feedback para a cliente
     ------------------------------------------------------------------ */
  var openedAt = 0;

  /**
   * Abre o WhatsApp. Se o número for inválido/placeholder, mostra um aviso
   * em vez de silenciosamente não fazer nada.
   */
  function open(text, opts) {
    opts = opts || {};
    var st = status();

    if (!st.ok) {
      if (AF.ui && AF.ui.toast) {
        var msg =
          st.reason === "empty"
            ? "Configure o número do WhatsApp em js/config.js"
            : "WhatsApp não configurado ainda. Ajuste o número em js/config.js";
        AF.ui.toast(msg, "warning-circle", "Atenção", 5200);
      }
      if (typeof console !== "undefined") {
        console.warn(
          "[Aurora Femme] WhatsApp indisponível — verifique AF.config.whatsapp. Motivo:",
          st.reason
        );
      }
      return { ok: false, reason: st.reason };
    }

    // Evita spam de popups em cliques repetidos
    var agora = Date.now();
    if (agora - openedAt < 900) return { ok: true, blocked: true };
    openedAt = agora;

    var url = linkWith(text);
    var novaAba = window.open(url, "_blank", "noopener,noreferrer");

    // Se o popup foi bloqueado, avisa para permitting o clique
    if (!novaAba && AF.ui && AF.ui.toast) {
      AF.ui.toast(
        "Permita pop-ups para abrir o WhatsApp automaticamente.",
        "warning-circle",
        "Atenção",
        5000
      );
    }

    if (AF.ui && AF.ui.toast && !opts.silent) {
      AF.ui.toast("Abrindo o WhatsApp…", "whatsapp-logo", "Enviando", 2600, "wa");
    }

    return { ok: true, url: url };
  }

  /* ------------------------------------------------------------------
     HELPERS DE FORMATAÇÃO (WhatsApp usa *negrito* e \n)
     ------------------------------------------------------------------ */
  function linha(char) {
    return new Array(28).join(char);
  }

  function variacaoProduto(p) {
    if (!p.cores || p.cores.length < 2) return "";
    return p.cores
      .slice(0, 4)
      .map(function (c) {
        return c.n;
      })
      .join(", ");
  }

  /* ------------------------------------------------------------------
     1) PEDIDO / CHECKOUT DA SACOLA
     ------------------------------------------------------------------ */
  function checkout(opts) {
    opts = opts || {};
    var s = AF.store.snapshot();

    if (!s.itens.length) {
      if (AF.ui && AF.ui.toast) {
        AF.ui.toast("Sua sacola está vazia.", "handbag", "Aviso");
      }
      return { ok: false, reason: "empty" };
    }

    var L = [];
    L.push("*" + AF.config.storeName.toUpperCase() + " — PEDIDO*");
    L.push("");
    L.push("Olá! Gostaria de confirmar este pedido:");

    s.itens.forEach(function (it, i) {
      L.push("");
      L.push("*" + (i + 1) + ". " + it.produto.nome + "*");
      if (it.produto.sku) L.push("Código: " + it.produto.sku);
      if (it.size) L.push("Tamanho: " + it.size);
      if (it.color) L.push("Cor: " + it.color);
      L.push("Qtd: " + it.qty + " x " + money(it.unit) + " = " + money(it.total));
    });

    L.push("");
    L.push(linha("_"));
    L.push("*Total: " + money(s.total) + "*");

    if (s.desconto > 0) {
      L.push("Subtotal: " + money(s.subtotal));
      L.push("Cupom " + s.cupom + " (-" + AF.config.coupon.percentOff * 100 + "%): -" + money(s.desconto));
    }

    if (s.freteGratis) {
      L.push("Frete: *GRÁTIS*");
    } else {
      L.push("Frete: " + money(s.frete));
    }

    L.push("Itens: " + s.unidades);
    L.push(linha("_"));

    /* Campos que a loja precisa para fechar a venda */
    L.push("");
    L.push("*Meus dados:*");
    L.push("Nome:");
    L.push("CEP de entrega:");
    L.push("Cidade/UF:");
    L.push("Forma de pagamento: Pix / Cartão");
    L.push("");
    L.push("Se preferir, pode responder por aqui mesmo. 😊");

    var texto = L.join("\n");

    /* Sucesso? */
    if (opts.confirm !== false && AF.ui && AF.ui.toast) {
      AF.ui.toast(
        s.unidades + (s.unidades > 1 ? " itens" : " item") + " · " + money(s.total) + " no pedido",
        "check-circle",
        "Pedido pronto!",
        4200,
        "ok"
      );
    }

    return open(texto, { silent: true });
  }

  /* ------------------------------------------------------------------
     2) CONSULTA DE UM PRODUTO
     ------------------------------------------------------------------ */
  function product(pid, opts) {
    opts = opts || {};
    var p = AF.data.get(pid);
    if (!p) return { ok: false, reason: "notfound" };

    var col = AF.data.collection(p.colecao);
    var s = AF.store.cart;
    var snap = s.items().filter(function (l) {
      return l.pid === p.id;
    });

    var L = [];
    L.push("Olá! Tenho interesse nesta peça da " + AF.config.storeName + ":");
    L.push("");
    L.push("*" + p.nome + "*");
    L.push("Código: " + p.sku);
    L.push("Categoria: " + p.cat + (col ? " · Coleção " + col.nome : ""));
    L.push("Valor: " + money(p.preco) + (p.parcelasTexto ? " (" + p.parcelasTexto + ")" : ""));
    if (p.precoAntigo) L.push("(de " + money(p.precoAntigo) + ")");
    if (variacaoProduto(p)) L.push("Cores disponíveis: " + variacaoProduto(p));
    L.push("Tamanhos: " + p.tamanhos.map(function (t) {
      return t.l + (t.q <= 0 ? "(esgotado)" : "");
    }).join(", "));

    /* Se veio da sacola, mostra a configuração escolhida */
    if (opts.size || opts.color) {
      L.push("");
      L.push("*Escolha no site:* " + [opts.size, opts.color].filter(Boolean).join(" · "));
    }

    /* Se o link público da peça existir, manda junto */
    if (opts.link) L.push("Link da peça: " + opts.link);

    L.push("");
    L.push("Pode me passar mais informações? (estoque, prazo de entrega, formas de pagamento)");

    return open(L.join("\n"));
  }

  /* ------------------------------------------------------------------
     3) LISTA DE FAVORITOS
     ------------------------------------------------------------------ */
  function favoritesList(opts) {
    opts = opts || {};
    var list = AF.store.favorites.all();

    if (!list.length) {
      if (AF.ui && AF.ui.toast) {
        AF.ui.toast("Você ainda não salvou nenhum favorito.", "heart", "Aviso");
      }
      return { ok: false, reason: "empty" };
    }

    var total = list.reduce(function (s, p) {
      return s + p.preco;
    }, 0);

    var L = [];
    L.push("Olá! Salvei estas peças no site da " + AF.config.storeName + " e gostaria de saber sobre disponibilidade:");
    L.push("");
    L.push("*MINHA LISTA DE FAVORITOS (" + list.length + ")*");
    L.push(linha("_"));

    list.forEach(function (p, i) {
      L.push("");
      L.push((i + 1) + ". *" + p.nome + "*");
      L.push("   " + p.cat + " · " + p.sku + " · " + money(p.preco));
    });

    L.push("");
    L.push(linha("_"));
    L.push("Soma das peças: *" + money(total) + "*");
    L.push("");
    L.push("Quais dessas você deixa reservadas? 😊");

    if (opts.link) L.push("\nMinha lista: " + opts.link);

    return open(L.join("\n"));
  }

  /* ------------------------------------------------------------------
     4) PEDIDO DE AJUDA NA BUSCA ("não encontrei")
     ------------------------------------------------------------------ */
  function searchHelp(term) {
    var q = String(term || "").trim();
    var L = [];
    L.push("Olá! Estou procurando no site da " + AF.config.storeName + ":");
    L.push("*\" " + (q || "uma peça específica") + " \"*");
    L.push("");
    L.push("Não encontrei o que procurava. Vocês têm essa peça?");
    if (q) {
      L.push("Pode ser por nome, categoria ou até só pela cor que eu quero. 😊");
    } else {
      L.push("Tenho uma ideia de peça em mente e queria uma sugestão. 😊");
    }
    L.push("");
    L.push("Se tiver algo parecido, me manda as opções por aqui.");

    return open(L.join("\n"));
  }

  /* ------------------------------------------------------------------
     5) ATENDIMENTO / DÚVIDAS
     ------------------------------------------------------------------ */
  function atendimento(assunto) {
    // o prefixo em js/config.js já traz a saudação
    var L = [];
    if (assunto) L.push("(" + assunto + ")");
    L.push(AF.config.atendimentoPrefixo);
    L.push("");
    if (assunto === "Trocas e devoluções") {
      L.push("Gostaria de entender como funciona a troca/devolução (prazo, frete, condições).");
    } else if (assunto === "Rastrear pedido") {
      L.push("Preciso de ajuda para rastrear um pedido que já fiz.");
    } else if (assunto === "Prazo de entrega") {
      L.push("Queria saber o prazo de entrega para o meu CEP e as formas de envio disponíveis.");
    } else if (assunto === "Formas de pagamento") {
      L.push("Quais formas de pagamento vocês aceitam? (Pix, cartão, boleto)");
    } else if (assunto === "Tamanho e medidas") {
      L.push("Fico em dúvida nos tamanhos. Pode me ajudar a escolher?");
    } else {
      L.push("Minha dúvida é: ");
    }

    return open(L.join("\n"));
  }

  /* ------------------------------------------------------------------
     6) GUIA DE MEDIDAS / TABELA DE TAMANHOS
     ------------------------------------------------------------------ */
  function guiaMedidas(pid) {
    var p = pid ? AF.data.get(pid) : null;
    var L = [];
    L.push("Olá! Gostaria de ajuda para escolher o tamanho certo.");
    L.push("");
    L.push("*Minhas medidas:*");
    L.push("Busto: ___ cm");
    L.push("Cintura: ___ cm");
    L.push("Quadril: ___ cm");
    L.push("Altura: ___ cm");
    L.push("");
    if (p) {
      L.push("*Peça de interesse:*");
      L.push(p.nome + (p.sku ? " (" + p.sku + ")" : ""));
      L.push(
        p.medidas
          ? "Medidas da peça: " + p.medidas
          : "Medidas da peça: (consulte a tabela de medidas no site)"
      );
    } else {
      L.push("*Peça de interesse:*");
      L.push("________________");
    }
    L.push("");
    L.push("Podem me indicar qual tamanho é o ideal? 😊");

    return open(L.join("\n"));
  }

  /* ------------------------------------------------------------------
     7) STATUS — usado no console e por um aviso discreto
     ------------------------------------------------------------------ */
  function diagnostico() {
    var st = status();
    return {
      configurado: AF.config.whatsapp,
      digitos: digits(),
      valido: st.ok,
      motivo: st.reason || null,
      linkTeste: link(),
      aviso:
        st.ok
          ? null
          : "⚠️ WhatsApp não configurado. Abra js/config.js e ajuste AF.config.whatsapp."
    };
  }

  /* ------------------------------------------------------------------ */
  AF.wa = {
    link: link,
    linkWith: linkWith,
    status: status,
    open: open,

    checkout: checkout,
    product: product,
    favorites: favoritesList,
    searchHelp: searchHelp,
    atendimento: atendimento,
    guiaMedidas: guiaMedidas,

    diagnostico: diagnostico,

    /* Atalhos de linha de comando (útil no console do navegador) */
    atalhos: {
      checkout: function () {
        return checkout();
      },
      favoritos: function () {
        return favoritesList();
      },
      diagnostico: diagnostico
    }
  };

  /* Aviso no console do navegador (ajuda a quem for publicar o site) */
  if (typeof console !== "undefined" && console.info) {
    var d = diagnostico();
    if (d.aviso) {
      console.warn(d.aviso);
      console.warn("Exemplo válido: whatsapp: '+55 11 98888-7777'  →  " + "https://wa.me/5511988887777");
    } else {
      console.info(
        "%cAurora Femme",
        "color:var(--rosa-texto);font-weight:700",
        "· WhatsApp ok → " + d.linkTeste
      );
    }
  }
})();
