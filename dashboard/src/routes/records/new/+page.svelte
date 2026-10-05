<script lang="ts">
  import { goto } from '$app/navigation';
  import EmployeeModal from '$lib/components/EmployeeModal.svelte';
  import { api } from '$lib/api';
  import { prettyLabel } from '$lib/format';
  import { COMPLIANCE_TYPES, type Employee } from '$lib/types';
  import { onMount } from 'svelte';

  let employees = $state<Employee[]>([]);
  let employeeId = $state('');
  let type = $state('visa');
  let issuedDate = $state('');
  let expiryDate = $state('');
  let notes = $state('');
  let documentUrl = $state('');
  let error = $state('');
  let saving = $state(false);
  let employeeModalOpen = $state(false);

  onMount(async () => {
    employees = await api.employees();
    employeeId = employees[0]?.id ?? '';
  });

  function onEmployeeCreated(employee: Employee) {
    employees = [...employees, employee].sort((a, b) => a.fullName.localeCompare(b.fullName));
    employeeId = employee.id;
    employeeModalOpen = false;
  }

  async function submit(event: Event) {
    event.preventDefault();
    saving = true;
    error = '';
    try {
      const record = await api.createRecord({
        employeeId,
        type,
        issuedDate,
        expiryDate,
        notes: notes || undefined,
        documentUrl: documentUrl || undefined,
      });
      await goto(`/records/${record.id}`);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Could not create record';
    } finally {
      saving = false;
    }
  }
</script>

<section class="page-head">
  <div>
    <h1>New compliance record</h1>
    <p class="muted">Status is computed from the dates. Expiry must be after the issued date.</p>
  </div>
  <a class="button secondary" href="/records">Back to records</a>
</section>

{#if error}
  <p class="error">{error}</p>
{/if}

<form class="panel" onsubmit={submit}>
  <div class="form-grid two">
    <div>
      <span class="field-label">Employee</span>
      <div class="field-with-action">
        <select bind:value={employeeId} required>
          {#each employees as employee}
            <option value={employee.id}>{employee.fullName} · {prettyLabel(employee.department)}</option>
          {/each}
        </select>
        <button class="button secondary" type="button" onclick={() => (employeeModalOpen = true)}>
          Add employee
        </button>
      </div>
    </div>
    <label>
      Type
      <select bind:value={type}>
        {#each COMPLIANCE_TYPES as item}
          <option value={item}>{prettyLabel(item)}</option>
        {/each}
      </select>
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
      Document URL
      <input type="url" bind:value={documentUrl} placeholder="https://" />
    </label>
    <label>
      Notes
      <input bind:value={notes} placeholder="Optional context for reviewers" />
    </label>
  </div>
  <div class="actions">
    <button class="button" disabled={saving}>{saving ? 'Saving…' : 'Create record'}</button>
    <a class="button secondary" href="/records">Cancel</a>
  </div>
</form>

<EmployeeModal
  open={employeeModalOpen}
  onClose={() => (employeeModalOpen = false)}
  onCreated={onEmployeeCreated}
/>
