(function () {
  var AXES = [
    { key: "initiative", label: "主体性・成長意欲" },
    { key: "romance", label: "課題をロマンに変える力" },
    { key: "cocreation", label: "共創・貢献力" },
    { key: "character", label: "人柄・価値観" },
    { key: "vision", label: "Vision・実行力" }
  ];

  var app = document.getElementById("app");
  var members = window.MUJINTO_MEMBERS || [];
  var page = document.body.dataset.page;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function take(list, max) {
    return (list || []).filter(Boolean).slice(0, max);
  }

  function findMember(id) {
    return members.filter(function (member) {
      return member.id === id;
    })[0] || null;
  }

  function monogram(name) {
    var mark = el("span", "monogram", (name || "？").slice(0, 1));
    mark.setAttribute("aria-hidden", "true");
    return mark;
  }

  function point(index, value) {
    var angle = (-Math.PI / 2) + (index * 2 * Math.PI / AXES.length);
    var radius = (Math.max(0, Math.min(10, value)) / 10) * 72;
    return [100 + radius * Math.cos(angle), 100 + radius * Math.sin(angle)];
  }

  function ringPath(value) {
    return AXES.map(function (_, index) {
      var p = point(index, value);
      return (index === 0 ? "M" : "L") + p[0].toFixed(2) + " " + p[1].toFixed(2);
    }).join(" ") + " Z";
  }

  function radarSvg(member) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 200 200");
    svg.setAttribute("class", "radar");
    svg.setAttribute("aria-hidden", "true");

    [2, 4, 6, 8, 10].forEach(function (level) {
      var ring = document.createElementNS("http://www.w3.org/2000/svg", "path");
      ring.setAttribute("d", ringPath(level));
      ring.setAttribute("class", "radar-grid");
      svg.appendChild(ring);
    });

    AXES.forEach(function (_, index) {
      var end = point(index, 10);
      var axis = document.createElementNS("http://www.w3.org/2000/svg", "line");
      axis.setAttribute("x1", "100");
      axis.setAttribute("y1", "100");
      axis.setAttribute("x2", end[0].toFixed(2));
      axis.setAttribute("y2", end[1].toFixed(2));
      axis.setAttribute("class", "radar-axis");
      svg.appendChild(axis);
    });

    var shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
    var values = AXES.map(function (axis) {
      return Number(member.scores[axis.key]);
    });
    shape.setAttribute("d", AXES.map(function (_, index) {
      var p = point(index, values[index]);
      return (index === 0 ? "M" : "L") + p[0].toFixed(2) + " " + p[1].toFixed(2);
    }).join(" ") + " Z");
    shape.setAttribute("class", "radar-value");
    shape.setAttribute("pathLength", "1");
    svg.appendChild(shape);
    return svg;
  }

  function drawRadars(root) {
    var shapes = root.querySelectorAll(".radar-value");
    window.requestAnimationFrame(function () {
      shapes.forEach(function (shape) {
        shape.classList.add("is-drawn");
      });
    });
  }

  function scoreList(member) {
    var list = el("ul", "score-list");
    AXES.forEach(function (axis) {
      var item = el("li");
      item.append(el("span", null, axis.label), el("strong", null, String(member.scores[axis.key])));
      list.append(item);
    });
    return list;
  }

  function radarBlock(member, large) {
    var block = el("div", large ? "radar-panel radar-panel-lg" : "radar-panel");
    var chart = el("div", "radar-chart");
    chart.append(radarSvg(member));
    var copy = el("div");
    copy.append(scoreList(member), el("p", "score-note", "各10点満点"));
    block.append(chart, copy);
    return block;
  }

  function bulletPanel(title, items) {
    if (!items.length) return null;
    var panel = el("section", "panel");
    panel.append(el("h3", null, title));
    var list = el("ul");
    items.forEach(function (item) {
      list.append(el("li", null, item));
    });
    panel.append(list);
    return panel;
  }

  function pair(left, right) {
    if (!left && !right) return null;
    var wrap = el("div", "pair");
    if (left) wrap.append(left);
    if (right) wrap.append(right);
    return wrap;
  }

  function chrome() {
    var header = el("header", "site-header");
    var inner = el("div", "site-header-inner");
    var brand = el("div", "brand-block");
    var logo = el("a", "site-logo", "無人島 Connect");
    logo.href = "index.html";
    brand.append(logo, el("p", "site-tagline", "人と事業が、島の未来をつくる"));
    var nav = el("nav", "site-nav");
    nav.setAttribute("aria-label", "主要");
    var listLink = el("a", "nav-link", "メンバー一覧");
    listLink.href = "index.html";
    if (page === "list") listLink.setAttribute("aria-current", "page");
    nav.append(listLink);
    inner.append(brand, nav);
    header.append(inner);

    var footer = el("footer", "site-footer");
    var footerInner = el("div", "site-footer-inner");
    footerInner.append(el("p", null, "ヒアリングに基づく紹介です。点数は各10点満点です。"));
    footer.append(footerInner);
    return { header: header, footer: footer };
  }

  function mount(main) {
    var frame = chrome();
    app.replaceChildren(frame.header, main, frame.footer);
    drawRadars(app);
  }

  function renderList() {
    document.title = "メンバー | 無人島 Connect";
    var main = el("main", "site-main");
    main.id = "main";
    main.append(el("h1", "page-title", "メンバー"));

    if (!members.length) {
      main.append(el("p", "empty-copy", "メンバーはまだいません。"));
      mount(main);
      return;
    }

    var grid = el("div", "member-grid");
    members.forEach(function (member) {
      var card = el("a", "member-card");
      card.href = "member.html?id=" + encodeURIComponent(member.id);
      var head = el("div", "card-head");
      var titles = el("div");
      titles.append(el("h2", "card-name", member.name), el("p", "role", member.role));
      head.append(monogram(member.name), titles);
      card.append(head, el("p", "card-summary", member.summary), radarBlock(member, false), el("span", "card-action", "紹介を見る"));
      grid.append(card);
    });
    main.append(grid);
    mount(main);
  }

  function renderMissing() {
    document.title = "メンバーが見つかりません | 無人島 Connect";
    var main = el("main", "site-main is-error");
    main.id = "main";
    var back = el("a", "back-link", "メンバー一覧へ");
    back.href = "index.html";
    main.append(
      el("h1", "page-title", "メンバーが見つかりません"),
      el("p", "empty-copy", "リンク先のメンバーは、この一覧にありません。"),
      back
    );
    mount(main);
  }

  function renderDetail() {
    var params = new URLSearchParams(window.location.search);
    var member = findMember(params.get("id"));
    if (!member) {
      renderMissing();
      return;
    }

    document.title = member.name + " | 無人島 Connect";
    var main = el("main", "site-main");
    main.id = "main";
    var back = el("a", "back-link", "メンバー一覧へ");
    back.href = "index.html";

    var head = el("div", "profile-head");
    var titles = el("div");
    titles.append(el("h1", "profile-name", member.name), el("p", "role", member.role));
    head.append(monogram(member.name), titles);

    var story = el("div", "story");
    take(member.story, 4).forEach(function (paragraph) {
      story.append(el("p", null, paragraph));
    });

    main.append(back, head, story, el("h2", "section-title", "5つの評価"), radarBlock(member, true));

    var fit = pair(
      bulletPanel("合っているところ", take(member.fit, 3)),
      bulletPanel("これから厚くするところ", take(member.growing, 3))
    );
    var help = pair(
      bulletPanel("仲間が応援できること", take(member.support, 2)),
      bulletPanel("この人が出せること", take(member.offer, 2))
    );
    if (fit) main.append(el("h2", "section-title", "無人島との接点"), fit);
    if (help) main.append(el("h2", "section-title", "仲間との関わり"), help);
    var hearing = hearingBlock(member);
    if (hearing) main.append(hearing);
    mount(main);
  }

  function hearingBlock(member) {
    var groups = member.hearing || [];
    if (!groups.length) return null;
    var details = el("details", "hearing");
    var summary = el("summary", "hearing-summary", "ヒアリングの詳細");
    var body = el("div", "hearing-body");
    body.append(el("p", "score-note", "15問への答えです。質問を選んだ理由のメモは載せていません。"));
    groups.forEach(function (group) {
      var block = el("section", "hearing-group");
      block.append(el("h2", "section-title", group.group));
      (group.items || []).forEach(function (item) {
        var article = el("article", "hearing-item");
        article.append(el("h3", null, item.q));
        (item.a || []).forEach(function (paragraph) {
          article.append(el("p", null, paragraph));
        });
        block.append(article);
      });
      body.append(block);
    });
    details.append(summary, body);
    return details;
  }

  if (page === "detail") renderDetail();
  else renderList();
})();
