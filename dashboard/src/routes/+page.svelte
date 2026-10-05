<script lang="ts">
  import BreakdownPanel from '$lib/components/BreakdownPanel.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { API_BASE_URL, api } from '$lib/api';
  import { dueLabel, formatDate, initials, prettyLabel } from '$lib/format';
  import type { DashboardReport } from '$lib/types';
  import { onMount } from 'svelte';

  let days = $state(30);
  let from = $state('');
  let to = $state('');
  let report = $state<DashboardReport | null>(null);
  let error = $state('');
  let loading = $state(false);
  let live = $state(false);

  async function load(silent = false) {
    if (!silent) {
      loading = true;
    }
    error = '';
    const params = new URLSearchParams();
    if (from && to) {
      params.set('from', from);
      params.set('to', to);
    } else {
      params.set('days', String(days));
    }
    try {
      report = await api.dashboard(params);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Could not load dashboard';
    } finally {
      loading = false;
    }
  }

  function clearFilters() {
    days = 30;
    from = '';
    to = '';
    void load();
  }

  onMount(() => {
    load();

    const source = new EventSource(`${API_BASE_URL}/reports/stream`);
    source.onopen = () => {
      live = true;
    };
    source.onerror = () => {
      live = false;
    };
    source.onmessage = (event) => {
      live = true;
      try {
        const payload = JSON.parse(event.data) as { type?: string };
        if (payload.type === 'changed') {
          void load(true);
        }
      } catch {
        // ignore malformed frames
      }
    };

    const poll = setInterval(() => {
      void load(true);
    }, 15000);

    return () => {
      source.close();
      clearInterval(poll);
    };
  });
</script>

<section class="page-head">
  <div>
    <h1>Compliance overview</h1>
    <p class="muted">Company-wide live totals. Use the date controls in Impending expiry to focus that list.</p>
  </div>
  <span class="live-pill" class:on={live}>{live ? 'Live' : 'Reconnecting'}</span>
</section>

{#if error}
  <p class="error">{error}</p>
{/if}

{#if report}
  <div class="kpis">
    <article class="card kpi active">
      <div class="label">Active</div>
      <div class="value">{report.totals.active}</div>
      <div class="hint">Currently valid</div>
    </article>
    <article class="card kpi expiring">
      <div class="label">Expiring</div>
      <div class="value">{report.totals.expiring}</div>
      <div class="hint">Inside the warning window</div>
    </article>
    <article class="card kpi expired">
      <div class="label">Expired</div>
      <div class="value">{report.totals.expired}</div>
      <div class="hint">Needs renewal now</div>
    </article>
    <article class="card kpi renewed">
      <div class="label">Renewed</div>
      <div class="value">{report.totals.renewed}</div>
      <div class="hint">{report.totals.archived} archived</div>
    </article>
  </div>

  <div class="meta-row">
    <span>Live snapshot of every open record</span>
    <span>Updated {new Date(report.generatedAt).toLocaleString()}</span>
  </div>

  <div class="grid-2">
    <BreakdownPanel
      title="By department"
      rows={report.byDepartment.map((row) => ({ ...row, key: row.department }))}
    />
    <BreakdownPanel
      title="By type"
      rows={report.byType.map((row) => ({ ...row, key: row.type }))}
    />
  </div>

  <section class="panel">
    <div class="panel-head">
      <div>
        <h2>Impending expiry</h2>
        <p class="muted">
          Showing records that expire {formatDate(report.window.from)} – {formatDate(report.window.to)}
          {#if report.window.days}(next {report.window.days} days){/if}
        </p>
      </div>
    </div>
    <form class="toolbar nested" onsubmit={(event) => { event.preventDefault(); load(); }}>
      <label>
        Next N days
        <input type="number" min="1" max="365" bind:value={days} />
      </label>
      <label>
        From
        <input type="date" bind:value={from} />
      </label>
      <label>
        To
        <input type="date" bind:value={to} />
      </label>
      <div class="toolbar-actions">
        <button class="button" disabled={loading}>
          {loading ? 'Refreshing…' : 'Apply'}
        </button>
        <button class="button secondary" type="button" onclick={clearFilters}>
          Clear
        </button>
      </div>
    </form>
    {#if report.expiringSoon.length === 0}
      <p class="empty">Nothing expires in this window.</p>
    {:else}
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Type</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {#each report.expiringSoon as record}
              <tr>
                <td>
                  <a class="person link" href="/records/{record.id}">
                    <span class="avatar">{initials(record.employee.fullName)}</span>
                    <span>
                      {record.employee.fullName}
                      <div class="muted">{prettyLabel(record.employee.department)}</div>
                    </span>
                  </a>
                </td>
                <td>{prettyLabel(record.type)}</td>
                <td><StatusBadge status={record.status} /></td>
                <td>{formatDate(record.expiryDate)}</td>
                <td class:risk={record.status === 'expired'} class:warn={record.status === 'expiring'}>
                  {dueLabel(record.expiryDate)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>
{/if}
