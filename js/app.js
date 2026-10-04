/* ==========================================================================
   AURORA FEMME — app.js
   Roteamento (Home / Catálogo / Coleções), painéis, eventos e atalhos.
   ========================================================================== */
(function () {
  "use strict";

  var U = AF.util;
  var D = AF.data;
  var S = AF.store;
  var UI = AF.ui;
  var $ = UI.$;
  var $$ = UI.$$;

  /* ------------------------------------------------------------------ */
  /* PAINÉIS E MODAIS                                                   */
  /* ------------------------------------------------------------------ */
  var panels = {
    menu: { el: null, overlay: true },
    cart: { el: null, overlay: true },
    fav: { el: null, overlay: true },
    filters: { el: null, overlay: true },
    search: { el: null, overlay: false } // tem backdrop próprio
  };

  var openStack = [];
  var lastFocus = null;

  function initPanels() {
    panels.menu.el = $("#drawer-menu");
    panels.cart.el = $("#drawer-cart");
    panels.fav.el = $("#drawer-fav");
    panels.filters.el = $("#drawer-filters");
    panels.search.el = $("#search-panel-host");
  }

  function overlayFor(panelId) {
    // drawers usam um overlay comum; busca e modais têm backdrop próprio
    return $("#af-overlay");
  }

  function openPanel(id) {
    var p = panels[id];
    if (!p || !p.el) return;

    lastFocus = document.activeElement;

    if (p.overlay) {
      var ov = overlayFor(id);
      if (ov) ov.classList.add("is-open");
    }
    p.el.classList.add("is-open");
    p.el.removeAttribute("aria-hidden");
    openStack.push(id);
    U.lockScroll();

    // foco no primeiro elemento útil
    setTimeout(function () {
      var f = p.el.querySelector(
        "[data-autofocus], button:not(.af-drawer__head button), input, a[href]"
      );
      if (f) f.focus({ preventScroll: true });
    }, 90);

    document.dispatchEvent(new CustomEvent("af:panel", { detail: { id: id, state: "open" } }));
  }

  function closePanel(id) {
    var p = panels[id];
    if (!p || !p.el) return;

    if (p.overlay) {
      var ov = overlayFor(id);
      if (ov) {
        // só fecha o overlay se nenhum outro painel dele estiver aberto
        var outros = ["cart", "fav", "filters", "menu"].filter(function (k) {
          return k !== id && panels[k].el && panels[k].el.classList.contains("is-open");
        });
        if (!outros.length) ov.classList.remove("is-open");
      }
    }

    p.el.classList.remove("is-open");
    p.el.setAttribute("aria-hidden", "true");
    openStack = openStack.filter(function (k) { return k !== id; });
    if (!openStack.length) U.unlockScroll();

    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent("af:panel", { detail: { id: id, state: "close" } }));
  }

  function isOpen(id) {
    var p = panels[id];
    return !!(p && p.el && p.el.classList.contains("is-open"));
  }

  function closeAllPanels() {
    Object.keys(panels).forEach(closePanel);
    closeAllModals();
  }

  /* ------------------------------ modais ------------------------------ */
  function openModal(name) {
    var m = $("#modal-" + name);
    if (!m) return;
    lastFocus = document.activeElement;
    m.classList.add("is-open");
    m.removeAttribute("aria-hidden");
    openStack.push("modal:" + name);
    U.lockScroll();
    setTimeout(function () {
      var c = m.querySelector(".af-modal__close");
      if (c) c.focus({ preventScroll: true });
    }, 90);
  }

  function closeModal(name) {
    var m = $("#modal-" + name);
    if (!m) return;
    m.classList.remove("is-open");
    m.setAttribute("aria-hidden", "true");
    openStack = openStack.filter(function (k) { return k !== "modal:" + name; });
    if (!openStack.length) U.unlockScroll();
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function closeAllModals() {
    $$(".af-modal.is-open").forEach(function (m) { closeModal(m.id.replace("modal-", "")); });
  }

  /* fecha o modal mais recente (para o ESC) */
  function closeTop() {
    var top = openStack[openStack.length - 1];
    if (!top) return false;
    if (top.indexOf("modal:") === 0) closeModal(top.slice(6));
    else closePanel(top);
    return true;
  }

  /* expõe para ui.js */
  AF.openModal = openModal;
  AF.closeModal = closeModal;
  AF.closeAll = closeAllPanels;

  /* ------------------------------------------------------------------ */
  /* ROTEAMENTO                                                         */
  /* ------------------------------------------------------------------ */
  var VIEWS = {
    home: { hash: "#/home", nav: "Home", titulo: "Início" },
    catalogo: { hash: "#/catalogo", nav: "Catálogo", titulo: "Catálogo" },
    colecoes: { hash: "#/colecoes", nav: "Coleções", titulo: "Coleções" }
  };

  function viewFromHash() {
    var h = (location.hash || "").replace("#/", "");
    var partes = h.split("/");
    return VIEWS[partes[0]] ? partes[0] : null;
  }

  /** Produto vindo de um link compartilhado: #/catalogo/<id-do-produto> */
  function productFromHash() {
    var h = (location.hash || "").replace("#/", "");
    var partes = h.split("/");
    if (partes[0] !== "catalogo" || !partes[1]) return null;
    return D.get(partes[1]) ? partes[1] : null;
  }

  function go(view, opts) {
    opts = opts || {};
    if (!VIEWS[view]) view = "home";

    // mantém o estado em sincronia com a view exibida (usado por next())
    AF.state.view = view;

    // fecha painéis (a menos que explicitamente preservado)
    if (!opts.keepPanels) closeAllPanels();

    $$(".af-view").forEach(function (v) {
      v.classList.toggle("is-active", v.id === "view-" + view);
    });

    // estado do menu
    $$("[data-nav]").forEach(function (a) {
      if (a.dataset.nav === view) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });

    // título e breadcrumb
    var cfg = VIEWS[view];
    var crumbs = $("#af-crumbs");
    if (crumbs) {
      crumbs.innerHTML =
        '<button data-act="nav" data-view="home">Home</button>' +
        '<span class="af-bc-sep">/</span>' +
        '<span class="is-current">' + cfg.nav + "</span>";
    }
    document.title = "Aurora Femme · " + cfg.titulo;

    if (location.hash !== cfg.hash && !opts.keepHash) {
      history.replaceState(null, "", cfg.hash);
    }

    // render do conteúdo da view
    if (view === "home") UI.renderHome();
    if (view === "catalogo") {
      UI.renderCatalog();
      UI.syncFilters();
    }
    if (view === "colecoes") UI.renderCollections();

    if (!opts.keepScroll) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }

    UI.revealOnScroll();
  }

  function next() {
    var ordem = ["home", "catalogo", "colecoes"];
    var i = ordem.indexOf(AF.state.view);
    return ordem[(i + 1) % ordem.length];
  }

  /* ------------------------------------------------------------------ */
  /* WHATSAPP — atalhos                                                */
  /* ------------------------------------------------------------------ */
  function linkDaPeca(pid) {
    return location.origin + location.pathname + "#/catalogo/" + pid;
  }

  function waProduct(pid, opts) {
    opts = opts || {};
    var p = D.get(pid);
    if (!p) return;
    var pd = UI.getPd();
    AF.wa.product(
      pid,
      Object.assign(
        {
          size: pd && pd.pid === pid ? pd.size : opts.size,
          color: pd && pd.pid === pid ? pd.color : opts.color,
          link: linkDaPeca(pid)
        },
        opts
      )
    );
  }

  /* ------------------------------------------------------------------ */
  /* SACOLA — ações                                                     */
  /* ------------------------------------------------------------------ */
  function addToCart(pid, opts, opts2) {
    var res = S.cart.add(pid, opts);
    if (!res.ok) {
      UI.toast(res.msg, "warning-circle", "Não foi possível adicionar", 3600, "err");
      return res;
    }

    UI.syncBadges("cart");
    UI.renderCart();
    UI.syncBadges();
    refreshWaPanel();

    if (res.limited) {
      UI.toast("Adicionamos " + res.added + " un. (limite em estoque)", "info", "Estoque", 4000);
    } else {
      UI.toast(
        res.produto.nome + (res.qty > 1 ? " × " + res.qty : ""),
        "handbag",
        "Adicionado à sacola",
        3200,
        "ok"
      );
    }

    if (opts2 && opts2.openCart) openPanel("cart");
    return res;
  }

  /** Adição rápida a partir do cartão (sem modal). */
  function quickAdd(pid) {
    var p = D.get(pid);
    if (!p) return;

    if (p.tamanhos.length === 1) {
      addToCart(pid, { size: p.tamanhos[0].l, color: p.cores.length ? p.cores[0].n : "" });
      return;
    }

    // precisa escolher tamanho: abre o modal já apontando para a lista
    UI.openProduct(pid);
    setTimeout(function () {
      var s = $("#af-pd-sizes");
      if (s) {
        s.scrollIntoView({ block: "center", behavior: "smooth" });
        s.animate(
          [
            { boxShadow: "0 0 0 0 rgba(230,74,112,0)" },
            { boxShadow: "0 0 0 6px rgba(230,74,112,.22)" },
            { boxShadow: "0 0 0 0 rgba(230,74,112,0)" }
          ],
          { duration: 900, easing: "ease-out" }
        );
      }
      UI.toast("Escolha o tamanho para continuar", "sizes", p.nome, 3400);
    }, 260);
  }

  /* ------------------------------------------------------------------ */
  /* FAVORITOS                                                          */
  /* ------------------------------------------------------------------ */
  function toggleFav(pid, btn) {
    var res = S.favorites.toggle(pid);
    if (!res.ok) return;

    UI.syncBadges(res.added ? "fav" : null);
    UI.renderFavorites();
    UI.renderCatalog();
    refreshWaPanel();

    if (btn) UI.popFav(btn);

    var p = D.get(pid);
    UI.toast(
      res.added
        ? p.nome + " — salvamos na sua lista de desejos"
        : p.nome + " removida dos favoritos",
      res.added ? "heart-fill" : "heart",
      res.added ? "Adicionado aos favoritos" : "Removido",
      3000,
      res.added ? "ok" : ""
    );
  }

  /* ------------------------------------------------------------------ */
  /* FILTROS                                                            */
  /* ------------------------------------------------------------------ */
  function setSort(value) {
    AF.state.sort = value;
    AF.state.page = 1;
    UI.renderCatalog();
    UI.toast("Ordenação atualizada", "sort-ascending", "", 2000);
  }

  function loadMore(btn) {
    if (btn.dataset.mode === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    AF.state.page++;
    UI.renderCatalog();
  }

  function applyCategory(cat) {
    AF.state.filters.cat = cat ? [cat] : [];
    AF.state.filters.col = [];
    AF.state.page = 1;
    UI.renderCatalog();
    UI.renderFilters();
    updateCatalogHead();
  }

  function applyCollection(col) {
    AF.state.filters.col = col ? [col] : [];
    AF.state.filters.cat = [];
    AF.state.page = 1;
    UI.renderCatalog();
    UI.renderFilters();
    updateCatalogHead();
  }

  /* Cabeçalho do catálogo: reflete categoria/coleção ativa. */
  function updateCatalogHead() {
    var f = AF.state.filters;
    var title = $("#af-cat-title");
    var sub = $("#af-cat-sub");
    var bc = $("#af-cat-bc");

    if (f.col && f.col.length) {
      var c = D.collection(f.col[0]);
      if (c && title) title.textContent = c.nome;
      if (c && sub) sub.textContent = c.desc;
      if (bc) bc.textContent = c ? c.nome : "Coleção";
      return;
    }

    if (f.cat.length === 1) {
      var lista = D.byCategory(f.cat[0]);
      var min = Math.min.apply(null, lista.map(function (p) { return p.preco; }));
      if (title) title.textContent = f.cat[0];
      if (sub)
        sub.textContent =
          lista.length +
          (lista.length === 1 ? " peça disponível" : " peças disponíveis") +
          ", a partir de " + U.money(min) + ".";
      if (bc) bc.textContent = f.cat[0];
      return;
    }

    if (f.cat.length > 1) {
      if (title) title.textContent = f.cat.join(" · ");
      if (sub) sub.textContent = "Mostrando as categorias selecionadas.";
      if (bc) bc.textContent = f.cat.length + " categorias";
      return;
    }

    if (title) title.textContent = "Todos os produtos";
    if (sub)
      sub.textContent =
        D.products.length +
        " peças selecionadas para você. Use os filtros para-afinar a busca por tamanho, cor e preço.";
    if (bc) bc.textContent = "Todos os produtos";
  }

  /* ------------------------------------------------------------------ */
  /* CUPOM                                                              */
  /* ------------------------------------------------------------------ */
  function applyCoupon() {
    var input = $("[data-coupon-input]");
    var res = S.coupon.apply(input ? input.value : "");
    var msg = $("#af-coupon-msg");

    if (msg) {
      msg.className = "af-coupon__msg " + (res.ok ? "is-ok" : "is-err");
      msg.textContent = res.msg;
    }
    if (res.ok) {
      UI.renderCart();
      UI.toast(res.msg, "ticket", "Cupom", 3200, "ok");
    } else {
      UI.toast(res.msg, "warning-circle", "Cupom", 3400, "err");
    }
  }

  /* ------------------------------------------------------------------ */
  /* DELEGAÇÃO DE EVENTOS                                               */
  /* ------------------------------------------------------------------ */
  function onClick(ev) {
    var t = ev.target;

    /* ---------- data-ui: abrir/fechar painéis ---------- */
    var opener = t.closest("[data-ui]");
    if (opener) {
      ev.preventDefault();
      var id = opener.dataset.ui;
      if (id === "wa") {
        toggleWaPanel();
        return;
      }
      if (id === "filters") {
        UI.renderFilters();
        openPanel("filters");
        return;
      }
      openPanel(id);
      return;
    }

    /* fecha o painel flutuante do WhatsApp pelo X */
    if (t.closest("[data-act='wa-close']")) {
      ev.preventDefault();
      toggleWaPanel(false);
      return;
    }

    var closer = t.closest("[data-ui-close]");
    if (closer) {
      ev.preventDefault();
      var cid = closer.dataset.uiClose;
      if (cid === "*") closeAllPanels();
      else if (document.getElementById("modal-" + cid)) closeModal(cid);
      else closePanel(cid);
      return;
    }

    /* ---------- data-act: ações ---------- */
    var node = t.closest("[data-act]");
    if (!node) return;
    ev.preventDefault();
    var act = node.dataset.act;
    var pid = node.dataset.pid;

    switch (act) {
      /* navegação (menu de 3 partes) */
      case "nav":
        go(node.dataset.view);
        break;

      case "go-next":
        go(next());
        break;

      /* produto */
      case "open":
        UI.openProduct(pid);
        closePanel("search");
        break;

      case "wa":
        waProduct(pid);
        break;

      case "quickadd":
        quickAdd(pid);
        break;

      /* favoritos */
      case "fav":
        toggleFav(pid, node.classList.contains("af-card__fav") ? node : null);
        break;

      case "fav-del":
        S.favorites.remove(pid);
        UI.syncBadges();
        UI.renderFavorites();
        UI.renderCatalog();
        refreshWaPanel();
        UI.toast("Removida dos favoritos", "heart", "", 2400);
        break;

      case "fav-clear-all": {
        var n = S.favorites.count();
        if (!n) return;
        S.favorites.clear();
        UI.syncBadges();
        UI.renderFavorites();
        UI.renderCatalog();
        refreshWaPanel();
        UI.toast("Lista de favoritos limpa", "trash", "", 2600);
        break;
      }

      /* sacola */
      case "cart-inc":
      case "cart-dec": {
        var key = node.dataset.key;
        var r = S.cart.step(key, act === "cart-inc" ? 1 : -1);
        if (r.ok) {
          UI.syncBadges();
          UI.renderCart();
          refreshWaPanel();
          if (act === "cart-dec" && S.cart.detailed().every(function (x) { return x.key !== key; })) {
            UI.toast("Item removido da sacola", "trash", "", 2400);
          }
        }
        break;
      }

      case "cart-del": {
        var k = node.dataset.key;
        var line = document.querySelector('.af-line[data-key="' + CSS.escape(k) + '"]');
        if (line) line.classList.add("is-out");
        setTimeout(function () {
          S.cart.remove(k);
          UI.syncBadges();
          UI.renderCart();
          refreshWaPanel();
          UI.toast("Item removido da sacola", "trash", "", 2400);
        }, 220);
        break;
      }

      case "goto-catalog":
        closeAllPanels();
        go("catalogo");
        break;

      /* busca */
      case "search-term":
        UI.setSearchTerm(node.dataset.term, true);
        break;

      case "search-cat":
        closeAllPanels();
        applyCategory(node.dataset.cat);
        go("catalogo");
        break;

      case "search-clear":
        UI.setSearchTerm("", true);
        break;

      case "wa-search":
        AF.wa.searchHelp(node.dataset.term);
        break;

      /* filtros */
      case "ftoggle":
        UI.toggleInArray(AF.state.filters[node.dataset.group], node.dataset.value);
        UI.applyFilters();
        break;

      case "ctoggle":
        UI.toggleInArray(AF.state.filters.color, node.dataset.value);
        UI.applyFilters();
        break;

      case "unfilter": {
        var g = node.dataset.group;
        var v = node.dataset.value;
        if (g === "promo") AF.state.filters.promo = false;
        else if (g === "price") AF.state.filters.maxPrice = null;
        else AF.state.filters[g] = AF.state.filters[g].filter(function (x) {
          return String(x) !== String(v);
        });
        UI.applyFilters();
        UI.renderFilters();
        updateCatalogHead();
        break;
      }

      case "clear-filters":
        UI.clearFilters();
        updateCatalogHead();
        break;

      case "fgroup": {
        var g2 = node.closest(".af-fgroup");
        if (g2) g2.dataset.open = g2.dataset.open === "false" ? "true" : "false";
        break;
      }

      case "more":
        loadMore(node);
        break;

      /* coleções / categorias */
      case "cat":
        applyCategory(node.dataset.cat);
        go("catalogo");
        break;

      case "col":
        applyCollection(node.dataset.col);
        go("catalogo");
        break;

      /* cupom */
      case "coupon-apply":
        applyCoupon();
        break;

      case "coupon-remove":
        S.coupon.remove();
        UI.renderCart();
        break;

      /* whatsapp */
      case "wa-checkout":
        closePanel("cart");
        AF.wa.checkout();
        break;

      case "wa-atendimento":
        closeAllPanels();
        if (node.dataset.waHref) AF.wa.open(node.dataset.waHref);
        else AF.wa.atendimento(node.dataset.assunto);
        break;

      case "wa-fav":
        closePanel("fav");
        AF.wa.favorites({ link: location.href });
        break;

      case "wa-help":
        AF.wa.searchHelp(node.dataset.term || AF.state.term);
        break;

      case "wa-guia": {
        var pGuia = UI.getPd();
        closeModal("guia");
        AF.wa.guiaMedidas(pGuia ? pGuia.pid : null);
        break;
      }

      /* modal de produto */
      case "pd-size": {
        var pd = UI.getPd();
        pd.size = node.dataset.value;
        UI.refreshSizes();
        var p = D.get(pd.pid);
        var st = p.tamanhos.filter(function (t) { return t.l === pd.size; })[0];
        if (st && st.q <= 2) {
          UI.toast("Restam " + st.q + " unidades em " + pd.size, "warning", "Últimas peças", 3200);
        }
        break;
      }

      case "pd-color": {
        var pd2 = UI.getPd();
        pd2.color = node.dataset.value;
        UI.refreshColors();
        break;
      }

      case "pd-qty-inc": {
        var pd3 = UI.getPd();
        pd3.qty = Math.min(20, pd3.qty + 1);
        UI.renderProductModal();
        break;
      }

      case "pd-qty-dec": {
        var pd4 = UI.getPd();
        pd4.qty = Math.max(1, pd4.qty - 1);
        UI.renderProductModal();
        break;
      }

      case "pd-img": {
        var pd5 = UI.getPd();
        pd5.img = parseInt(node.dataset.i, 10) || 0;
        $$("#af-pd [data-pd-img]").forEach(function (im) {
          im.style.display = im.dataset.pdImg === String(pd5.img) ? "" : "none";
        });
        $$("#af-pd [data-act='pd-img']").forEach(function (b) {
          b.classList.toggle("is-on", b.dataset.i === String(pd5.img));
        });
        break;
      }

      case "pd-fav": {
        var pd6 = UI.getPd();
        toggleFav(pd6.pid, null);
        UI.renderProductModal();
        break;
      }

      case "pd-add": {
        var pd7 = UI.getPd();
        var prod = D.get(pd7.pid);
        var unico = prod.tamanhos.length === 1;
        var tamanho = unico ? prod.tamanhos[0].l : pd7.size;

        if (!unico && !tamanho) {
          var alvo = $("#af-pd-sizes");
          if (alvo) {
            alvo.animate(
              [
                { boxShadow: "0 0 0 0 rgba(230,74,112,0)" },
                { boxShadow: "0 0 0 8px rgba(230,74,112,.25)" },
                { boxShadow: "0 0 0 0 rgba(230,74,112,0)" }
              ],
              { duration: 700, easing: "ease-out" }
            );
            alvo.scrollIntoView({ block: "center", behavior: "smooth" });
          }
          UI.toast("Escolha um tamanho antes de continuar", "sizes", "Falta uma informação", 3400, "err");
          return;
        }

        // feedback no botão
        var original = node.innerHTML;
        node.disabled = true;
        node.innerHTML = '<span class="af-spinner" aria-hidden="true"></span>';

        setTimeout(function () {
          var r = addToCart(pd7.pid, { size: tamanho, color: pd7.color, qty: pd7.qty });
          node.disabled = false;
          if (r.ok) {
            node.innerHTML = U.icon("check") + "Adicionado!";
            setTimeout(function () {
              node.innerHTML = original;
              closeModal("product");
              openPanel("cart");
            }, 700);
          } else {
            node.innerHTML = original;
          }
        }, 480);
        break;
      }

      /* acordeões */
      case "acc": {
        var panel = document.getElementById("acc-" + node.dataset.id);
        var on = node.getAttribute("aria-expanded") === "true";
        node.setAttribute("aria-expanded", on ? "false" : "true");
        if (panel) panel.classList.toggle("is-open", !on);
        break;
      }

      case "guia":
        UI.renderGuia();
        openModal("guia");
        break;

      case "guia-close":
      case "close-product":
        closeModal(node.dataset.act === "guia-close" ? "guia" : "product");
        break;

      /* ver tudo */
      case "see-all":
        go("catalogo");
        break;

      case "see-cols":
        go("colecoes");
        break;
    }
  }

  /* ---------- mudanças de input ---------- */
  function onChange(ev) {
    var t = ev.target;

    /* filtros por checkbox */
    var f = t.closest("[data-filter]");
    if (f) {
      var key = f.dataset.filter;
      if (key === "promo") {
        AF.state.filters.promo = f.checked;
      } else {
        var arr = AF.state.filters[key];
        var i = arr.indexOf(f.value);
        if (f.checked && i < 0) arr.push(f.value);
        if (!f.checked && i > -1) arr.splice(i, 1);
      }
      UI.applyFilters();
      if (key === "cat") updateCatalogHead();
      return;
    }

    /* ordenação */
    if (t.matches("[data-sort]")) {
      setSort(t.value);
      return;
    }
  }

  var onRange = U.debounce(function (e) {
    AF.state.filters.maxPrice = parseInt(e.target.value, 10);
    UI.applyFilters();
  }, 220);

  function onInput(ev) {
    var t = ev.target;

    if (t.id === "af-search-input") {
      UI.setSearchTerm(t.value);
      return;
    }

    if (t.matches("[data-act='frange']")) {
      var lab = t.parentNode.querySelector("[data-price-label]");
      if (lab) lab.textContent = U.money(parseInt(t.value, 10));
      onRange({ target: t });
      return;
    }
  }

  function onKeydown(ev) {
    /* ESC fecha o que estiver no topo */
    if (ev.key === "Escape") {
      if (closeTop()) {
        ev.preventDefault();
        return;
      }
      if (isOpen("wa")) {
        toggleWaPanel(false);
      }
    }

    /* atalhos de teclado */
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName);

    if (!typing && (ev.key === "/" || ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "k"))) {
      ev.preventDefault();
      openPanel("search");
      setTimeout(function () {
        var i = $("#af-search-input");
        if (i) i.focus();
      }, 100);
      return;
    }

    if (!typing && ev.altKey && /^[123]$/.test(ev.key)) {
      ev.preventDefault();
      go(["home", "catalogo", "colecoes"][parseInt(ev.key, 10) - 1]);
      return;
    }

    /* Enter no cartão de produto */
    if (ev.key === "Enter" && ev.target.classList && ev.target.classList.contains("af-card__name")) {
      ev.preventDefault();
      UI.openProduct(ev.target.dataset.pid);
    }
  }

  /* ------------------------------------------------------------------ */
  /* PAINEL FLUTUANTE DO WHATSAPP                                       */
  /* ------------------------------------------------------------------ */
  function toggleWaPanel(force) {
    var p = $("#af-wa-panel");
    if (!p) return;
    var willOpen = typeof force === "boolean" ? force : !p.classList.contains("is-open");
    p.classList.toggle("is-open", willOpen);
    p.setAttribute("aria-hidden", willOpen ? "false" : "true");
    var btn = $("#af-wa-btn");
    if (btn) btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
    // garante que o painel nunca mostre dados desatualizados
    if (willOpen) refreshWaPanel();
  }

  function refreshWaPanel() {
    var s = S.snapshot();
    var btnCheckout = $("#af-wa-checkout");
    var info = $("#af-wa-cart-info");

    if (btnCheckout) {
      btnCheckout.disabled = !s.itens.length;
      if (info) {
        info.textContent = s.itens.length
          ? s.unidades + (s.unidades > 1 ? " itens" : " item") + " · " + U.money(s.total)
          : "Sua sacola está vazia";
      }
    }

    var favBtn = $("#af-wa-fav");
    var n = S.favorites.count();
    if (favBtn) {
      favBtn.disabled = !n;
      var small = favBtn.querySelector("small");
      if (small) small.textContent = n ? n + " peça" + (n > 1 ? "s" : "") + " salva" + (n > 1 ? "s" : "") : "Nenhuma peça salva";
    }
  }

  /* ------------------------------------------------------------------ */
  /* SCROLL: header                                                     */
  /* ------------------------------------------------------------------ */
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var root = document.documentElement;

    if (y > 12) root.classList.add("af-scrolled");
    else root.classList.remove("af-scrolled");

    // toasts sobem quando o botão flutuante está por perto
    var toasts = $("#af-toasts");
    if (toasts) {
      toasts.classList.toggle("is-high", y < 40 && U.mq("(max-width: 1023px)"));
    }
  }

  /* ------------------------------------------------------------------ */
  /* INICIALIZAÇÃO                                                      */
  /* ------------------------------------------------------------------ */
  function init() {
    initPanels();

    /* ---- render inicial ---- */
    UI.renderHome();
    UI.renderCollections();
    UI.renderFilters();
    UI.renderCatalog();
    UI.renderCart();
    UI.renderFavorites();
    UI.renderSearch();
    UI.renderGuia();
    UI.syncBadges();
    refreshWaPanel();
    updateCatalogHead();

    /* ---- preenche conteúdo estático do WhatsApp ---- */
    var waNum = $("#af-wa-number");
    if (waNum) waNum.textContent = AF.config.whatsapp;
    var waLink = $("#af-wa-cta");
    if (waLink) {
      waLink.href = AF.wa.link();
      if (!AF.wa.status().ok) {
        waLink.dataset.broken = "1";
      }
    }
    $$("[data-wa-simple]").forEach(function (a) {
      a.href = AF.wa.linkWith(AF.config.atendimentoPrefixo);
    });
    $$("[data-wa-href]").forEach(function (a) {
      a.href = AF.wa.linkWith(a.dataset.waHref);
    });

    /* ---- dados da loja vindos de js/config.js ----
       data-cfg="chave"        -> texto = AF.config[chave]
       data-cfg-href="chave"   -> href  = AF.config[chave] (e-mail vira mailto:) */
    $$("[data-cfg]").forEach(function (el) {
      var v = AF.config[el.dataset.cfg];
      if (v) el.textContent = v;
    });
    $$("[data-cfg-href]").forEach(function (el) {
      var chave = el.dataset.cfgHref;
      var v = AF.config[chave];
      if (!v) return;
      el.href = chave === "email" ? "mailto:" + v : v;
    });

    /* ---- listeners ---- */
    document.addEventListener("click", onClick);
    document.addEventListener("change", onChange);
    document.addEventListener("input", onInput);
    document.addEventListener("keydown", onKeydown);

    $("#af-overlay").addEventListener("click", closeAllPanels);

    /* busca: abrir/fechar */
    $$("[data-ui='search']").forEach(function (b) {
      b.addEventListener("click", function () {
        setTimeout(function () {
          var i = $("#af-search-input");
          if (i) i.focus();
        }, 120);
      });
    });

    /* cupom por Enter */
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" && ev.target.matches && ev.target.matches("[data-coupon-input]")) {
        ev.preventDefault();
        applyCoupon();
      }
    });

    /* mantém painéis sincronizados */
    ["cart", "fav"].forEach(function (k) {
      document.addEventListener("af:panel", function (ev) {
        if (ev.detail.id !== k) return;
        if (ev.detail.state === "open") {
          if (k === "cart") UI.renderCart();
          else UI.renderFavorites();
        }
        refreshWaPanel();
      });
    });

    /* redimensionar: fecha painéis que não fazem sentido na nova largura */
    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (U.mq("(min-width: 1024px)")) {
          closePanel("menu");
          closePanel("filters");
        }
      }, 160);
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    window.addEventListener("hashchange", function () {
      var v = viewFromHash();
      if (v) go(v, { keepScroll: true, keepHash: true });
      var pid = productFromHash();
      if (pid) UI.openProduct(pid);
    });

    /* inicial: respeita a hash da URL */
    var deep = productFromHash();
    var inicial = viewFromHash();
    if (inicial) go(inicial, { keepHash: true });
    else history.replaceState(null, "", VIEWS.home.hash);

    if (deep) {
      UI.openProduct(deep);
      history.replaceState(null, "", "#/catalogo/" + deep);
    }

    /* fecha a busca ao clicar no fundo */
    var sp = $("#search-panel-host");
    if (sp) {
      sp.addEventListener("click", function (ev) {
        if (ev.target.classList.contains("af-search__backdrop")) closePanel("search");
      });
    }

    UI.revealOnScroll();

    /* aviso amigável se o WhatsApp ainda não foi configurado */
    if (!AF.wa.status().ok) {
      setTimeout(function () {
        UI.toast(
          "Lembre de trocar o número do WhatsApp em js/config.js",
          "warning-circle",
          "Configuração",
          6000,
          "err"
        );
      }, 1400);
    }

    /* sinaliza que o site está pronto */
    document.documentElement.classList.add("af-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
