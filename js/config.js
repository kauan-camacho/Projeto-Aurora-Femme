/* ==========================================================================
   AURORA FEMME — config.js
   --------------------------------------------------------------------------
   >>> ALTERE AQUI OS DADOS DA LOJA <<<
   Tudo o que precisa mudar (WhatsApp, frete, cupom, redes) está neste bloco.
   ========================================================================== */
window.AF = window.AF || {};

AF.config = {
  /* ------------------------------------------------------------------
     WHATSAPP — número com DDI e DDD.
     Aceita espaços, traço, parênteses e "+". Ex.: '+55 11 98888-7777'
     ------------------------------------------------------------------ */
  whatsapp: "+55 19 99518-2428",

  /* Mensagem padrão quando o cliente só quer falar com a loja */
  atendimentoPrefixo:
    "Olá! Vim pelo site da Aurora Femme e gostaria de uma ajuda.",

  storeName: "Aurora Femme",
  tagline: "Elegância Vibrante",
  instagram: "https://instagram.com/aurorafemme",
  email: "contato@aurorafemme.com.br",
  endereco: "Rua das Flores, 123 — Cambuí, Campinas/SP",
  horario: "Seg a Sex 9h às 18h · Sáb 9h às 13h",

  /* Regras de commerce */
  freeShippingFrom: 299, // frete grátis a partir deste valor
  shippingCost: 19.9, // custo do frete abaixo do mínimo
  installments: 3, // parcelas sem juros
  minPerInstallment: 20, // valor mínimo da parcela

  /* Cupom de exemplo (deixe null para desativar) */
  coupon: { code: "AURORA10", percentOff: 0.1, label: "10% de desconto" },

  /* Itens exibidos por página no catálogo */
  pageSize: 8,

  /* Mensagem fixa no topo */
  topbarMsg: "Frete grátis acima de R$ 299"
};

/* --------------------------------------------------------------------------
   Utilitários gerais
   -------------------------------------------------------------------------- */
AF.util = (function () {
  "use strict";

  var nfBRL = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  /** Formata número como moeda brasileira. Ex.: 189.9 -> "R$ 189,90" */
  function money(value) {
    return nfBRL.format(Number(value) || 0);
  }

  /** Remove tudo que não for dígito. Ex.: '+55 (11) 90000-0000' -> '5511900000000' */
  function digits(value) {
    return String(value == null ? "" : value).replace(/\D/g, "");
  }

  /** Escapa HTML para evitar quebra de layout / injeção. */
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Normaliza texto para busca: minúsculo e sem acentos.
   * "Canjelado Noir" e "canjelado noír" passam a casar.
   */
  function norm(str) {
    return String(str == null ? "" : str)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  /** Remove acentos de uma string (para exibir no placeholder/label). */
  function deaccent(str) {
    return String(str == null ? "" : str)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  /** Divide a descrição em um Array de frases curtas. */
  function sentences(text) {
    return String(text || "")
      .split(/(?<=[.!?])\s+/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }

  /** "R$ 289,90" -> 3x de "R$ 96,63" (ajusta arredondamento) */
  function parcelas(total, n) {
    n = n || AF.config.installments;
    total = Number(total) || 0;
    if (n < 2 || total < AF.config.minPerInstallment) return null;
    var base = Math.floor((total / n) * 100) / 100;
    var last = Math.round((total - base * (n - 1)) * 100) / 100;
    return {
      n: n,
      first: base,
      last: last
    };
  }

  function textoParcelas(total) {
    var p = parcelas(total);
    if (!p) return null;
    return p.n + "x de " + money(p.last) + " sem juros";
  }

  /** Debounce simples para inputs. */
  function debounce(fn, wait) {
    var t;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, wait || 180);
    };
  }

  /** Slug para data-link. */
  function slug(str) {
    return norm(str)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /** Destaca o termo buscado dentro de um texto (usado na busca). */
  function highlight(text, term) {
    var clean = esc(text);
    if (!term) return clean;
    var needle = deaccent(norm(term)).trim();
    if (needle.length < 2) return clean;
    var map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    var rx = new RegExp("(" + needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
    return clean.replace(rx, "<mark>$1</mark>");
  }

  /** Ícone Phosphor com classes de tamanho consistentes. */
  function icon(name, cls) {
    return '<i class="ph ' + (cls || "") + " ph-" + name + '" aria-hidden="true"></i>';
  }

  /** Aplica a classe is-active em um grupo de elementos. */
  function setGroup(selector, matcher) {
    var nodes = document.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) {
      var on = matcher(nodes[i]);
      nodes[i].classList.toggle("is-on", on);
      if (on) nodes[i].setAttribute("aria-pressed", "true");
      else nodes[i].removeAttribute("aria-pressed");
    }
  }

  /** Media query como função. */
  function mq(query) {
    return window.matchMedia(query).matches;
  }

  /** Trava o scroll do fundo sem causar "pulo" de layout. */
  var lockCount = 0;
  function lockScroll() {
    if (lockCount === 0) {
      var gap = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = gap > 0 ? gap + "px" : "";
    }
    lockCount++;
    document.body.classList.add("af-locked");
  }

  function unlockScroll() {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.body.classList.remove("af-locked");
      document.body.style.paddingRight = "";
    }
  }

  function resetScroll() {
    lockCount = 0;
    document.body.classList.remove("af-locked");
    document.body.style.paddingRight = "";
  }

  return {
    money: money,
    digits: digits,
    esc: esc,
    norm: norm,
    deaccent: deaccent,
    sentences: sentences,
    parcelas: parcelas,
    textoParcelas: textoParcelas,
    debounce: debounce,
    slug: slug,
    highlight: highlight,
    icon: icon,
    setGroup: setGroup,
    mq: mq,
    lockScroll: lockScroll,
    unlockScroll: unlockScroll,
    resetScroll: resetScroll
  };
})();
