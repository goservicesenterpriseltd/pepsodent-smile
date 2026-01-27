export type PepsometerState = {
  id: number;
  name: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  status?: string;
};

export type PepsometerLocation = {
  id: number;
  state_id?: number | null;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  /**
   * New upstream field: each location is associated to a state.
   * Upstream schema returns an object, but we remain defensive.
   */
  state?: PepsometerState | string | null;
};

export type ListLocationsResponse = {
  current_page?: number;
  data: PepsometerLocation[];
};

export type SubmitActivityPayload = {
  location_id: number;
  email: string | null;
  phone_number: string | null;
  first_name: string | null;
  other_name: string | null;
  last_name: string | null;
  gender: string | null;
  score: number | null;
  image_base64: string | null;
};

export type SubmitActivityResponse = {
  status: boolean;
  message: string;
  data?: unknown;
};

export class PepsometerApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'PepsometerApiError';
    this.status = status;
    this.body = body;
  }
}

// IMPORTANT: call through our same-origin proxy routes to avoid browser CORS issues.
const PROXY_BASE_PATH = '/api/pepsometer';

async function parseJsonSafe<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return { raw: text } as T;
  }
}

function normalizeStateName(raw: unknown): string | null {
  if (typeof raw === 'string') {
    const s = raw.trim();
    return s.length ? s : null;
  }
  if (raw && typeof raw === 'object') {
    const maybeName = (raw as { name?: unknown; title?: unknown }).name ?? (raw as { title?: unknown }).title;
    if (typeof maybeName === 'string') {
      const s = maybeName.trim();
      return s.length ? s : null;
    }
  }
  return null;
}

function toStringOrEmpty(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function normalizeState(raw: unknown): PepsometerState | string | null {
  // If it's already a string, keep it (UI will use it as label).
  if (typeof raw === 'string') return normalizeStateName(raw);

  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const id = typeof r.id === 'number' ? r.id : Number(r.id);
    const name = toStringOrEmpty(r.name).trim();
    if (Number.isFinite(id) && name) {
      return {
        id,
        name,
        address: toStringOrEmpty(r.address).trim() || undefined,
        latitude: toStringOrEmpty(r.latitude).trim() || undefined,
        longitude: toStringOrEmpty(r.longitude).trim() || undefined,
        status: toStringOrEmpty(r.status).trim() || undefined,
      };
    }

    // Fallback: if it looks like an object but not matching expected shape, try name extraction.
    return normalizeStateName(raw);
  }

  return null;
}

function normalizeLocation(raw: unknown): PepsometerLocation | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const id = typeof r.id === 'number' ? r.id : Number(r.id);
  if (!Number.isFinite(id)) return null;

  const name = toStringOrEmpty(r.name).trim();
  if (!name) return null;

  const state_id =
    typeof r.state_id === 'number'
      ? r.state_id
      : r.state_id == null
        ? null
        : Number(r.state_id);

  const address = toStringOrEmpty(r.address).trim();
  const latitude = toStringOrEmpty(r.latitude ?? r.lat).trim();
  const longitude = toStringOrEmpty(r.longitude ?? r.lng).trim();

  // The API update mentions "each location carries a state" but the exact shape can vary.
  // Common possibilities: `state: "Lagos"`, `state_name: "Lagos"`, or `state: { name: "Lagos" }`.
  const state =
    normalizeState(r.state) ??
    normalizeState(r.state_name) ??
    normalizeState(r.stateName) ??
    normalizeState((r.state as { name?: unknown } | undefined)?.name);

  return { id, state_id: Number.isFinite(state_id as number) ? (state_id as number) : null, name, address, latitude, longitude, state };
}

export async function listLocations(params?: {
  page?: number;
  per_page?: number;
}): Promise<PepsometerLocation[]> {
  // Build a relative URL with search params (works in browser fetch without CORS).
  const url = new URL(`${PROXY_BASE_PATH}/locations`, 'http://localhost');
  if (params?.page != null) url.searchParams.set('page', String(params.page));
  if (params?.per_page != null) url.searchParams.set('per_page', String(params.per_page));

  const response = await fetch(url.pathname + url.search, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await parseJsonSafe<unknown>(response);
    throw new PepsometerApiError(
      response.status,
      `Pepsometer /locations failed: ${response.status} ${response.statusText}`,
      body
    );
  }

  const json = await parseJsonSafe<{ data?: unknown } & Partial<ListLocationsResponse>>(response);
  const data = Array.isArray(json?.data) ? json.data : [];
  return data.map(normalizeLocation).filter((v): v is PepsometerLocation => v != null);
}

export async function submitActivity(payload: SubmitActivityPayload): Promise<SubmitActivityResponse> {
  const url = new URL(`${PROXY_BASE_PATH}/submit`, 'http://localhost');

  // Upstream expects a proper data URL (e.g. `data:image/jpeg;base64,<...>`).
  // Our app often stores raw base64 without the prefix for persistence.
  const image_base64 =
    payload.image_base64 && !payload.image_base64.startsWith('data:')
      ? `data:image/jpeg;base64,${payload.image_base64}`
      : payload.image_base64;

  const response = await fetch(url.pathname + url.search, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, image_base64 }),
  });

  const json = await parseJsonSafe<SubmitActivityResponse>(response);

  if (!response.ok) {
    throw new PepsometerApiError(
      response.status,
      `Pepsometer /submit failed: ${response.status} ${response.statusText}`,
      json
    );
  }

  return json;
}


