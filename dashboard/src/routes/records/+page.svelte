<script lang="ts">
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { api } from '$lib/api';
  import { dueLabel, formatDate, initials, prettyLabel } from '$lib/format';
  import {
    COMPLIANCE_STATUSES,
    COMPLIANCE_TYPES,
    DEPARTMENTS,
    type ComplianceRecord,
  } from '$lib/types';
  import { onMount } from 'svelte';

  let records = $state<ComplianceRecord[]>([]);
  let error = $state('');
  let status = $state('');
  let type = $state('');
  let department = $state('');
  let archived = $state('hide');

  async function load() {
    error = '';
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (type) params.set('type', type);
    if (department) params.set('department', department);
    if (archived !== 'hide') params.set('archived', archived);
    try {
      records = await api.records(params);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Could not load records';
    }
  }

  onMount(load);

  function clearFilters() {
    status = '';
    type = '';
    department = '';
    archived = 'hide';
    void load();
  }
</script>

<section class="page-head">
  <div>
    <h1>Compliance records</h1>
    <p class="muted">Filter by status, type, or department. Use Archived only to find records that were archived.</p>
  </div>
  <a class="button" href="/records/new">Add record</a>
</section>

<div class="toolbar has-clear">
  <label>
    Status
    <select bind:value={status} onchange={load}>
      <option value="">All statuses</option>
      {#each COMPLIANCE_STATUSES as item}
        <option value={item}>{item}</option>
      {/each}
    </select>
  </label>
  <label>
    Type
    <select bind:value={type} onchange={load}>
      <option value="">All types</option>
      {#each COMPLIANCE_TYPES as item}
        <option value={item}>{prettyLabel(item)}</option>
      {/each}
    </select>
  </label>
  <label>
    Department
    <select bind:value={department} onchange={load}>
      <option value="">All departments</option>
      {#each DEPARTMENTS as item}
        <option value={item}>{prettyLabel(item)}</option>
      {/each}
    </select>
  </label>
  <label>
    Archived
    <select bind:value={archived} onchange={load}>
      <option value="hide">Hide archived</option>
      <option value="include">Include archived</option>
      <option value="only">Archived only</option>
    </select>
  </label>
  <div class="toolbar-actions">
    <button class="button secondary" type="button" onclick={clearFilters}>Clear</button>
  </div>
</div>

{#if error}
  <p class="error">{error}</p>
{/if}

<div class="table-wrap">
  {#if records.length === 0}
    <p class="empty">No records match these filters.</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Employee</th>
          <th>Type</th>
          <th>Status</th>
          <th>Issued</th>
          <th>Expires</th>
          <th>Due</th>
        </tr>
      </thead>
      <tbody>
        {#each records as record}
          <tr class:is-archived={Boolean(record.archivedAt)}>
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
            <td>
              <StatusBadge status={record.status} />
              {#if record.archivedAt}
                <span class="badge archived">archived</span>
              {/if}
            </td>
            <td>{formatDate(record.issuedDate)}</td>
            <td>{formatDate(record.expiryDate)}</td>
            <td class:risk={record.status === 'expired'} class:warn={record.status === 'expiring'}>
              {dueLabel(record.expiryDate)}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
