const dashboards = [
  {
    name: "메타광고 종합 대시보드 & GA4 UTM 분석",
    description: "메타 광고 성과와 GA4 UTM 흐름을 함께 보는 종합 분석 화면",
    url: "https://singaa78-commits.github.io/growth_dashboard/meta_ads_dashboard.html",
    platform: "GitHub Pages",
    host: "GitHub Actions",
    type: "Meta + GA4",
  },
  {
    name: "인스타 인사이트",
    description: "인스타그램 인사이트 성과를 빠르게 확인하는 전용 대시보드",
    url: "https://singaa78-commits.github.io/growth_dashboard/instagram_dashboard.html",
    platform: "GitHub Pages",
    host: "GitHub Actions",
    type: "Instagram",
  },
  {
    name: "GA4 퍼널 공식몰 전환율",
    description: "공식몰 퍼널 단계별 전환율을 보는 Cloud Run 대시보드",
    url: "https://ga4-funnel-scroll-analyzer-172828319508.us-west1.run.app/",
    platform: "Google Cloud Run",
    host: "Google Cloud",
    type: "GA4 Funnel",
  },
  {
    name: "메타광고 소재별 성과 대시보드",
    description: "소재 단위 메타 광고 성과를 비교하는 Cloud Run 대시보드",
    url: "https://meta-ads-creative-dashboard-172828319508.us-west1.run.app/",
    platform: "Google Cloud Run",
    host: "Google Cloud",
    type: "Creative Ads",
  },
  {
    name: "카페24 대시보드",
    description: "Render에서 운영 중인 카페24 전용 대시보드 로그인 진입점",
    url: "https://cafe24-growth-dashboard.onrender.com/auth/login",
    platform: "Render",
    host: "Render",
    type: "Cafe24",
  },
];

const platformNotes = {
  "GitHub Pages": "GitHub Actions로 배포되는 정적 대시보드",
  "Google Cloud Run": "Google Cloud에서 서비스되는 앱 대시보드",
  Render: "Render에서 운영되는 로그인 기반 대시보드",
};

const groupsContainer = document.querySelector("#platform-groups");
const platformTemplate = document.querySelector("#platform-template");
const cardTemplate = document.querySelector("#card-template");
const dashboardCount = document.querySelector("#dashboard-count");

dashboardCount.textContent = String(dashboards.length);

const groupedDashboards = dashboards.reduce((accumulator, dashboard) => {
  const key = dashboard.platform;
  if (!accumulator[key]) {
    accumulator[key] = [];
  }
  accumulator[key].push(dashboard);
  return accumulator;
}, {});

Object.entries(groupedDashboards).forEach(([platform, items]) => {
  const sectionFragment = platformTemplate.content.cloneNode(true);
  const section = sectionFragment.querySelector(".platform-section");
  const platformName = sectionFragment.querySelector(".platform-name");
  const platformTitle = sectionFragment.querySelector(".platform-title");
  const platformCount = sectionFragment.querySelector(".platform-count");
  const dashboardGrid = sectionFragment.querySelector(".dashboard-grid");

  platformName.textContent = platform;
  platformTitle.textContent = platformNotes[platform];
  platformCount.textContent = `${items.length} dashboards`;

  items.forEach((dashboard) => {
    const cardFragment = cardTemplate.content.cloneNode(true);
    const type = cardFragment.querySelector(".dashboard-type");
    const title = cardFragment.querySelector(".dashboard-title");
    const description = cardFragment.querySelector(".dashboard-description");
    const link = cardFragment.querySelector(".dashboard-link");
    const host = cardFragment.querySelector(".dashboard-host");

    type.textContent = dashboard.type;
    title.textContent = dashboard.name;
    description.textContent = dashboard.description;
    link.href = dashboard.url;
    link.textContent = "Open dashboard";
    host.textContent = dashboard.host;

    dashboardGrid.appendChild(cardFragment);
  });

  groupsContainer.appendChild(section);
  section.dataset.platform = platform;
});
