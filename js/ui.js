/* ==========================================================================
   AURORA FEMME — ui.js
   Renderização de telas: cartões, sacola, favoritos, busca, filtros, modais.
   ========================================================================== */
(function () {
  "use strict";

  var U = AF.util;
  var D = AF.data;
  var S = AF.store;

  /* ------------------------------------------------------------------ */
  /* ESTADO DE INTERFACE                                                */
  /* ------------------------------------------------------------------ */
  AF.state = {
    view: "home",
    term: "",
    sort: "recomendados",
    page: 1,
    filters: {
      cat: [],
      col: [],
      size: [],
      color: [],
      promo: false,
      maxPrice: null
    }
  };

  /* Seleção atual dentro do modal de produto */
  var pd = { pid: null, size: "", color: "", qty: 1, img: 0 };

  /* Referências DOM frequently used */
  var el = {};

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* ================================================================== */
  /* TOASTS                                                             */
  /* ================================================================== */
  var toastId = 0;

  function toast(msg, icon, title, ms, kind) {
    if (!el.toasts) el.toasts = $("#af-toasts");
    if (!el.toasts) return;

    var t = document.createElement("div");
    t.className = "af-toast" + (kind ? " af-toast--" + kind : "");
    t.setAttribute("role", "status");
    t.dataset.tid = "t" + ++toastId;

    t.innerHTML =
      '<span class="af-toast__ico">' + U.icon(icon || "check-circle") + "</span>" +
      '<span class="af-toast__txt">' +
      (title ? "<b>" + U.esc(title) + "</b><br>" : "") +
      U.esc(msg) +
      "</span>" +
      '<button class="af-toast__x" aria-label="Fechar">' + U.icon("x") + "</button>";

    el.toasts.appendChild(t);

    // limita a 4 toasts simultâneos
    while (el.toasts.children.length > 4) {
      el.toasts.removeChild(el.toasts.firstChild);
    }

    var timer = setTimeout(function () {
      fechar(t);
    }, ms || 3400);

    t.querySelector(".af-toast__x").addEventListener("click", function () {
      clearTimeout(timer);
      fechar(t);
    });

    return t;
  }

  function fechar(node) {
    if (!node || node.dataset.fechando) return;
    node.dataset.fechando = "1";
    node.classList.add("is-out");
    setTimeout(function () {
      if (node.parentNode) node.parentNode.removeChild(node);
    }, 300);
  }

  /* ================================================================== */
  /* BADGES (contadores do header)                                       */
  /* ================================================================== */
  function syncBadges(bump) {
    var nCart = S.calc.count();
    var nFav = S.favorites.count();

    $$("[data-badge='cart']").forEach(function (b) {
      b.textContent = nCart > 99 ? "99+" : nCart;
      b.classList.toggle("is-on", nCart > 0);
      if (bump === "cart" && nCart > 0) bumpOnce(b);
    });

    $$("[data-badge='fav']").forEach(function (b) {
      b.textContent = nFav > 99 ? "99+" : nFav;
      b.classList.toggle("is-on", nFav > 0);
      if (bump === "fav" && nFav > 0) bumpOnce(b);
    });

    // estado visual dos corações nos cartões
    $$(".af-card__fav[data-pid]").forEach(function (btn) {
      var on = S.favorites.has(btn.dataset.pid);
      btn.classList.toggle("is-on", on);
      var i = btn.querySelector("i");
      if (i) i.className = "ph " + (on ? "ph-heart-fill" : "ph-heart");
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.setAttribute("aria-label", (on ? "Remover dos favoritos: " : "Salvar nos favoritos: ") + btn.dataset.name);
    });
  }

  function bumpOnce(node) {
    node.classList.remove("is-bump");
    void node.offsetWidth;
    node.classList.add("is-bump");
  }

  function popFav(node) {
    node.classList.remove("is-pop");
    void node.offsetWidth;
    node.classList.add("is-pop");
  }

  /* ================================================================== */
  /* CARTÃO DE PRODUTO                                                  */
  /* ================================================================== */
  function productCard(p) {
    var col = D.collection(p.colecao);
    var fav = S.favorites.has(p.id);
    var alt = p.imgs[1] || p.imgs[0];
    var parcelas = p.parcelasTexto || U.textoParcelas(p.preco);

    return (
      '<article class="af-card" data-pid="' + p.id + '">' +
        '<div class="af-card__media">' +
          (p.tag
            ? '<span class="af-tag ' + p.tag.cls + '">' + U.esc(p.tag.txt) + "</span>"
            : "") +
          '<img class="af-card__img af-card__img--main" src="' + p.img + '" alt="' + U.esc(p.nome) +
            '" loading="lazy" decoding="async" width="600" height="800">' +
          '<img class="af-card__img af-card__img--alt" src="' + alt + '" alt="" aria-hidden="true" loading="lazy" decoding="async">' +

          '<button class="af-card__fav' + (fav ? " is-on" : "") + '" data-act="fav" data-pid="' + p.id +
            '" data-name="' + U.esc(p.nome) + '" aria-pressed="' + (fav ? "true" : "false") +
            '" aria-label="' + (fav ? "Remover dos favoritos" : "Salvar nos favoritos") + ': ' + U.esc(p.nome) + '">' +
            '<i class="ph ' + (fav ? "ph-heart-fill" : "ph-heart") + '"></i>' +
          "</button>" +

          '<div class="af-card__actions">' +
            '<button class="af-card__act" data-act="open" data-pid="' + p.id + '">' +
              U.icon("eye") + "<span>Ver peça</span>" +
            "</button>" +
            '<button class="af-card__act af-card__add" data-act="quickadd" data-pid="' + p.id + '">' +
              U.icon("handbag") + "<span>Sacola</span>" +
            "</button>" +
            '<button class="af-card__act af-card__wa" data-act="wa" data-pid="' + p.id +
              '" aria-label="Tenho interesse no WhatsApp: ' + U.esc(p.nome) + '" title="Tenho interesse">' +
              U.icon("whatsapp-logo") +
            "</button>" +
          "</div>" +
        "</div>" +

        '<div class="af-card__body">' +
          '<span class="af-card__cat">' + U.esc(p.cat) + (col ? " · " + U.esc(col.nome) : "") + "</span>" +
          '<h3 class="af-card__name" data-act="open" data-pid="' + p.id + '" role="button" tabindex="0">' +
            U.esc(p.nome) +
          "</h3>" +
          '<div class="af-card__price">' +
            "<b>" + U.money(p.preco) + "</b>" +
            (p.precoAntigo ? "<s>" + U.money(p.precoAntigo) + "</s>" : "") +
            (parcelas ? "<i>" + U.esc(parcelas) + "</i>" : "") +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  /* ================================================================== */
  /* CATÁLOGO — lista filtrada + ordenação                              */
  /* ================================================================== */
  function visibleProducts() {
    var f = AF.state.filters;
    var list = D.products.slice();

    if (f.cat.length) {
      list = list.filter(function (p) {
        return f.cat.indexOf(p.cat) > -1;
      });
    }
    if (f.col.length) {
      list = list.filter(function (p) {
        return f.col.indexOf(p.colecao) > -1;
      });
    }
    if (f.size.length) {
      list = list.filter(function (p) {
        return p.tamanhos.some(function (t) {
          return f.size.indexOf(t.l) > -1 && t.q > 0;
        });
      });
    }
    if (f.color.length) {
      list = list.filter(function (p) {
        return p.cores.some(function (c) {
          return f.color.indexOf(c.n) > -1;
        });
      });
    }
    if (f.promo) {
      list = list.filter(function (p) {
        return p.desconto > 0;
      });
    }
    if (typeof f.maxPrice === "number" && f.maxPrice < D.priceMax) {
      list = list.filter(function (p) {
        return p.preco <= f.maxPrice;
      });
    }

    // ordenação
    switch (AF.state.sort) {
      case "menor":
        list.sort(function (a, b) { return a.preco - b.preco; });
        break;
      case "maior":
        list.sort(function (a, b) { return b.preco - a.preco; });
        break;
      case "novos":
        list.sort(function (a, b) { return new Date(b.lancamento) - new Date(a.lancamento); });
        break;
      case "avaliados":
        list.sort(function (a, b) { return b.rating - a.rating || b.reviews - a.reviews; });
        break;
      default:
        // recomendados: promo + novos + avaliação
        list.sort(function (a, b) {
          return score(b) - score(a);
        });
    }

    return list;
  }

  function score(p) {
    return p.rating * 2 + p.reviews / 60 + p.desconto * 0.5 + (p.tag ? 2 : 0);
  }

  /* ================================================================== */
  /* CATÁLOGO — render                                                  */
  /* ================================================================== */
  function renderCatalog() {
    var grid = $("#af-catalog-grid");
    if (!grid) return;

    var todos = visibleProducts();
    var porPagina = AF.config.pageSize;
    var pagina = AF.state.page;
    var visiveis = todos.slice(0, pagina * porPagina);

    /* contadores */
    var n = todos.length;
    var txt =
      n === 0
        ? "Nenhum produto"
        : n === 1
        ? "1 produto"
        : "Exibindo " + visiveis.length + " de " + n + " produtos";
    $$("[data-catalog-count]").forEach(function (node) {
      node.textContent = txt;
    });

    /* chips de filtros ativos */
    renderActiveFilters();

    /* botão "carregar mais" */
    var more = $("#af-catalog-more");
    if (more) {
      var restantes = n - visiveis.length;
      if (restantes > 0) {
        more.style.display = "";
        more.querySelector("[data-more-label]").textContent =
          "Carregar mais (" + restantes + ")";
      } else if (n > porPagina) {
        more.style.display = "";
        more.querySelector("[data-more-label]").textContent = "Ver o início da lista";
        more.dataset.mode = "top";
      } else {
        more.style.display = "none";
      }
    }

    /* estado vazio */
    if (n === 0) {
      grid.innerHTML =
        '<div class="af-empty">' +
          '<div class="af-empty__ico">' + U.icon("magnifying-glass") + "</div>" +
          "<h3>Nenhuma peça encontrada</h3>" +
          "<p>Não encontramos nada com esses filtros. Tente ampliar a busca ou fale com a gente — talvez a peça já exista no estoque.</p>" +
          '<div class="af-empty__actions">' +
            '<button class="af-btn af-btn--ghost" data-act="clear-filters">' + U.icon("x") + "Limpar filtros</button>" +
            '<button class="af-btn af-btn--wa-outline" data-act="wa-help">' + U.icon("whatsapp-logo") + "Pedir no WhatsApp</button>" +
          "</div>" +
        "</div>";
      return;
    }

    grid.innerHTML = visiveis.map(productCard).join("");
    syncBadges();
  }

  function renderActiveFilters() {
    var box = $("#af-active-filters");
    if (!box) return;

    var f = AF.state.filters;
    var chips = [];

    f.col.forEach(function (c) {
      var col = D.collection(c);
      chips.push({ g: "col", v: c, label: "Coleção " + (col ? col.nome : c) });
    });
    f.cat.forEach(function (c) {
      chips.push({ g: "cat", v: c, label: c });
    });
    f.size.forEach(function (c) {
      chips.push({ g: "size", v: c, label: "Tam " + c });
    });
    f.color.forEach(function (c) {
      chips.push({ g: "color", v: c, label: c });
    });
    if (f.promo) chips.push({ g: "promo", v: true, label: "Só promoções" });
    if (typeof f.maxPrice === "number" && f.maxPrice < D.priceMax) {
      chips.push({ g: "price", v: f.maxPrice, label: "Até " + U.money(f.maxPrice) });
    }

    if (!chips.length) {
      box.innerHTML = "";
      box.style.display = "none";
      return;
    }

    box.style.display = "";
    box.innerHTML =
      chips
        .map(function (c) {
          return (
            '<button class="af-af" data-act="unfilter" data-group="' + c.g +
            '" data-value="' + U.esc(String(c.v)) + '">' +
            U.esc(c.label) + U.icon("x") +
            "</button>"
          );
        })
        .join("") +
      '<button class="af-af" data-act="clear-filters" style="background:var(--grafite);border-color:var(--grafite);color:#fff">' +
        "Limpar tudo</button>";
  }

  /* ================================================================== */
  /* FILTROS                                                            */
  /* ================================================================== */
  function renderFilters() {
    $$("[data-filters-host]").forEach(function (host) {
      host.innerHTML = filtersHTML();
      syncFilters();
    });
  }

  function filtersHTML() {
    var f = AF.state.filters;
    var h = "";

    /* categorias com contagem real */
    h +=
      '<div class="af-fgroup" data-open="true">' +
        '<button class="af-fgroup__title" data-act="fgroup">Categoria ' + U.icon("caret-down") + "</button>" +
        '<div class="af-fgroup__panel">' +
          D.categories
            .map(function (c) {
              var on = f.cat.indexOf(c.nome) > -1;
              return (
                '<label class="af-check">' +
                  '<input type="checkbox" data-filter="cat" value="' + U.esc(c.nome) + '"' + (on ? " checked" : "") + ">" +
                  '<span class="af-check__box">' + U.icon("check", "ph-bold") + "</span>" +
                  '<span class="af-check__label">' + U.esc(c.nome) + "</span>" +
                  '<span class="af-check__n">' + c.total + "</span>" +
                "</label>"
              );
            })
            .join("") +
        "</div>" +
      "</div>";

    /* tamanhos: desabilita os que não têm estoque em nenhum produto */
    h +=
      '<div class="af-fgroup" data-open="true">' +
        '<button class="af-fgroup__title" data-act="fgroup">Tamanho ' + U.icon("caret-down") + "</button>" +
        '<div class="af-fgroup__panel"><div class="af-chips">' +
          D.sizes
            .map(function (s) {
              var temEstoque = D.products.some(function (p) {
                return p.tamanhos.some(function (t) {
                  return t.l === s && t.q > 0;
                });
              });
              var on = f.size.indexOf(s) > -1;
              return (
                '<button class="af-chip' + (on ? " is-on" : "") + (temEstoque ? "" : " af-chip--out") +
                '" data-act="ftoggle" data-group="size" data-value="' + U.esc(s) + '"' +
                (temEstoque ? "" : " disabled") + ' aria-pressed="' + (on ? "true" : "false") + '">' +
                U.esc(s) + "</button>"
              );
            })
            .join("") +
        "</div></div>" +
      "</div>";

    /* cores */
    h +=
      '<div class="af-fgroup" data-open="true">' +
        '<button class="af-fgroup__title" data-act="fgroup">Cores ' + U.icon("caret-down") + "</button>" +
        '<div class="af-fgroup__panel"><div class="af-dots">' +
          D.colors
            .map(function (c) {
              var on = f.color.indexOf(c.nome) > -1;
              return (
                '<button class="af-dot' + (on ? " is-on" : "") + '" data-act="ctoggle" data-group="color"' +
                ' data-value="' + U.esc(c.nome) + '" style="background:' + c.hex + '"' +
                ' data-name="' + U.esc(c.nome) + '" aria-pressed="' + (on ? "true" : "false") +
                '" aria-label="Filtrar por ' + U.esc(c.nome) + '"></button>'
              );
            })
            .join("") +
        "</div></div>" +
      "</div>";

    /* faixa de preço */
    var atual = typeof f.maxPrice === "number" ? f.maxPrice : D.priceMax;
    h +=
      '<div class="af-fgroup" data-open="true">' +
        '<button class="af-fgroup__title" data-act="fgroup">Preço ' + U.icon("caret-down") + "</button>" +
        '<div class="af-fgroup__panel">' +
          '<input class="af-range" type="range" min="0" max="' + D.priceMax + '" step="10" value="' + atual +
          '" data-act="frange" aria-label="Preço máximo">' +
          '<div class="af-range-vals"><span>R$ 0</span><span data-price-label>' + U.money(atual) + "</span></div>" +
        "</div>" +
      "</div>";

    /* só promoções */
    h +=
      '<div class="af-fgroup" data-open="true">' +
        '<label class="af-switch">' +
          "<span>Só em promoção</span>" +
          '<input type="checkbox" data-filter="promo"' + (f.promo ? " checked" : "") + ">" +
          '<span class="af-switch__track"></span>' +
        "</label>" +
      "</div>";

    return h;
  }

  /** Reflete o estado nos dois painéis de filtro (desktop + mobile). */
  function syncFilters() {
    var f = AF.state.filters;
    var totalF = (f.col ? f.col.length : 0);

    $$("[data-filter='cat']").forEach(function (i) {
      i.checked = f.cat.indexOf(i.value) > -1;
    });
    $$('[data-act="ftoggle"][data-group="size"]').forEach(function (b) {
      var on = f.size.indexOf(b.dataset.value) > -1;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    $$('[data-act="ctoggle"][data-group="color"]').forEach(function (b) {
      var on = f.color.indexOf(b.dataset.value) > -1;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    $$("[data-filter='promo']").forEach(function (i) {
      i.checked = f.promo;
    });
    $$('[data-act="frange"]').forEach(function (r) {
      var v = typeof f.maxPrice === "number" ? f.maxPrice : D.priceMax;
      if (document.activeElement !== r) r.value = v;
    });
    $$("[data-price-label]").forEach(function (n) {
      n.textContent = U.money(typeof f.maxPrice === "number" ? f.maxPrice : D.priceMax);
    });

    // badge de filtros ativos no botão mobile
    var total = totalF + f.cat.length + f.size.length + f.color.length + (f.promo ? 1 : 0) +
      (typeof f.maxPrice === "number" && f.maxPrice < D.priceMax ? 1 : 0);
    $$("[data-filter-count]").forEach(function (b) {
      b.textContent = total;
      b.classList.toggle("is-on", total > 0);
    });
  }

  function toggleInArray(arr, value) {
    var i = arr.indexOf(value);
    if (i > -1) arr.splice(i, 1);
    else arr.push(value);
  }

  /* Aplica mudança de filtro e re-renderiza. */
  function applyFilters() {
    AF.state.page = 1;
    renderCatalog();
    syncFilters();
  }

  function clearFilters() {
    AF.state.filters = { cat: [], col: [], size: [], color: [], promo: false, maxPrice: null };
    AF.state.page = 1;
    renderCatalog();
    syncFilters();
    renderFilters();
    toast("Filtros limpos", "funnel", "", 2200);
  }

  /* ================================================================== */
  /* SACOLA                                                             */
  /* ================================================================== */
  function cartLineHTML(it) {
    var varTxt = [it.size, it.color].filter(Boolean).join(" · ");
    var noMax = it.size ? S.calc.stockOf(it.pid, it.size) <= it.qty : false;

    return (
      '<div class="af-line" data-key="' + U.esc(it.key) + '">' +
        '<img class="af-line__img" src="' + it.produto.img + '" alt="' + U.esc(it.produto.nome) + '" loading="lazy">' +
        '<div class="af-line__body">' +
          '<div class="af-line__top">' +
            '<div class="af-line__name">' + U.esc(it.produto.nome) +
              "<span>" + U.esc(it.produto.cat) + (varTxt ? " · " + U.esc(varTxt) : "") + "</span>" +
            "</div>" +
            '<button class="af-line__del" data-act="cart-del" data-key="' + U.esc(it.key) +
              '" aria-label="Remover ' + U.esc(it.produto.nome) + ' da sacola">' + U.icon("trash") + "</button>" +
          "</div>" +
          '<div class="af-line__bot">' +
            '<div class="af-qty af-qty--sm">' +
              '<button data-act="cart-dec" data-key="' + U.esc(it.key) + '" aria-label="Diminuir quantidade">' +
                U.icon("minus") + "</button>" +
              '<span class="af-qty__val">' + it.qty + "</span>" +
              '<button data-act="cart-inc" data-key="' + U.esc(it.key) + '" aria-label="Aumentar quantidade"' +
                (noMax ? " disabled" : "") + ">" + U.icon("plus") + "</button>" +
            "</div>" +
            "<b style=\"color:var(--rosa-texto);font-size:14px\">" + U.money(it.total) + "</b>" +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function renderCart() {
    var box = $("#af-cart-items");
    if (!box) return;

    var s = S.snapshot();

    /* lista */
    if (!s.itens.length) {
      box.innerHTML =
        '<div class="af-empty" style="padding:28px 6px">' +
          '<div class="af-empty__ico">' + U.icon("handbag") + "</div>" +
          "<h3>Sua sacola está vazia</h3>" +
          "<p>Explore o catálogo e escolha suas peças favoritas. A gente guarda tudo aqui até você decidir.</p>" +
          '<div class="af-empty__actions">' +
            '<button class="af-btn af-btn--primary" data-act="goto-catalog">' + U.icon("sparkle") + "Ver catálogo</button>" +
            '<button class="af-btn af-btn--wa-outline" data-act="wa-atendimento">' + U.icon("whatsapp-logo") + "Tirar dúvidas</button>" +
          "</div>" +
        "</div>";
    } else {
      box.innerHTML = s.itens.map(cartLineHTML).join("");
    }

    /* barra de frete grátis */
    var ship = $("#af-ship-bar");
    if (ship) {
      var falta = S.calc.missingForFreeShipping();
      var free = s.itens.length > 0 && falta === 0;
      ship.classList.toggle("is-free", free);
      ship.querySelector(".af-ship-bar__fill").style.width =
        Math.round(S.calc.freeShippingProgress() * 100) + "%";
      ship.querySelector(".af-ship-bar__txt").innerHTML = free
        ? U.icon("check-circle") + " <b>Frete grátis!</b> Aproveite seu pedido."
        : U.icon("truck") + " Faltam <b>" + U.money(falta) + "</b> para ganhar <b>frete grátis</b>";
    }

    /* cupom */
    var cp = S.coupon.get();
    $$("[data-coupon-input]").forEach(function (i) {
      if (document.activeElement !== i) i.value = cp ? cp.code : "";
    });
    var cpMsg = $("#af-coupon-msg");
    if (cpMsg) {
      if (cp) {
        cpMsg.className = "af-coupon__msg is-ok";
        cpMsg.innerHTML =
          U.icon("check-circle") + " " + U.esc(cp.code) + " aplicado — " + U.esc(cp.label) +
          ' <button data-act="coupon-remove" style="text-decoration:underline;margin-left:4px">remover</button>';
      } else {
        cpMsg.className = "af-coupon__msg";
        cpMsg.textContent = AF.config.coupon
          ? "Cupom disponível: " + AF.config.coupon.code
          : "";
      }
    }

    /* totais */
    var t = $("#af-cart-totals");
    if (t) {
      var rows = "";
      rows +=
        '<div class="af-totals__row"><span>Subtotal (' + s.unidades + " " +
        (s.unidades === 1 ? "item" : "itens") + ")</span><b>" + U.money(s.subtotal) + "</b></div>";
      if (s.desconto > 0) {
        rows +=
          '<div class="af-totals__row af-totals__row--off"><span>Cupom ' + U.esc(s.cupom) +
          "</span><b>−" + U.money(s.desconto) + "</b></div>";
      }
      rows +=
        '<div class="af-totals__row"><span>Frete</span><b>' +
        (s.freteGratis || !s.itens.length ? '<span style="color:var(--wa-fonte)">Grátis</span>' : U.money(s.frete)) +
        "</b></div>";
      rows +=
        '<div class="af-totals__row af-totals__row--grand"><span>Total</span><b>' + U.money(s.total) + "</b></div>";
      var parc = U.parcelas(s.total);
      if (parc && s.itens.length) {
        rows +=
          '<div class="af-totals__row" style="font-size:11px"><span>ou</span><b>' +
          parc.n + "x de " + U.money(parc.last) + " sem juros</b></div>";
      }
      t.innerHTML = rows;
    }

    /* estado dos botões do rodapé */
    $$("[data-cart-checkout]").forEach(function (b) {
      b.disabled = !s.itens.length;
    });
  }

  /* ================================================================== */
  /* FAVORITOS                                                          */
  /* ================================================================== */
  function favLineHTML(p) {
    return (
      '<div class="af-line" data-key="' + p.id + '">' +
        '<img class="af-line__img" src="' + p.img + '" alt="' + U.esc(p.nome) + '" loading="lazy">' +
        '<div class="af-line__body">' +
          '<div class="af-line__top">' +
            '<div class="af-line__name">' + U.esc(p.nome) +
              "<span>" + U.esc(p.cat) + " · " + U.esc(p.sku) + "</span>" +
            "</div>" +
            '<button class="af-line__del" data-act="fav-del" data-pid="' + p.id +
              '" aria-label="Remover ' + U.esc(p.nome) + ' dos favoritos">' + U.icon("x") + "</button>" +
          "</div>" +
          '<div class="af-line__bot">' +
            '<b style="color:var(--rosa-texto);font-size:14px">' + U.money(p.preco) + "</b>" +
            '<span style="display:flex;gap:6px">' +
              '<button class="af-card__act" data-act="wa" data-pid="' + p.id + '" title="Tenho interesse">' +
                U.icon("whatsapp-logo") + "</button>" +
              '<button class="af-card__act af-card__add" data-act="quickadd" data-pid="' + p.id + '">' +
                U.icon("handbag") + "<span>Sacola</span></button>" +
            "</span>" +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function renderFavorites() {
    var box = $("#af-fav-items");
    if (!box) return;

    var list = S.favorites.all();

    if (!list.length) {
      box.innerHTML =
        '<div class="af-empty" style="padding:28px 6px">' +
          '<div class="af-empty__ico">' + U.icon("heart") + "</div>" +
          "<h3>Sua lista de desejos</h3>" +
          "<p>Toque no coração de qualquer peça para salvá-la aqui. Depois é só enviar a lista inteira para o WhatsApp.</p>" +
          '<div class="af-empty__actions">' +
            '<button class="af-btn af-btn--primary" data-act="goto-catalog">' + U.icon("sparkle") + "Ver catálogo</button>" +
          "</div>" +
        "</div>";
    } else {
      var total = list.reduce(function (s, p) { return s + p.preco; }, 0);
      box.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:12px">' +
          '<b style="font-size:12px;letter-spacing:.1em;text-transform:uppercase">' + list.length +
          (list.length === 1 ? " peça salva" : " peças salvas") + "</b>" +
          '<span style="font-size:12px;color:var(--rosa-texto);font-weight:700">' + U.money(total) + "</span>" +
        "</div>" +
        list.map(favLineHTML).join("");
    }

    $$("[data-fav-wa]").forEach(function (b) {
      b.disabled = !list.length;
    });
    $$("[data-fav-clear]").forEach(function (b) {
      b.disabled = !list.length;
    });
  }

  /* ================================================================== */
  /* BUSCA                                                              */
  /* ================================================================== */
  var searchTerm = "";

  function renderSearch() {
    var body = $("#af-search-body");
    var input = $("#af-search-input");
    var clear = $("#af-search-clear");
    if (!body) return;

    if (clear) clear.classList.toggle("is-on", !!searchTerm);

    var q = searchTerm.trim();

    /* estado inicial: sugestões */
    if (!q) {
      var s = D.suggestions();
      body.innerHTML =
        '<div style="margin-bottom:22px">' +
          '<span class="af-eyebrow" style="margin-bottom:10px;display:block">Buscas frequentes</span>' +
          '<div class="af-sugg">' +
            s.termos
              .map(function (t) {
                return '<button class="af-sugg__btn" data-act="search-term" data-term="' + U.esc(t) + '">' +
                  U.icon("magnifying-glass") + U.esc(t) + "</button>";
              })
              .join("") +
          "</div>" +
        "</div>" +
        '<div>' +
          '<span class="af-eyebrow" style="margin-bottom:10px;display:block">Navegar por categoria</span>' +
          '<div class="af-sugg">' +
            s.categorias
              .map(function (c) {
                return '<button class="af-sugg__btn" data-act="search-cat" data-cat="' + U.esc(c) + '">' +
                  U.icon("tag") + U.esc(c) + "</button>";
              })
              .join("") +
          "</div>" +
        "</div>" +
        (AF.wa.status().ok
          ? ""
          : '<div style="margin-top:22px;padding:13px;border-radius:14px;background:var(--rosa-claro);font-size:12px;color:var(--rosa-escuro)">' +
            U.icon("warning-circle") + " WhatsApp ainda não configurado. See js/config.js.</div>");
      return;
    }

    /* resultados */
    var res = D.search(q);

    if (!res.length) {
      body.innerHTML =
        '<div class="af-empty" style="padding:20px 4px">' +
          '<div class="af-empty__ico">' + U.icon("question") + "</div>" +
          "<h3>Nada encontrado para “" + U.esc(q) + "”</h3>" +
          "<p>Confira a escrita ou tente outro termo. Se você já sabe o que quer, a gente localiza para você pelo WhatsApp.</p>" +
          '<div class="af-empty__actions">' +
            '<button class="af-btn af-btn--wa" data-act="wa-search" data-term="' + U.esc(q) + '">' +
              U.icon("whatsapp-logo") + "Pedir “" + U.esc(q.slice(0, 18)) + (q.length > 18 ? "…" : "") + "”</button>" +
            '<button class="af-btn af-btn--ghost" data-act="search-clear">Limpar busca</button>' +
          "</div>" +
        "</div>";
      return;
    }

    body.innerHTML =
      '<div style="font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--tinta-2);margin-bottom:12px">' +
      res.length + (res.length === 1 ? " resultado" : " resultados") + "</div>" +
      '<div style="display:grid;gap:6px">' +
        res
          .slice(0, 24)
          .map(function (p) {
            return (
              '<button class="af-sres" data-act="open" data-pid="' + p.id + '">' +
                '<img class="af-sres__img" src="' + p.img + '" alt="" loading="lazy">' +
                '<span class="af-sres__info">' +
                  "<b>" + U.highlight(p.nome, q) + "</b>" +
                  "<span>" + U.esc(p.cat) + " · " + U.esc(p.sku) + "</span>" +
                "</span>" +
                '<span class="af-sres__price">' + U.money(p.preco) +
                  (p.precoAntigo ? "<s>" + U.money(p.precoAntigo) + "</s>" : "") +
                "</span>" +
              "</button>"
            );
          })
          .join("") +
      "</div>";
  }

  function setSearchTerm(term, focusInput) {
    searchTerm = term || "";
    var input = $("#af-search-input");
    if (input && input.value !== searchTerm) input.value = searchTerm;
    renderSearch();
    if (focusInput && input) input.focus();
  }

  function getSearchTerm() {
    return searchTerm;
  }

  /* ================================================================== */
  /* MODAL DE PRODUTO                                                   */
  /* ================================================================== */
  function openProduct(pid) {
    var p = D.get(pid);
    if (!p) return;

    pd.pid = pid;
    pd.size = "";
    pd.color = p.cores.length ? p.cores[0].n : "";
    pd.qty = 1;
    pd.img = 0;

    renderProductModal();
    AF.openModal("product");
  }

  function renderProductModal() {
    var p = D.get(pd.pid);
    var box = $("#af-pd");
    if (!p || !box) return;

    var col = D.collection(p.colecao);
    var fav = S.favorites.has(p.id);
    var parcelas = U.parcelas(p.preco);

    /* ---- galeria ---- */
    var gallery =
      '<div class="af-pd__gallery">' +
        '<div class="af-pd__stage">' +
          p.imgs
            .map(function (src, i) {
              return (
                '<img src="' + src + '" alt="' + U.esc(p.nome) + ' — foto ' + (i + 1) +
                '" data-pd-img="' + i + '"' + (i === pd.img ? "" : ' style="display:none"') + " decoding=\"async\">"
              );
            })
            .join("") +
        "</div>" +
        (p.imgs.length > 1
          ? '<div class="af-pd__thumbs">' +
              p.imgs
                .map(function (src, i) {
                  return (
                    '<button class="af-pd__thumb' + (i === pd.img ? " is-on" : "") + '" data-act="pd-img" data-i="' + i +
                    '" aria-label="Ver foto ' + (i + 1) + '"><img src="' + src + '" alt="" loading="lazy"></button>'
                  );
                })
                .join("") +
            "</div>"
          : "") +
      "</div>";

    /* ---- informações ---- */
    var info =
      '<div class="af-pd__info">' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">' +
          (p.tag ? '<span class="af-tag ' + p.tag.cls + '" style="position:static">' + U.esc(p.tag.txt) + "</span>" : "") +
          '<span class="af-tag af-tag--soft" style="position:static">' + U.esc(p.cat) + "</span>" +
          (col ? '<span class="af-tag" style="position:static">' + U.esc(col.nome) + "</span>" : "") +
        "</div>" +

        '<h1 class="af-pd__title">' + U.esc(p.nome) + "</h1>" +

        '<div style="display:flex;align-items:center;gap:12px;margin:10px 0 4px;flex-wrap:wrap">' +
          '<span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:700;color:var(--rosa-texto)">' +
            U.icon("star-fill") + p.rating + "</span>" +
          '<span style="font-size:11px;color:var(--tinta-2)">' + p.reviews + " avaliações</span>" +
          '<span style="font-size:11px;color:var(--tinta-3)">· SKU ' + U.esc(p.sku) + "</span>" +
        "</div>" +

        '<div class="af-pd__price" style="margin:14px 0 4px">' +
          "<b>" + U.money(p.preco) + "</b>" +
          (p.precoAntigo ? "<s>" + U.money(p.precoAntigo) + "</s>" : "") +
        "</div>" +
        (parcelas
          ? '<div style="font-size:12px;color:var(--tinta-2)">em até ' + parcelas.n + "x de " +
            U.money(parcelas.last) + " sem juros</div>"
          : "") +

        '<p class="af-pd__desc" style="margin:16px 0 22px">' + U.esc(p.desc) + "</p>" +

        /* cores */
        (p.cores.length
          ? '<div style="margin-bottom:20px">' +
              '<div class="af-opt"><span class="af-opt__label">Cor: <b>' + U.esc(pd.color || "—") + "</b></span></div>" +
              '<div class="af-colors">' +
                p.cores
                  .map(function (c) {
                    return (
                      '<button class="af-color' + (pd.color === c.n ? " is-on" : "") + '" data-act="pd-color" data-value="' +
                      U.esc(c.n) + '" style="background:' + c.hex + '" data-name="' + U.esc(c.n) +
                      '" aria-label="Cor ' + U.esc(c.n) + '" aria-pressed="' + (pd.color === c.n ? "true" : "false") + '"></button>'
                    );
                  })
                  .join("") +
              "</div>" +
            "</div>"
          : "") +

        /* tamanhos */
        '<div style="margin-bottom:8px">' +
          '<div class="af-opt">' +
            '<span class="af-opt__label">Tamanho: <b id="af-pd-size-label">' + (pd.size ? U.esc(pd.size) : "escolha") + "</b></span>" +
            '<button class="af-opt__hint" data-act="guia">Guia de medidas</button>' +
          "</div>" +
          '<div class="af-sizes" id="af-pd-sizes">' +
            p.tamanhos
              .map(function (t) {
                return (
                  '<button class="af-size' + (pd.size === t.l ? " is-on" : "") + (t.q <= 0 ? " is-out" : "") +
                  '" data-act="pd-size" data-value="' + U.esc(t.l) + '"' + (t.q <= 0 ? " disabled" : "") +
                  ' aria-pressed="' + (pd.size === t.l ? "true" : "false") + '">' + U.esc(t.l) + "</button>"
                );
              })
              .join("") +
          "</div>" +
          '<div style="font-size:11px;color:var(--tinta-2);margin-top:8px" data-stock-note></div>' +
        "</div>" +

        /* quantidade */
        '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:20px 0 22px">' +
          '<div class="af-opt" style="margin:0;flex-direction:column;align-items:flex-start;gap:8px">' +
            '<span class="af-opt__label">Quantidade</span>' +
            '<div class="af-qty">' +
              '<button data-act="pd-qty-dec" aria-label="Diminuir"' + (pd.qty <= 1 ? " disabled" : "") + ">" + U.icon("minus") + "</button>" +
              '<span class="af-qty__val">' + pd.qty + "</span>" +
              '<button data-act="pd-qty-inc" aria-label="Aumentar"' + (pd.qty >= 20 ? " disabled" : "") + ">" + U.icon("plus") + "</button>" +
            "</div>" +
          "</div>" +
          '<div style="margin-left:auto;text-align:right">' +
            '<div style="font-size:11px;color:var(--tinta-2)">Total</div>' +
            '<div style="font-size:19px;font-weight:800;color:var(--rosa-texto)" data-pd-total>' + U.money(p.preco * pd.qty) + "</div>" +
          "</div>" +
        "</div>" +

        /* ações desktop */
        '<div style="display:none;gap:10px;margin-bottom:20px" data-pd-actions class="af-pd-actions">' +
          '<button class="af-btn af-btn--primary af-btn--lg" data-act="pd-add" style="flex:1">' +
            U.icon("handbag") + "Adicionar à sacola</button>" +
          '<button class="af-btn af-btn--rose-outline af-btn--lg" data-act="pd-fav" aria-label="Favoritar" style="flex:0 0 auto;width:56px;padding:0">' +
            U.icon(fav ? "heart-fill" : "heart") + "</button>" +
        "</div>" +

        '<div class="af-trust" style="margin-bottom:22px">' +
          '<div class="af-trust__item">' + U.icon("arrows-left-right") + "Troca fácil</div>" +
          '<div class="af-trust__item">' + U.icon("truck") + "Frete grátis acima de " + U.money(AF.config.freeShippingFrom) + "</div>" +
        "</div>" +

        /* acordeões */
        '<div class="af-acc">' +
          accItem("detalhes", "Detalhes da peça", "<ul>" + p.detalhes.map(function (d) { return "<li>" + U.esc(d) + "</li>"; }).join("") + "</ul>", true) +
          accItem("composicao", "Composição e cuidados", "<p><b>Composição:</b> " + U.esc(p.composicao) + "</p><p style=\"margin-top:8px\"><b>Cuidados:</b> " + U.esc(p.cuidados) + "</p>") +
          accItem("medidas", "Medidas do mannequin", "<p>" + U.esc(p.medidas) + "</p><p style=\"margin-top:8px;font-size:12px\">Vestindo o tamanho M. Modele com 1,70 m.</p>") +
          accItem("entrega", "Entrega, trocas e pagamento",
            "<ul>" +
            "<li>Envio em até 1 dia útil após a confirmação do pagamento</li>" +
            "<li>Frete grátis para pedidos acima de " + U.money(AF.config.freeShippingFrom) + "</li>" +
            "<li>Pagamento via Pix, cartão em até " + AF.config.installments + "x sem juros ou boleto</li>" +
            "<li>Primeira troca em até 30 dias corridos</li>" +
            "<li>Dúvidas? Fale com a gente no WhatsApp</li>" +
            "</ul>") +
        "</div>" +
      "</div>";

    /* ---- barra fixa mobile ---- */
    var sticky =
      '<div class="af-sticky-buy">' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:15px;font-weight:700;color:var(--rosa-texto);line-height:1.2">' + U.money(p.preco) + "</div>" +
          '<div style="font-size:10px;color:var(--tinta-2)">' + (parcelas ? parcelas.n + "x " + U.money(parcelas.last) : "") + "</div>" +
        "</div>" +
        '<button class="af-btn af-btn--primary" data-act="pd-add" style="flex:1.2">' + U.icon("handbag") + "Adicionar</button>" +
        '<button class="af-btn af-btn--rose-outline" data-act="pd-fav" aria-label="Favoritar" style="flex:0 0 auto;width:50px;padding:0">' +
          U.icon(fav ? "heart-fill" : "heart") + "</button>" +
      "</div>";

    box.innerHTML = gallery + "<div>" + info + "</div>";

    /* injeta a barra fixa no painel (fora do scroll) */
    var panel = $("#modal-product .af-modal__panel");
    var old = panel.querySelector(".af-sticky-buy");
    if (old) old.remove();
    panel.insertAdjacentHTML("beforeend", sticky);

    /* CSS: esconde as ações desktop no mobile (a barra fixa assume) */
    var acts = box.querySelector("[data-pd-actions]");
    if (acts) acts.style.display = "flex";
    if (window.matchMedia("(max-width: 899px)").matches) acts.style.display = "none";

    /* nota de estoque */
    var note = box.querySelector("[data-stock-note]");
    if (note) {
      var q = pd.size ? S.calc.stockOf(p.id, pd.size) : null;
      note.innerHTML = pd.size
        ? q > 0
          ? U.icon("check-circle") + " " + q + " unidade" + (q > 1 ? "s" : "") + " em " + U.esc(pd.size)
          : U.icon("warning") + " Tamanho " + U.esc(pd.size) + " esgotado"
        : U.icon("info") + " Selecione um tamanho para ver a disponibilidade";
    }

    /* total dinâmico no modal */
    var totalEl = box.querySelector("[data-pd-total]");
    if (totalEl) totalEl.textContent = U.money(p.preco * pd.qty);
  }

  function accItem(id, title, html, open) {
    return (
      '<div class="af-acc__i">' +
        '<button class="af-acc__btn" data-act="acc" data-id="' + id + '" aria-expanded="' + (open ? "true" : "false") +
          '" aria-controls="acc-' + id + '">' + U.esc(title) + U.icon("caret-down") + "</button>" +
        '<div class="af-acc__panel' + (open ? " is-open" : "") + '" id="acc-' + id + '">' + html + "</div>" +
      "</div>"
    );
  }

  /*Atualiza só a seção de tamanhos após a seleção (evita re-render total). */
  function refreshSizes() {
    var p = D.get(pd.pid);
    if (!p) return;
    $$("#af-pd [data-act='pd-size']").forEach(function (b) {
      var on = pd.size === b.dataset.value;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    var label = document.getElementById("af-pd-size-label");
    var note = $("#af-pd [data-stock-note]");
    if (label) label.textContent = pd.size || "escolha";
    if (note) {
      var q = pd.size ? S.calc.stockOf(p.id, pd.size) : null;
      note.innerHTML = pd.size
        ? q > 0
          ? U.icon("check-circle") + " " + q + " unidade" + (q > 1 ? "s" : "") + " em " + U.esc(pd.size)
          : U.icon("warning") + " Tamanho " + U.esc(pd.size) + " esgotado"
        : U.icon("info") + " Selecione um tamanho para ver a disponibilidade";
    }
  }

  function refreshColors() {
    $$("#af-pd [data-act='pd-color']").forEach(function (b) {
      var on = pd.color === b.dataset.value;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    var lbl = document.getElementById("af-pd-color-label");
    if (lbl) lbl.textContent = pd.color || "—";
  }

  function getPd() {
    return pd;
  }

  /* ================================================================== */
  /* GUIA DE MEDIDAS                                                    */
  /* ================================================================== */
  function renderGuia() {
    var box = $("#modal-guia .af-modal__scroll");
    if (!box) return;

    var linhas = [
      ["PP", "82–86", "64–68", "90–94"],
      ["P", "86–90", "68–72", "94–98"],
      ["M", "90–96", "72–78", "98–104"],
      ["G", "96–102", "78–84", "104–110"],
      ["GG", "102–110", "84–92", "110–118"]
    ];

    box.innerHTML =
      '<div style="padding:clamp(20px,4vw,34px)">' +
        '<span class="af-eyebrow" style="margin-bottom:8px;display:block">Como medir</span>' +
        '<h2 class="af-title-sm" style="margin-bottom:8px">Guia de medidas</h2>' +
        '<p style="font-size:13px;color:var(--tinta-2);margin-bottom:20px">Medidas do corpo em centímetros. Se ficar entre dois tamanhos, escolha o maior.</p>' +
        '<div style="overflow-x:auto;margin-bottom:20px">' +
          '<table style="width:100%;min-width:420px;border-collapse:collapse;font-size:13px">' +
            "<thead><tr>" +
              ["Tamanho", "Busto", "Cintura", "Quadril"]
                .map(function (h) {
                  return '<th style="padding:10px;text-align:left;font-size:10px;letter-spacing:.14em;text-transform:uppercase;border-bottom:1.5px solid var(--bege-escuro);color:var(--tinta-2)">' + h + "</th>";
                })
                .join("") +
            "</tr></thead>" +
            "<tbody>" +
              linhas
                .map(function (r) {
                  return (
                    "<tr>" +
                    r
                      .map(function (c, i) {
                        return '<td style="padding:11px 10px;border-bottom:1px solid var(--rosa-claro);font-weight:' +
                          (i === 0 ? "700;color:var(--rosa-texto)" : "500") + '">' + c + "</td>";
                      })
                      .join("") +
                    "</tr>"
                  );
                })
                .join("") +
            "</tbody>" +
          "</table>" +
        "</div>" +
        '<div style="background:var(--bege);padding:16px;border-radius:16px;margin-bottom:20px">' +
          '<b style="display:block;font-size:12px;margin-bottom:8px">Dicas rápidas</b>' +
          '<ul style="font-size:12.5px;color:var(--tinta-2);line-height:1.7">' +
            "<li>• Busto: medida mais larga na altura dos seios</li>" +
            "<li>• Cintura: medida na parte mais fina do corpo</li>" +
            "<li>• Quadril: medida na parte mais larga, cerca de 20 cm abaixo da cintura</li>" +
            "<li>• Se a peça tiver amarração, prefira um tamanho acima</li>" +
          "</ul>" +
        "</div>" +
        '<button class="af-btn af-btn--wa af-btn--block" data-act="wa-guia">' +
          U.icon("whatsapp-logo") + "Enviar minhas medidas</button>" +
      "</div>";
  }

  /* ================================================================== */
  /* HOME                                                               */
  /* ================================================================== */
  function renderHome() {
    /* destaques */
    var grid = $("#af-home-grid");
    if (grid) {
      grid.innerHTML = D.destaques(8).map(productCard).join("");
      syncBadges();
    }

    /* categorias */
    var cats = $("#af-home-cats");
    if (cats) {
      var imgs = {
        Vestidos: D.img.midi,
        Conjuntos: D.img.conjAlfaiataria,
        Blusas: D.img.seda,
        Saias: D.img.plissada,
        Acessórios: D.img.bolsa
      };
      cats.innerHTML = D.categories
        .map(function (c) {
          return (
            '<button class="af-tile" data-act="cat" data-cat="' + U.esc(c.nome) + '">' +
              '<img class="af-tile__img" src="' + (imgs[c.nome] || D.img.vitrine) + '" alt="' + U.esc(c.nome) +
                '" loading="lazy" decoding="async">' +
              '<span class="af-tile__veil"></span>' +
              '<span class="af-tile__body">' +
                "<h3>" + U.esc(c.nome) + "</h3>" +
                "<p>" + c.total + " peça" + (c.total > 1 ? "s" : "") + " · a partir de " +
                  U.money(Math.min.apply(null, D.byCategory(c.nome).map(function (p) { return p.preco; }))) +
                "</p>" +
                '<span class="af-tile__go">Ver peças ' + U.icon("arrow-right") + "</span>" +
              "</span>" +
            "</button>"
          );
        })
        .join("");
    }

    /* coleções na home */
    var cols = $("#af-home-cols");
    if (cols) cols.innerHTML = collectionCards();
  }

  function collectionCards() {
    return D.collections
      .map(function (c) {
        var n = D.byCollection(c.id).length;
        return (
          '<button class="af-colcard" data-act="col" data-col="' + c.id + '">' +
            '<img class="af-colcard__img" src="' + c.img + '" alt="' + U.esc(c.nome) + '" loading="lazy" decoding="async">' +
            '<span class="af-colcard__veil"></span>' +
            '<span class="af-colcard__n">' + n + " peças</span>" +
            '<span class="af-colcard__body">' +
              "<h3>" + U.esc(c.nome) + "</h3>" +
              "<p>" + U.esc(c.tagline) + "</p>" +
              '<span class="af-colcard__go">Descobrir ' + U.icon("arrow-right") + "</span>" +
            "</span>" +
          "</button>"
        );
      })
      .join("");
  }

  /* ================================================================== */
  /* COLEÇÕES (view)                                                    */
  /* ================================================================== */
  function renderCollections() {
    var grid = $("#af-collections-grid");
    if (grid) grid.innerHTML = collectionCards();
  }

  /* ================================================================== */
  /* REVEAL ON SCROLL                                                   */
  /* ================================================================== */
  function revealOnScroll() {
    var nodes = $$(".af-reveal");
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
    );
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ================================================================== */
  AF.ui = {
    toast: toast,
    syncBadges: syncBadges,
    popFav: popFav,
    productCard: productCard,
    renderCatalog: renderCatalog,
    renderFilters: renderFilters,
    syncFilters: syncFilters,
    applyFilters: applyFilters,
    clearFilters: clearFilters,
    toggleInArray: toggleInArray,
    visibleProducts: visibleProducts,
    renderCart: renderCart,
    renderFavorites: renderFavorites,
    renderSearch: renderSearch,
    setSearchTerm: setSearchTerm,
    getSearchTerm: getSearchTerm,
    openProduct: openProduct,
    renderProductModal: renderProductModal,
    refreshSizes: refreshSizes,
    refreshColors: refreshColors,
    getPd: getPd,
    renderGuia: renderGuia,
    renderHome: renderHome,
    renderCollections: renderCollections,
    revealOnScroll: revealOnScroll,
    $: $,
    $$: $$
  };
})();
