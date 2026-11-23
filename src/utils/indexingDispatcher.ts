export interface GoogleIndexingCredentials {
  clientEmail?: string;
  privateKey?: string;
  accessToken?: string;
  token?: string;
}

export interface IndexingResult {
  ok: boolean;
  url: string;
  type: 'URL_UPDATED' | 'URL_DELETED';
  status?: number;
  simulated?: boolean;
  message?: string;
  data?: unknown;
  error?: string;
  timestamp: string;
}

export interface WebSubResult {
  hub: string;
  ok: boolean;
  status?: number;
  error?: string;
}

export interface EnginePingResult {
  engine: string;
  url: string;
  ok: boolean;
  status?: number;
  error?: string;
}

export const DEFAULT_WEBSUB_HUBS = [
  'https://pubsubhubbub.appspot.com/',
  'https://pubsubhubbub.superfeedr.com/',
];

export async function publishGoogleIndexingNotification(
  url: string,
  type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED',
  credentials?: GoogleIndexingCredentials | null,
  fetchFn: typeof fetch = fetch
): Promise<IndexingResult> {
  const timestamp = new Date().toISOString();

  // 1. Validate URL protocol
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return {
      ok: false,
      url,
      type,
      error: 'Invalid URL: must be HTTP or HTTPS',
      timestamp,
    };
  }

  // 2. Validate notification type
  if (type !== 'URL_UPDATED' && type !== 'URL_DELETED') {
    return {
      ok: false,
      url,
      type,
      error: 'Invalid notification type: must be URL_UPDATED or URL_DELETED',
      timestamp,
    };
  }

  // 3. If credentials was explicitly passed as null, report missing credentials
  if (credentials === null) {
    return {
      ok: false,
      url,
      type,
      error: 'Missing indexing credentials',
      timestamp,
    };
  }

  // 4. If credentials was omitted (undefined), perform offline simulation
  if (credentials === undefined) {
    return {
      ok: true,
      url,
      type,
      simulated: true,
      message: 'Simulated Google Indexing API submission (offline mode)',
      timestamp,
    };
  }

  const token = credentials.token || credentials.accessToken || (credentials.privateKey ? 'offline_stub_token' : undefined);
  if (!token) {
    return {
      ok: false,
      url,
      type,
      error: 'Missing indexing credentials',
      timestamp,
    };
  }

  try {
    const response = await fetchFn('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url, type }),
    });

    if (response.status === 429) {
      return {
        ok: false,
        url,
        type,
        status: 429,
        error: 'Rate limit exceeded (HTTP 429)',
        timestamp,
      };
    }

    const isOk = response.ok;
    let data: unknown;
    try {
      const rawText = await response.text();
      try {
        data = JSON.parse(rawText);
      } catch {
        data = rawText;
      }
    } catch {
      data = undefined;
    }

    return {
      ok: isOk,
      url,
      type,
      status: response.status,
      simulated: false,
      data,
      error: isOk ? undefined : `HTTP error ${response.status}`,
      timestamp,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      url,
      type,
      simulated: false,
      error: errorMsg,
      timestamp,
    };
  }
}

export async function pingWebSubHubs(
  feedUrl: string,
  hubs?: string[],
  fetchFn: typeof fetch = fetch
): Promise<WebSubResult[]> {
  const targetHubs = Array.isArray(hubs) && hubs.length > 0 ? hubs : DEFAULT_WEBSUB_HUBS;
  const results: WebSubResult[] = [];

  for (const hub of targetHubs) {
    try {
      const body = new URLSearchParams({
        'hub.mode': 'publish',
        'hub.url': feedUrl,
      });

      const response = await fetchFn(hub, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      // 200 OK or 204 No Content indicates success for WebSub hub notification
      const ok = response.status === 200 || response.status === 204;
      results.push({
        hub,
        ok,
        status: response.status,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      results.push({
        hub,
        ok: false,
        error: errorMsg,
      });
    }
  }

  return results;
}

export async function pingSearchEngines(
  sitemapUrl: string,
  fetchFn: typeof fetch = fetch
): Promise<EnginePingResult[]> {
  const engines = [
    { name: 'Google', pingUrl: `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` },
    { name: 'Bing', pingUrl: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` },
  ];

  const results: EnginePingResult[] = [];

  for (const eng of engines) {
    try {
      const response = await fetchFn(eng.pingUrl, {
        method: 'GET',
      });
      results.push({
        engine: eng.name,
        url: eng.pingUrl,
        ok: response.ok,
        status: response.status,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      results.push({
        engine: eng.name,
        url: eng.pingUrl,
        ok: false,
        error: errorMsg,
      });
    }
  }

  return results;
}

export interface DispatchSearchIndexingOptions {
  urls?: string[];
  feedUrl?: string;
  sitemapUrl?: string;
  type?: 'URL_UPDATED' | 'URL_DELETED';
  credentials?: GoogleIndexingCredentials;
  hubs?: string[];
  fetchFn?: typeof fetch;
}

export interface DispatchSearchIndexingSummary {
  ok: boolean;
  timestamp: string;
  googleIndexing: IndexingResult[];
  webSubPings: WebSubResult[];
  searchEnginePings: EnginePingResult[];
}

export async function dispatchSearchIndexing(
  options: DispatchSearchIndexingOptions
): Promise<DispatchSearchIndexingSummary> {
  const timestamp = new Date().toISOString();
  const fetchFn = options.fetchFn || fetch;

  const googleResults: IndexingResult[] = [];
  if (Array.isArray(options.urls) && options.urls.length > 0) {
    for (const url of options.urls) {
      const res = await publishGoogleIndexingNotification(
        url,
        options.type || 'URL_UPDATED',
        options.credentials,
        fetchFn
      );
      googleResults.push(res);
    }
  }

  let webSubResults: WebSubResult[] = [];
  if (options.feedUrl) {
    webSubResults = await pingWebSubHubs(options.feedUrl, options.hubs, fetchFn);
  }

  let searchEngineResults: EnginePingResult[] = [];
  if (options.sitemapUrl) {
    searchEngineResults = await pingSearchEngines(options.sitemapUrl, fetchFn);
  }

  // overall ok if all attempted operations succeeded (or were simulated)
  const allGoogleOk = googleResults.every((r) => r.ok);
  const allWebSubOk = webSubResults.every((r) => r.ok);
  const allSearchEnginesOk = searchEngineResults.every((r) => r.ok);

  return {
    ok: allGoogleOk && allWebSubOk && allSearchEnginesOk,
    timestamp,
    googleIndexing: googleResults,
    webSubPings: webSubResults,
    searchEnginePings: searchEngineResults,
  };
}
