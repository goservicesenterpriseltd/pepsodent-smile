'use client';

import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { locationStore } from '@/stores/LocationStore';
import type { PepsometerLocation } from '@/lib/api/pepsometer-api';

function getStateLabel(loc: PepsometerLocation): string {
  const raw = loc.state;
  if (raw && typeof raw === 'object') {
    const name = 'name' in raw && typeof (raw as { name?: unknown }).name === 'string' ? (raw as { name: string }).name : '';
    const s = name.trim();
    return s.length ? s : 'Other';
  }
  const s = typeof raw === 'string' ? raw.trim() : '';
  return s.length ? s : 'Other';
}

function LocationModal({
  isOpen,
  onClose,
  onSelect,
  query,
  onQueryChange,
  selectedId,
  locations,
  isLoading,
  error,
  onRefresh,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (loc: PepsometerLocation) => void;
  query: string;
  onQueryChange: (value: string) => void;
  selectedId: number | null;
  locations: PepsometerLocation[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter(l => {
      const hay = `${getStateLabel(l)} ${l.name} ${l.address}`.toLowerCase();
      return hay.includes(q);
    });
  }, [locations, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, PepsometerLocation[]>();
    for (const loc of filtered) {
      const state = getStateLabel(loc);
      const existing = map.get(state);
      if (existing) existing.push(loc);
      else map.set(state, [loc]);
    }

    // Sort locations within each group by name.
    for (const [, locs] of map) {
      locs.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Sort state groups alphabetically, but keep "Other" last.
    const entries = Array.from(map.entries());
    entries.sort((a, b) => {
      const aKey = a[0] === 'Other' ? '\uffff' : a[0].toLowerCase();
      const bKey = b[0] === 'Other' ? '\uffff' : b[0].toLowerCase();
      return aKey.localeCompare(bKey);
    });

    return entries;
  }, [filtered]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center">
      <button
        className="absolute inset-0 bg-black/50"
        aria-label="Close location picker"
        onClick={onClose}
      />

      <div className="relative w-full sm:w-[520px] max-h-[80vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-[#003366]">Select Location</div>
            <div className="text-xs text-gray-500">This is saved on this device until changed.</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="text-sm font-semibold px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
            >
              Refresh
            </button>
            <button
              onClick={onClose}
              className="text-sm font-semibold px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mt-4">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by name or address..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#004d99]"
          />
        </div>

        <div className="mt-4 flex-1 overflow-auto">
          {isLoading && (
            <div className="py-8 text-center text-gray-600">Loading locations…</div>
          )}

          {error && !isLoading && (
            <div className="py-6 text-center">
              <div className="text-sm text-red-600 font-semibold">Failed to load locations</div>
              <div className="text-xs text-gray-500 mt-1 break-words">{error}</div>
              <button
                onClick={onRefresh}
                className="mt-4 text-sm font-semibold px-4 py-2 rounded-full bg-[#003366] text-white hover:bg-[#004d99] transition"
              >
                Try again
              </button>
            </div>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <div className="py-8 text-center text-gray-600">No locations found.</div>
          )}

          {!isLoading && !error && filtered.length > 0 && (
            <div className="space-y-5">
              {grouped.map(([state, locs]) => (
                <div key={state}>
                  <div className="sticky top-0 z-10 -mx-1 px-1 py-2 bg-white/95 backdrop-blur border-b border-gray-100">
                    <div className="text-xs font-extrabold tracking-wide text-gray-500 uppercase">
                      {state}
                    </div>
                  </div>

                  <div className="mt-2 space-y-2">
                    {locs.map((loc) => {
                      const isSelected = selectedId === loc.id;
                      return (
                        <button
                          key={loc.id}
                          onClick={() => onSelect(loc)}
                          className={[
                            'w-full text-left p-4 rounded-xl border transition',
                            isSelected
                              ? 'border-[#004d99] bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                          ].join(' ')}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-[#003366]">{loc.name}</div>
                              <div className="text-xs text-gray-600 mt-1">{loc.address}</div>
                            </div>
                            {isSelected && (
                              <div className="text-xs font-bold text-[#004d99]">Selected</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const LocationPickerFab = observer(function LocationPickerFab() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    // Prevent hydration mismatch by loading persisted selection only after first client render
    locationStore.hydrate();
  }, []);

  useEffect(() => {
    if (open) {
      locationStore.fetchLocations(false);
    }
  }, [open]);

  const label = locationStore.selected?.name ? `📍 ${locationStore.selected.name}` : '📍 Location';

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[999]">
        <button
          onClick={() => {
            setQuery('');
            setOpen(true);
          }}
          className="group flex items-center gap-2 bg-black/80 text-white rounded-full shadow-xl px-4 py-3 hover:bg-black transition"
          aria-label="Open location picker"
        >
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/10 font-bold">
            📍
          </span>
          <span className="text-sm font-semibold max-w-[180px] truncate hidden sm:inline">
            {label.replace('📍 ', '')}
          </span>
        </button>
      </div>

      <LocationModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSelect={(loc) => {
          locationStore.selectLocation(loc);
          setOpen(false);
        }}
        query={query}
        onQueryChange={setQuery}
        selectedId={locationStore.selected?.id ?? null}
        locations={locationStore.locations}
        isLoading={locationStore.isLoading}
        error={locationStore.error}
        onRefresh={() => locationStore.fetchLocations(true)}
      />
    </>
  );
});


