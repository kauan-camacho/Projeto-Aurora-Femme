/* ==========================================================================
   AURORA FEMME — store.js
   Estado da sacola de compras e dos favoritos.
   Tudo é salvo em localStorage: a cliente não perde nada ao fechar a aba.
   ========================================================================== */
(function () {
  "use strict";

  var KEY_CART = "af.cart.v1";
  var KEY_FAV = "af.favs.v1";
  var KEY_COUPON = "af.coupon.v1";

  /* ------------------------------------------------------------------ */
  /* Persistência segura (não quebra se o storage estiver bloqueado)    */
  /* ------------------------------------------------------------------ */
  var storageOK = (function () {
    try {
      var k = "__af_t__";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  })();

  function read(key, fallback) {
    if (!storageOK) return fallback;
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      var val = JSON.parse(raw);
      return val == null ? fallback : val;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    if (!storageOK) return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ------------------------------------------------------------------ */
  /* MODELO DE ITEM                                                      */
  /* chave única = produto + tamanho + cor                              */
  /* ------------------------------------------------------------------ */
  function lineKey(pid, size, color) {
    return pid + "::" + (size || "-") + "::" + (color || "-");
  }

  function sanitizeLine(raw) {
    var p = AF.data.get(raw && raw.pid);
    if (!p) return null; // produto saiu do catálogo: descarta a linha

    var size = raw.size || "";
    var color = raw.color || "";

    // valida contra o cadastro atual do produto
    var sizeOk =
      !size ||
      p.tamanhos.some(function (s) {
        return s.l === size;
      });
    var colorOk =
      !color ||
      p.cores.some(function (c) {
        return c.n === color;
      });

    var qty = parseInt(raw.qty, 10);
    if (!isFinite(qty) || qty < 1) qty = 1;
    qty = Math.min(qty, 99);

    return {
      pid: p.id,
      size: sizeOk ? size : "",
      color: colorOk ? color : "",
      qty: qty
    };
  }

  /* ------------------------------------------------------------------ */
  /* ESTADO                                                             */
  /* ------------------------------------------------------------------ */
  var state = {
    cart: [],
    favorites: [],
    coupon: null // { code, percentOff, label }
  };

  /* Normaliza as linhas salvas, removendo órfãs e duplicadas. */
  (function init() {
    var saved = read(KEY_CART, []);
    if (Array.isArray(saved)) {
      var seen = {};
      state.cart = [];
      saved.forEach(function (raw) {
        var line = sanitizeLine(raw);
        if (!line) return;
        var k = lineKey(line.pid, line.size, line.color);
        if (seen[k]) {
          // mescla duplicatas
          state.cart.forEach(function (l) {
            if (lineKey(l.pid, l.size, l.color) === k) l.qty = Math.min(99, l.qty + line.qty);
          });
          return;
        }
        seen[k] = true;
        state.cart.push(line);
      });
    }

    var favs = read(KEY_FAV, []);
    if (Array.isArray(favs)) {
      var fseen = {};
      state.favorites = favs.filter(function (id) {
        if (!AF.data.get(id) || fseen[id]) return false;
        fseen[id] = true;
        return true;
      });
    }

    var cp = read(KEY_COUPON, null);
    if (cp && AF.config.coupon && cp.code === AF.config.coupon.code) {
      state.coupon = { code: cp.code, percentOff: cp.percentOff, label: cp.label };
    }
  })();

  function persistCart() {
    write(KEY_CART, state.cart);
  }
  function persistFavs() {
    write(KEY_FAV, state.favorites);
  }
  function persistCoupon() {
    write(KEY_COUPON, state.coupon);
  }

  /* ------------------------------------------------------------------ */
  /* CÁLCULOS                                                           */
  /* ------------------------------------------------------------------ */
  function unitPrice(line) {
    var p = AF.data.get(line.pid);
    return p ? p.preco : 0;
  }

  function lineTotal(line) {
    return unitPrice(line) * line.qty;
  }

  var calc = {
    /** Número de itens (soma quantidades). */
    count: function () {
      return state.cart.reduce(function (s, l) {
        return s + l.qty;
      }, 0);
    },

    /** Número de linhas distintas. */
    lines: function () {
      return state.cart.length;
    },

    /** Subtotal bruto. */
    subtotal: function () {
      return state.cart.reduce(function (s, l) {
        return s + lineTotal(l);
      }, 0);
    },

    /** Valor do desconto do cupom. */
    discount: function () {
      if (!state.coupon) return 0;
      return Math.round(calc.subtotal() * state.coupon.percentOff * 100) / 100;
    },

    /** Valor do frete (grátis acima do limite, zerado se carrinho vazio). */
    shipping: function () {
      if (!state.cart.length) return 0;
      return calc.subtotal() >= AF.config.freeShippingFrom ? 0 : AF.config.shippingCost;
    },

    /** Total final. */
    total: function () {
      var v = calc.subtotal() - calc.discount() + calc.shipping();
      return Math.max(0, Math.round(v * 100) / 100);
    },

    /** Quanto falta para ganhar frete grátis (0 = já ganhou). */
    missingForFreeShipping: function () {
      if (!state.cart.length) return AF.config.freeShippingFrom;
      var falta = AF.config.freeShippingFrom - calc.subtotal();
      return falta > 0 ? Math.round(falta * 100) / 100 : 0;
    },

    /** Progresso 0–1 da barra de frete grátis. */
    freeShippingProgress: function () {
      return Math.min(1, calc.subtotal() / AF.config.freeShippingFrom);
    },

    /** Estoque disponível de uma combinação tamanho+produto. */
    stockOf: function (pid, size) {
      var p = AF.data.get(pid);
      if (!p) return 0;
      if (!size) return p.tamanhos.reduce(function (s, t) {
        return s + t.q;
      }, 0);
      var found = p.tamanhos.filter(function (t) {
        return t.l === size;
      })[0];
      return found ? found.q : 0;
    },

    /** Quantidade já na sacola de uma combinação específica. */
    qtyInCart: function (pid, size, color) {
      var k = lineKey(pid, size, color);
      var found = state.cart.filter(function (l) {
        return lineKey(l.pid, l.size, l.color) === k;
      })[0];
      return found ? found.qty : 0;
    }
  };

  /* ------------------------------------------------------------------ */
  /* SACOLA                                                             */
  /* ------------------------------------------------------------------ */
  var cart = {
    items: function () {
      return state.cart.slice();
    },

    /** Linha expandida, já com nome/preço/imagem do produto. */
    detailed: function () {
      return state.cart
        .map(function (l) {
          var p = AF.data.get(l.pid);
          if (!p) return null;
          return {
            key: lineKey(l.pid, l.size, l.color),
            pid: l.pid,
            size: l.size,
            color: l.color,
            qty: l.qty,
            produto: p,
            unit: p.preco,
            total: lineTotal(l)
          };
        })
        .filter(Boolean);
    },

    /**
     * Adiciona um produto. Retorna { ok, msg, added, qty }.
     * Nunca ultrapassa o estoque real do tamanho escolhido.
     */
    add: function (pid, opts) {
      opts = opts || {};
      var p = AF.data.get(pid);
      if (!p) return { ok: false, msg: "Produto não encontrado." };

      var size = opts.size || "";
      var color = opts.color || "";
      var qty = parseInt(opts.qty, 10);
      if (!isFinite(qty) || qty < 1) qty = 1;

      // acessórios têm tamanho "Único" — normaliza
      if (p.tamanhos.length === 1 && p.tamanhos[0].l === "Único" && !size) {
        size = "Único";
      }
      if (size && p.tamanhos.length === 1) size = p.tamanhos[0].l;

      if (size) {
        var disp = p.tamanhos.filter(function (t) {
          return t.l === size;
        })[0];
        if (!disp) return { ok: false, msg: "Tamanho indisponível para esta peça." };
        if (disp.q <= 0) return { ok: false, msg: "Tamanho " + size + " esgotado." };
      }

      var key = lineKey(pid, size, color);
      var existing = null;
      state.cart.forEach(function (l, i) {
        if (lineKey(l.pid, l.size, l.color) === key) existing = i;
      });

      var jaNa = existing != null ? state.cart[existing].qty : 0;
      var limite = size ? calc.stockOf(pid, size) : 99;

      if (jaNa >= limite) {
        return {
          ok: false,
          msg: "Você já adicionou o máximo disponível deste tamanho."
        };
      }

      var add = Math.min(qty, limite - jaNa);

      if (existing != null) {
        state.cart[existing].qty += add;
      } else {
        state.cart.push({ pid: pid, size: size, color: color, qty: add });
      }

      persistCart();
      return {
        ok: true,
        added: add,
        limited: add < qty,
        qty: jaNa + add,
        produto: p
      };
    },

    /** Define a quantidade exata de uma linha (0 remove). */
    setQty: function (key, qty) {
      var idx = -1;
      state.cart.forEach(function (l, i) {
        if (lineKey(l.pid, l.size, l.color) === key) idx = i;
      });
      if (idx < 0) return { ok: false };

      qty = parseInt(qty, 10);
      if (!isFinite(qty) || qty < 0) qty = 0;

      if (qty === 0) {
        state.cart.splice(idx, 1);
      } else {
        var l = state.cart[idx];
        var limite = l.size ? calc.stockOf(l.pid, l.size) : 99;
        state.cart[idx].qty = Math.min(qty, limite, 99);
      }

      persistCart();
      return { ok: true, qty: qty };
    },

    /** Incrementa/decrementa em 1. */
    step: function (key, delta) {
      var line = null;
      state.cart.forEach(function (l) {
        if (lineKey(l.pid, l.size, l.color) === key) line = l;
      });
      if (!line) return { ok: false };
      return cart.setQty(key, line.qty + delta);
    },

    remove: function (key) {
      var before = state.cart.length;
      state.cart = state.cart.filter(function (l) {
        return lineKey(l.pid, l.size, l.color) !== key;
      });
      var removed = before !== state.cart.length;
      if (removed) persistCart();
      return { ok: removed };
    },

    removePid: function (pid) {
      var before = state.cart.length;
      state.cart = state.cart.filter(function (l) {
        return l.pid !== pid;
      });
      var removed = before !== state.cart.length;
      if (removed) persistCart();
      return { ok: removed };
    },

    clear: function () {
      state.cart = [];
      state.coupon = null;
      persistCart();
      persistCoupon();
    },

    has: function (pid) {
      return state.cart.some(function (l) {
        return l.pid === pid;
      });
    },

    count: calc.count
  };

  /* ------------------------------------------------------------------ */
  /* FAVORITOS                                                          */
  /* ------------------------------------------------------------------ */
  var favorites = {
    all: function () {
      return state.favorites
        .map(function (id) {
          return AF.data.get(id);
        })
        .filter(Boolean);
    },

    has: function (pid) {
      return state.favorites.indexOf(pid) > -1;
    },

    /** Alterna. Retorna { on, added } */
    toggle: function (pid) {
      if (!AF.data.get(pid)) return { ok: false, on: false };
      var i = state.favorites.indexOf(pid);
      if (i > -1) {
        state.favorites.splice(i, 1);
        persistFavs();
        return { ok: true, on: false, removed: true };
      }
      state.favorites.unshift(pid);
      persistFavs();
      return { ok: true, on: true, added: true };
    },

    add: function (pid) {
      if (!AF.data.get(pid) || favorites.has(pid)) return { ok: false, on: favorites.has(pid) };
      state.favorites.unshift(pid);
      persistFavs();
      return { ok: true, on: true, added: true };
    },

    remove: function (pid) {
      var i = state.favorites.indexOf(pid);
      if (i < 0) return { ok: false, on: false };
      state.favorites.splice(i, 1);
      persistFavs();
      return { ok: true, on: false, removed: true };
    },

    clear: function () {
      state.favorites = [];
      persistFavs();
    },

    count: function () {
      return state.favorites.length;
    }
  };

  /* ------------------------------------------------------------------ */
  /* CUPOM                                                              */
  /* ------------------------------------------------------------------ */
  var coupon = {
    get: function () {
      return state.coupon;
    },

    /** Valida e aplica. Retorna { ok, msg } */
    apply: function (code) {
      var cfg = AF.config.coupon;
      var limpo = String(code || "").trim().toUpperCase();
      if (!limpo) return { ok: false, msg: "Digite um cupom." };
      if (!cfg) return { ok: false, msg: "Nenhum cupom disponível no momento." };
      if (limpo !== cfg.code) return { ok: false, msg: "Cupom inválido ou expirado." };
      if (!state.cart.length) return { ok: false, msg: "Adicione itens antes de aplicar o cupom." };

      state.coupon = { code: cfg.code, percentOff: cfg.percentOff, label: cfg.label };
      persistCoupon();
      return { ok: true, msg: "Cupom " + cfg.code + " aplicado!" };
    },

    remove: function () {
      state.coupon = null;
      persistCoupon();
    }
  };

  /* ------------------------------------------------------------------ */
  /* SNAPSHOT DE TOTAIS PARA AS MENSAGENS DE WHATSAPP                     */
  /* ------------------------------------------------------------------ */
  function snapshot() {
    return {
      itens: cart.detailed(),
      subtotal: calc.subtotal(),
      desconto: calc.discount(),
      cupom: state.coupon ? state.coupon.code : null,
      frete: calc.shipping(),
      freteGratis: calc.shipping() === 0 && state.cart.length > 0,
      total: calc.total(),
      unidades: calc.count()
    };
  }

  /* ------------------------------------------------------------------ */
  AF.store = {
    cart: cart,
    favorites: favorites,
    coupon: coupon,
    calc: calc,
    snapshot: snapshot,
    lineKey: lineKey,
    storageAvailable: storageOK
  };
})();
