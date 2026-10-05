<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { api } from '$lib/api';
  import { dateOnly, dueLabel, formatDate, initials, prettyLabel } from '$lib/format';
  import { COMPLIANCE_TYPES, type ComplianceRecord } from '$lib/types';
  import { onMount } from 'svelte';

  let record = $state<ComplianceRecord | null>(null);
  let type = $state('visa');
  let issuedDate = $state('');
  let expiryDate = $state('');
  let notes = $state('');
  let documentUrl = $state('');
  let error = $state('');
  let saving = $state(false);

  async function load() {
    record = await api.record($page.params.id);
    type = record.type;
    issuedDate = dateOnly(record.issuedDate);
    expiryDate = dateOnly(record.expiryDate);
    notes = record.notes ?? '';
    documentUrl = record.documentUrl ?? '';
  }

  onMount(load);

  async function save(event: Event) {
    event.preventDefault();
    if (!record) return;
    saving = true;
    error = '';
    try {
      record = await api.updateRecord(record.id, {
        type,
        issuedDate,
        expiryDate,
        notes: notes || undefined,
        documentUrl: documentUrl || undefined,
      });
      issuedDate = dateOnly(record.issuedDate);
      expiryDate = dateOnly(record.expiryDate);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Could not update record';
    } finally {
      saving = false;
    }
  }

  async function archive(hard = false) {
    if (!record) return;
    const confirmed = confirm(
      hard
        ? 'Permanently delete this record? This cannot be undone.'
        : 'Archive this record? It stays in the audit trail.',
    );
    if (!confirmed) return;
    try {
      await api.archiveRecord(record.id, hard);
      await goto('/records');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Could not archive record';
    }
  }
</script>

{#if record}
  <section class="page-head">
    <div class="detail-hero">
      <div class="person">
        <span class="avatar">{initials(record.employee.fullName)}</span>
        <div>
          <h1>{record.employee.fullName}</h1>
          <p class="muted">
            {prettyLabel(record.employee.department)} · {prettyLabel(record.type)} · {dueLabel(record.expiryDate)}
            {#if record.archivedAt}· archived{/if}
          </p>
        </div>
      </div>
    </div>
    <StatusBadge status={record.status} />
  </section>

  <div class="kpis">
    <article class="card kpi compact active">
      <div class="label">Issued</div>
      <div class="value">{formatDate(record.issuedDate)}</div>
    </article>
    <article class="card kpi compact expiring">
      <div class="label">Expires</div>
      <div class="value">{formatDate(record.expiryDate)}</div>
    </article>
    <article class="card kpi compact {record.status}">
      <div class="label">Current status</div>
      <div class="value">{record.status}</div>
    </article>
    <article class="card kpi compact renewed">
      <div class="label">Employee</div>
      <div class="value">{record.employee.email}</div>
    </article>
  </div>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <form class="panel" onsubmit={save}>
    <h2>Update record</h2>
    <div class="form-grid two">
      <label>
        Type
        <select bind:value={type}>
          {#each COMPLIANCE_TYPES as item}
            <option value={item}>{prettyLabel(item)}</option>
          {/each}
        </select>
      </label>
      <label>
        Document URL
        <input type="url" bind:value={documentUrl} />
      </label>
      <label>
        Issued date
        <input type="date" bind:value={issuedDate} required />
      </label>
      <label>
        Expiry date
        <input type="date" bind:value={expiryDate} required />
      </label>
      <label>
        Notes
        <input bind:value={notes} />
      </label>
    </div>
    <div class="actions">
      <button class="button" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
      <button class="button secondary" type="button" onclick={() => archive(false)}>Archive</button>
      <button class="button danger" type="button" onclick={() => archive(true)}>Hard delete</button>
    </div>
  </form>
{/if}
