import { writeFile } from "node:fs/promises";

const OUTPUT_PATH = new URL("../dashboard-metadata.json", import.meta.url);

const META_ADS_URL =
  "https://singaa78-commits.github.io/growth_dashboard/meta_ads_dashboard.html";
const INSTAGRAM_URL =
  "https://singaa78-commits.github.io/growth_dashboard/instagram_dashboard.html";
const GA4_FUNNEL_URL =
  "https://ga4-funnel-scroll-analyzer-172828319508.us-west1.run.app/";
const META_CREATIVE_URL =
  "https://meta-ads-creative-dashboard-172828319508.us-west1.run.app/";

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "dashboard-hub-metadata-bot/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }

  return {
    headers: response.headers,
    text: await response.text(),
  };
}

function compactDateToIso(value) {
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function formatDateLabel(isoDate) {
  if (!isoDate) {
    return "최신 데이터 없음";
  }

  return `최신 데이터 ${isoDate.replaceAll("-", ".")}`;
}

function parseIsoDate(value) {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  if (/^\d{8}$/.test(normalized)) {
    return compactDateToIso(normalized);
  }

  const slashMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const dotMatch = normalized.match(/^(\d{4})[./](\d{1,2})[./](\d{1,2})$/);
  if (dotMatch) {
    const [, year, month, day] = dotMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const dateLiteralMatch = normalized.match(/^Date\((\d+),(\d+),(\d+)\)$/);
  if (dateLiteralMatch) {
    const [, year, monthIndex, day] = dateLiteralMatch;
    return `${year}-${String(Number(monthIndex) + 1).padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return null;
}

function getLatestIsoDate(values) {
  return values
    .map(parseIsoDate)
    .filter(Boolean)
    .sort()
    .at(-1);
}

async function resolveMetaAdsOverview() {
  const { text } = await fetchText(META_ADS_URL);
  const latestDate = getLatestIsoDate(text.match(/20\d{6}/g) || []);

  return {
    latestDate,
    latestLabel: formatDateLabel(latestDate),
    status: "운영중",
    updateSource: "실데이터 기준",
  };
}

async function resolveInstagramInsights() {
  const { text } = await fetchText(INSTAGRAM_URL);
  const sheetId = text.match(/SHEET_ID\s*=\s*"([^"]+)"/)?.[1];
  const apiKey = text.match(/API_KEY\s*=\s*"([^"]+)"/)?.[1];
  const tabGid = Number(text.match(/TAB_GID\s*=\s*(\d+)/)?.[1]);

  if (!sheetId || !apiKey || Number.isNaN(tabGid)) {
    throw new Error("Instagram dashboard sheet configuration was not found.");
  }

  const spreadsheetMeta = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}`,
  ).then((response) => response.json());

  const matchedSheet = spreadsheetMeta.sheets?.find(
    (sheet) => sheet.properties?.sheetId === tabGid,
  );

  if (!matchedSheet?.properties?.title) {
    throw new Error("Instagram dashboard sheet tab could not be resolved.");
  }

  const range = encodeURIComponent(`'${matchedSheet.properties.title}'!A:M`);
  const dataUrl =
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchGet` +
    `?ranges=${range}&key=${apiKey}`;
  const dataPayload = await fetch(dataUrl).then((response) => response.json());
  const values = dataPayload.valueRanges?.[0]?.values || [];
  const header = values[0] || [];
  const dateColumnIndex = header.indexOf("데이터날짜");

  if (dateColumnIndex === -1) {
    throw new Error("Instagram dashboard date column was not found.");
  }

  const latestDate = getLatestIsoDate(
    values.slice(1).map((row) => row[dateColumnIndex]),
  );

  return {
    latestDate,
    latestLabel: formatDateLabel(latestDate),
    status: "운영중",
    updateSource: "실데이터 기준",
  };
}

function extractBundleUrl(baseUrl, html) {
  const bundlePath = html.match(/src="([^"]*index-[^"]+\.js)"/)?.[1];

  if (!bundlePath) {
    throw new Error(`Bundle path was not found for ${baseUrl}.`);
  }

  return new URL(bundlePath, baseUrl).toString();
}

async function resolveGa4Funnel() {
  const { text: html } = await fetchText(GA4_FUNNEL_URL);
  const bundleUrl = extractBundleUrl(GA4_FUNNEL_URL, html);
  const { text: bundle } = await fetchText(bundleUrl);
  const csvUrls = [
    ...bundle.matchAll(
      /https:\/\/docs\.google\.com\/spreadsheets\/d\/[^"]+sheet=(?:Product_Analysis|Scroll_Analysis)/g,
    ),
  ].map(([match]) => match);

  const discoveredDates = [];

  for (const csvUrl of csvUrls) {
    const { text: csvText } = await fetchText(csvUrl);
    discoveredDates.push(...(csvText.match(/20\d{2}-\d{2}-\d{2}/g) || []));
  }

  const latestDate = getLatestIsoDate(discoveredDates);

  return {
    latestDate,
    latestLabel: formatDateLabel(latestDate),
    status: "운영중",
    updateSource: "실데이터 기준",
  };
}

function extractGoogleVisualizationRows(payloadText) {
  const jsonText = payloadText.slice(
    payloadText.indexOf("{"),
    payloadText.lastIndexOf("}") + 1,
  );

  return JSON.parse(jsonText).table.rows || [];
}

async function resolveMetaCreative() {
  const { text: html } = await fetchText(META_CREATIVE_URL);
  const bundleUrl = extractBundleUrl(META_CREATIVE_URL, html);
  const { text: bundle } = await fetchText(bundleUrl);
  const spreadsheetId =
    bundle.match(/spreadsheets\/d\/([A-Za-z0-9-_]+)\/gviz\/tq/)?.[1];
  const sheetNames = [
    ...new Set(
      [...bundle.matchAll(/DD\("([^"]+)"\)/g)].map(([, sheetName]) => sheetName),
    ),
  ];

  if (!spreadsheetId || sheetNames.length === 0) {
    throw new Error("Meta creative sheet configuration was not found.");
  }

  const discoveredDates = [];

  for (const sheetName of sheetNames) {
    const sheetUrl =
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq` +
      `?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    const { text } = await fetchText(sheetUrl);
    const rows = extractGoogleVisualizationRows(text);

    for (const row of rows) {
      for (const cell of row.c || []) {
        if (cell?.v) {
          discoveredDates.push(String(cell.v));
        }
      }
    }
  }

  const latestDate = getLatestIsoDate(discoveredDates);

  return {
    latestDate,
    latestLabel: formatDateLabel(latestDate),
    status: "운영중",
    updateSource: "실데이터 기준",
  };
}

function resolveCafe24Dashboard() {
  return {
    latestDate: null,
    latestLabel: "접속 시 실시간 반영",
    status: "로그인 필요",
    updateSource: "실시간 데이터",
  };
}

function resolveMarketingMessageDashboard() {
  return {
    latestDate: null,
    latestLabel: "최신 데이터는 접근 후 확인",
    status: "프로모션 일정",
    updateSource: "상시 업데이트",
  };
}

async function generateDashboardMetadata() {
  const dashboards = {
    "meta-ads-overview": await resolveMetaAdsOverview(),
    "instagram-insights": await resolveInstagramInsights(),
    "ga4-funnel": await resolveGa4Funnel(),
    "meta-ads-creative": await resolveMetaCreative(),
    "cafe24-dashboard": resolveCafe24Dashboard(),
    "marketing-message-dashboard": resolveMarketingMessageDashboard(),
  };

  const payload = {
    generatedAt: new Date().toISOString(),
    dashboards,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Generated ${OUTPUT_PATH.pathname}`);
}

generateDashboardMetadata().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
