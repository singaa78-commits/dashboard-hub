const dashboards = [
  {
    id: "meta-ads-overview",
    name: "메타광고 종합 대시보드 & GA4 UTM 분석",
    badge: "META + GA4",
    description: "대시보드 열기",
    fallbackStatus: "운영중",
    fallbackUpdateLabel: "최신 데이터 확인중",
    fallbackUpdateSource: "기준 확인중",
    url: "https://singaa78-commits.github.io/growth_dashboard/meta_ads_dashboard.html",
    tone: "lilac",
  },
  {
    id: "instagram-insights",
    name: "인스타 인사이트",
    badge: "INSTAGRAM",
    description: "대시보드 열기",
    fallbackStatus: "운영중",
    fallbackUpdateLabel: "최신 데이터 확인중",
    fallbackUpdateSource: "기준 확인중",
    url: "https://singaa78-commits.github.io/growth_dashboard/instagram_dashboard.html",
    tone: "cream",
  },
  {
    id: "ga4-funnel",
    name: "GA4 퍼널 공식몰 전환율",
    badge: "GA4 FUNNEL",
    description: "대시보드 열기",
    fallbackStatus: "운영중",
    fallbackUpdateLabel: "최신 데이터 확인중",
    fallbackUpdateSource: "기준 확인중",
    url: "https://ga4-funnel-scroll-analyzer-172828319508.us-west1.run.app/",
    tone: "lime",
  },
  {
    id: "meta-ads-creative",
    name: "메타광고 소재별 성과 대시보드",
    badge: "CREATIVE ADS",
    description: "대시보드 열기",
    fallbackStatus: "운영중",
    fallbackUpdateLabel: "최신 데이터 확인중",
    fallbackUpdateSource: "기준 확인중",
    url: "https://meta-ads-creative-dashboard-172828319508.us-west1.run.app/",
    tone: "mint",
  },
  {
    id: "cafe24-dashboard",
    name: "카페24 대시보드",
    badge: "CAFE24",
    description: "로그인 페이지 열기",
    fallbackStatus: "로그인 필요",
    fallbackUpdateLabel: "접속 시 실시간 반영",
    fallbackUpdateSource: "실시간 데이터",
    url: "https://cafe24-growth-dashboard.onrender.com/auth/login",
    tone: "coral",
  },
  {
    id: "marketing-message-dashboard",
    name: "마케팅 메시지 성과 대시보드",
    badge: "MESSAGE ADS",
    description: "대시보드 열기",
    fallbackStatus: "접근 제한",
    fallbackUpdateLabel: "최신 데이터는 접근 후 확인",
    fallbackUpdateSource: "Vercel 보호",
    url: "https://meta-ads-daily-git-main-singaa78-commits-projects.vercel.app/dashboard.html",
    tone: "navy",
  },
];

const dashboardList = document.querySelector("#dashboard-list");
const cardTemplate = document.querySelector("#card-template");
const now = new Date();
const todayLabel = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
}).format(now);

function getStatusClass(status) {
  if (
    status.includes("로그인") ||
    status.includes("제한") ||
    status.includes("권한")
  ) {
    return "restricted";
  }

  if (status.includes("운영")) {
    return "active";
  }

  return "neutral";
}

function createMetadataUrl() {
  const url = new URL("./dashboard-metadata.json", window.location.href);
  url.searchParams.set("ts", String(Date.now()));
  return url.toString();
}

async function loadDashboardMetadata() {
  try {
    const response = await fetch(createMetadataUrl(), { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`metadata fetch failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn("Failed to load dashboard metadata.", error);
    return { dashboards: {} };
  }
}

function getDashboardMetadata(metadataMap, dashboard) {
  const liveMetadata = metadataMap[dashboard.id] || {};
  const status = liveMetadata.status || dashboard.fallbackStatus;
  const updateSource = liveMetadata.updateSource || dashboard.fallbackUpdateSource;
  const latestLabel = liveMetadata.latestLabel || dashboard.fallbackUpdateLabel;

  return {
    status,
    updateSource,
    latestLabel,
    statusClass: getStatusClass(status),
  };
}

function renderDashboardCards(metadataMap) {
  dashboardList.textContent = "";

  dashboards.forEach((dashboard) => {
    const cardFragment = cardTemplate.content.cloneNode(true);
    const card = cardFragment.querySelector(".dashboard-card");
    const date = cardFragment.querySelector(".dashboard-date");
    const status = cardFragment.querySelector(".dashboard-status");
    const badge = cardFragment.querySelector(".dashboard-badge");
    const title = cardFragment.querySelector(".dashboard-title");
    const stateChip = cardFragment.querySelector(".dashboard-state-chip");
    const updatedChip = cardFragment.querySelector(".dashboard-updated-chip");
    const updatedLabel = cardFragment.querySelector(".dashboard-updated-label");
    const link = cardFragment.querySelector(".dashboard-link");
    const resolvedMetadata = getDashboardMetadata(metadataMap, dashboard);

    card.dataset.tone = dashboard.tone;
    card.dataset.status = resolvedMetadata.statusClass;

    date.textContent = todayLabel;
    status.textContent = resolvedMetadata.status;
    badge.textContent = dashboard.badge;
    title.textContent = dashboard.name;
    stateChip.textContent = resolvedMetadata.status;
    updatedChip.textContent = resolvedMetadata.updateSource;
    updatedLabel.textContent = resolvedMetadata.latestLabel;
    link.href = dashboard.url;
    link.textContent = dashboard.description;

    dashboardList.appendChild(cardFragment);
  });
}

async function initDashboardHub() {
  const metadata = await loadDashboardMetadata();
  renderDashboardCards(metadata.dashboards || {});
}

initDashboardHub();
