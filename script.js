const elements = {
  statsGrid: document.getElementById("stats-grid"),
  branchButtons: document.getElementById("branch-buttons"),
  branchFilter: document.getElementById("branch-filter"),
  typeFilter: document.getElementById("type-filter"),
  sortFilter: document.getElementById("sort-filter"),
  searchInput: document.getElementById("search-input"),
  responseFilterGroups: document.getElementById("response-filter-groups"),
  activeFilters: document.getElementById("active-filters"),
  reviewGrid: document.getElementById("review-grid"),
  resultSummary: document.getElementById("result-summary"),
  cardTemplate: document.getElementById("review-card-template"),
  modal: document.getElementById("review-modal"),
  modalBody: document.getElementById("modal-body"),
  modalClose: document.getElementById("modal-close"),
};

const state = {
  reviews: [],
  filters: {
    branch: "all",
    type: "all",
    sort: "satisfaction",
    search: "",
    responses: {
      coachingTitle: "all",
      learningTitle: "all",
      lifeTitle: "all",
      contentTitle: "all",
    },
  },
};

const formatNumber = (value) => new Intl.NumberFormat("ko-KR").format(value);
const formatPercent = (value) => `${value.toFixed(1)}%`;

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const normalizeLabel = (value) => {
  if (value === "면학 분위기 감독 졸음 관리") return "면학 분위기 감독";
  return value;
};

const responseCategories = [
  { key: "coachingTitle", label: "코칭시스템" },
  { key: "learningTitle", label: "학습관리시스템" },
  { key: "lifeTitle", label: "생활관리시스템" },
  { key: "contentTitle", label: "콘텐츠" },
];

const maskName = (name) => {
  if (!name) return "익명";
  if (name.length === 1) return `${name}*`;
  if (name.length === 2) return `${name[0]}*`;
  return `${name[0]}${"*".repeat(name.length - 2)}${name[name.length - 1]}`;
};

const truncate = (text, length = 110) => {
  if (!text) return "상세 후기가 비어 있습니다.";
  return text.length > length ? `${text.slice(0, length).trim()}...` : text;
};

const average = (items) => {
  if (!items.length) return 0;
  return Math.round((items.reduce((sum, item) => sum + item.satisfaction, 0) / items.length) * 10) / 10;
};

const palette = ["#4c78f2", "#7aa4ff", "#b7ccff", "#8fafff", "#dbe6ff"];

const getCategoryBreakdown = (reviews, key) => {
  const counts = reviews.reduce((acc, review) => {
    const label = review[key] || "미응답";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const total = reviews.length || 1;
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      label: normalizeLabel(label),
      count,
      percent: (count / total) * 100,
    }));

  const visible = sorted.slice(0, 4).map((item, index) => ({
    ...item,
    color: palette[index],
  }));

  const remainder = sorted.slice(4).reduce((sum, item) => sum + item.count, 0);
  if (remainder > 0) {
    visible.push({
      label: "기타",
      count: remainder,
      percent: (remainder / total) * 100,
      color: palette[4],
    });
  }

  const top = sorted[0] || { label: "-", count: 0, percent: 0 };
  return { top, segments: visible };
};

const getResponseOptions = (reviews, key) =>
  [...new Set(reviews.map((review) => normalizeLabel(review[key] || "미응답")))].sort((a, b) => a.localeCompare(b, "ko"));

const getDonutGradient = (segments) => {
  let current = 0;
  const stops = segments.map((segment) => {
    const start = current;
    current += segment.percent * 3.6;
    return `${segment.color} ${start.toFixed(1)}deg ${current.toFixed(1)}deg`;
  });

  if (current < 360) {
    stops.push(`rgba(120, 94, 75, 0.12) ${current.toFixed(1)}deg 360deg`);
  }

  return `conic-gradient(${stops.join(", ")})`;
};

const buildStats = (reviews) => {
  const branches = new Set(reviews.map((review) => review.branch));
  const summaryStats = [
    {
      label: "전체 후기 수",
      value: `${formatNumber(reviews.length)}개`,
      subcopy: "2026년 졸업생 후기 기준",
    },
    {
      label: "참여 지점 수",
      value: `${formatNumber(branches.size)}개`,
      subcopy: "전국 지점 데이터 반영",
    },
    {
      label: "평균 만족도",
      value: `${average(reviews)}점`,
      subcopy: "전체 후기 평균 점수",
    },
  ];

  const categoryCards = [
    { label: "코칭시스템 최다 선택", key: "coachingTitle" },
    { label: "학습관리 최다 선택", key: "learningTitle" },
    { label: "생활관리 최다 선택", key: "lifeTitle" },
    { label: "콘텐츠 최다 선택", key: "contentTitle" },
  ].map((category) => {
    const breakdown = getCategoryBreakdown(reviews, category.key);
    const donut = getDonutGradient(breakdown.segments);
    const rows = breakdown.segments
      .map(
        (segment) => `
          <li class="stats-tooltip-item">
            <span class="stats-tooltip-item-label">
              <i class="stats-dot" style="background:${segment.color}"></i>
              ${escapeHtml(segment.label)}
            </span>
            <strong>${formatPercent(segment.percent)}</strong>
          </li>
        `
      )
      .join("");

    return `
      <article class="stats-card stats-card--interactive">
        <span class="stats-label">${category.label}</span>
        <strong class="stats-value stats-value--compact">${escapeHtml(breakdown.top.label)}</strong>
        <div class="stats-subcopy">${formatPercent(breakdown.top.percent)} · ${formatNumber(breakdown.top.count)}명 선택</div>
        <div class="stats-tooltip">
          <div class="stats-tooltip-chart" style="--chart:${donut}">
            <div class="stats-tooltip-chart-hole">${formatPercent(breakdown.top.percent)}</div>
          </div>
          <div class="stats-tooltip-copy">
            <p class="stats-tooltip-title">${category.label} 분포</p>
            <ul class="stats-tooltip-list">${rows}</ul>
          </div>
        </div>
      </article>
    `;
  });

  const summaryMarkup = summaryStats
    .map(
      (item) => `
        <article class="stats-card">
          <span class="stats-label">${item.label}</span>
          <strong class="stats-value">${item.value}</strong>
          <div class="stats-subcopy">${item.subcopy}</div>
        </article>
      `
    )
    .join("");

  elements.statsGrid.innerHTML = `
    <div class="stats-row stats-row--summary">
      ${summaryMarkup}
    </div>
    <div class="stats-row stats-row--categories">
      ${categoryCards.join("")}
    </div>
  `;
};

const populateFilters = (reviews) => {
  const branches = [...new Set(reviews.map((review) => review.branch))].sort((a, b) => a.localeCompare(b, "ko"));
  const types = [...new Set(reviews.map((review) => review.studentType))].sort((a, b) => a.localeCompare(b, "ko"));

  elements.branchFilter.innerHTML = `<option value="all">전체 지점</option>${branches
    .map((branch) => `<option value="${branch}">${branch}</option>`)
    .join("")}`;

  elements.typeFilter.innerHTML = `<option value="all">전체 유형</option>${types
    .map((type) => `<option value="${type}">${type}</option>`)
    .join("")}`;

  const counts = branches.map((branch) => ({
    branch,
    count: reviews.filter((review) => review.branch === branch).length,
  }));

  elements.branchButtons.innerHTML = counts
    .map(
      ({ branch, count }) => `
        <button class="branch-button" type="button" data-branch="${branch}">
          <strong>${branch}</strong>
          <span class="branch-count">${count}명</span>
        </button>
      `
    )
    .join("");

  elements.responseFilterGroups.innerHTML = responseCategories
    .map(({ key, label }) => {
      const options = getResponseOptions(reviews, key);
      const buttons = ["all", ...options]
        .map((option) => {
          const isAll = option === "all";
          const text = isAll ? "전체" : option;
          const isActive = state.filters.responses[key] === option;
          return `
            <button
              class="response-chip${isActive ? " is-active" : ""}"
              type="button"
              data-response-key="${key}"
              data-response-value="${escapeHtml(option)}"
            >
              ${escapeHtml(text)}
            </button>
          `;
        })
        .join("");

      return `
        <article class="response-filter-group">
          <h4>${label}</h4>
          <div class="response-chip-row">${buttons}</div>
        </article>
      `;
    })
    .join("");
};

const syncActiveFilters = () => {
  const chips = [];

  if (state.filters.branch !== "all") chips.push(`지점: ${state.filters.branch}`);
  if (state.filters.type !== "all") chips.push(`유형: ${state.filters.type}`);
  responseCategories.forEach(({ key, label }) => {
    if (state.filters.responses[key] !== "all") {
      chips.push(`${label}: ${state.filters.responses[key]}`);
    }
  });
  if (state.filters.search) chips.push(`검색: ${state.filters.search}`);
  if (state.filters.sort === "branch") chips.push("정렬: 지점 가나다순");
  if (state.filters.sort === "latest") chips.push("정렬: 데이터 순서");
  if (state.filters.sort === "satisfaction") chips.push("정렬: 만족도 높은 순");

  elements.activeFilters.innerHTML = chips.map((chip) => `<span class="filter-chip">${chip}</span>`).join("");
};

const filteredReviews = () => {
  let result = [...state.reviews];

  if (state.filters.branch !== "all") {
    result = result.filter((review) => review.branch === state.filters.branch);
  }

  if (state.filters.type !== "all") {
    result = result.filter((review) => review.studentType === state.filters.type);
  }

  responseCategories.forEach(({ key }) => {
    if (state.filters.responses[key] !== "all") {
      result = result.filter((review) => normalizeLabel(review[key] || "미응답") === state.filters.responses[key]);
    }
  });

  if (state.filters.search) {
    const keyword = state.filters.search.toLowerCase();
    result = result.filter((review) =>
      [
        review.name,
        review.branch,
        review.studentType,
        review.coachingTitle,
        review.coachingReview,
        review.learningTitle,
        review.learningReview,
        review.lifeTitle,
        review.lifeReview,
        review.contentTitle,
        review.contentReview,
        review.thanks,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }

  if (state.filters.sort === "satisfaction") {
    result.sort((a, b) => b.satisfaction - a.satisfaction || a.id - b.id);
  } else if (state.filters.sort === "branch") {
    result.sort((a, b) => a.branch.localeCompare(b.branch, "ko") || b.satisfaction - a.satisfaction);
  } else {
    result.sort((a, b) => a.id - b.id);
  }

  return result;
};

const openModal = (review) => {
  elements.modalBody.innerHTML = `
    <div class="modal-head">
      <div>
        <span class="branch-badge">${review.branch}</span>
        <h3 class="modal-name">${maskName(review.name)} · ${review.studentType}</h3>
      </div>
      <div class="modal-score">
        <span>만족도</span>
        <strong>${review.satisfaction}</strong>
      </div>
    </div>
    <div class="modal-grid">
      <article class="modal-panel">
        <h4>코칭 시스템 · ${review.coachingTitle}</h4>
        <p>${review.coachingReview || "작성된 내용이 없습니다."}</p>
      </article>
      <article class="modal-panel">
        <h4>학습 관리 · ${review.learningTitle}</h4>
        <p>${review.learningReview || "작성된 내용이 없습니다."}</p>
      </article>
      <article class="modal-panel">
        <h4>생활 관리 · ${review.lifeTitle}</h4>
        <p>${review.lifeReview || "작성된 내용이 없습니다."}</p>
      </article>
      <article class="modal-panel">
        <h4>콘텐츠 · ${review.contentTitle}</h4>
        <p>${review.contentReview || "작성된 내용이 없습니다."}</p>
      </article>
      <article class="modal-panel full">
        <h4>감사 인사</h4>
        <p>${review.thanks || "작성된 내용이 없습니다."}</p>
      </article>
    </div>
  `;

  elements.modal.showModal();
};

const renderReviews = () => {
  const reviews = filteredReviews();
  syncActiveFilters();

  elements.resultSummary.textContent = `${formatNumber(reviews.length)}개의 후기가 현재 조건에 맞게 표시되고 있습니다.`;

  if (!reviews.length) {
    elements.reviewGrid.innerHTML = `
      <div class="empty-state">
        현재 조건에 맞는 후기가 없습니다. 검색어를 줄이거나 필터를 초기화해보세요.
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  reviews.forEach((review) => {
    const clone = elements.cardTemplate.content.cloneNode(true);
    clone.querySelector(".branch-badge").textContent = review.branch;
    clone.querySelector(".type-badge").textContent = review.studentType;
    clone.querySelector(".reviewer-name").textContent = maskName(review.name);
    clone.querySelector(".satisfaction-text").textContent = `${review.graduationYear} 졸업생 · 만족도 ${review.satisfaction}점`;
    clone.querySelector(".score-value").textContent = review.satisfaction;
    clone.querySelector(".highlight-title").textContent = review.coachingTitle || "코칭 후기";
    clone.querySelector(".highlight-copy").textContent = truncate(review.coachingReview);
    clone.querySelector(".learning-title").textContent = review.learningTitle || "-";
    clone.querySelector(".life-title").textContent = review.lifeTitle || "-";
    clone.querySelector(".content-title").textContent = review.contentTitle || "-";
    clone.querySelector(".detail-button").addEventListener("click", () => openModal(review));
    fragment.appendChild(clone);
  });

  elements.reviewGrid.innerHTML = "";
  elements.reviewGrid.appendChild(fragment);
};

const attachEvents = () => {
  elements.branchFilter.addEventListener("change", (event) => {
    state.filters.branch = event.target.value;
    renderReviews();
  });

  elements.typeFilter.addEventListener("change", (event) => {
    state.filters.type = event.target.value;
    renderReviews();
  });

  elements.sortFilter.addEventListener("change", (event) => {
    state.filters.sort = event.target.value;
    renderReviews();
  });

  elements.searchInput.addEventListener("input", (event) => {
    state.filters.search = event.target.value.trim();
    renderReviews();
  });

  elements.branchButtons.addEventListener("click", (event) => {
    const button = event.target.closest("[data-branch]");
    if (!button) return;
    state.filters.branch = button.dataset.branch;
    elements.branchFilter.value = button.dataset.branch;
    document.getElementById("review-browser").scrollIntoView({ behavior: "smooth", block: "start" });
    renderReviews();
  });

  elements.responseFilterGroups.addEventListener("click", (event) => {
    const button = event.target.closest("[data-response-key]");
    if (!button) return;
    const { responseKey, responseValue } = button.dataset;
    state.filters.responses[responseKey] = responseValue;
    populateFilters(state.reviews);
    renderReviews();
  });

  elements.modalClose.addEventListener("click", () => elements.modal.close());
  elements.modal.addEventListener("click", (event) => {
    const rect = elements.modal.getBoundingClientRect();
    const isOutside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;

    if (isOutside) elements.modal.close();
  });
};

const init = async () => {
  try {
    const reviews = Array.isArray(window.__REVIEWS__) ? window.__REVIEWS__ : [];
    if (!reviews.length) throw new Error("후기 데이터가 비어 있습니다.");
    state.reviews = reviews;
    buildStats(reviews);
    populateFilters(reviews);
    attachEvents();
    renderReviews();
  } catch (error) {
    console.error(error);
    elements.resultSummary.textContent = "데이터를 불러오지 못했습니다.";
    elements.reviewGrid.innerHTML = `
      <div class="empty-state">
        후기 데이터를 불러오는 중 문제가 발생했습니다. 파일 경로를 확인해주세요.
      </div>
    `;
  }
};

init();
