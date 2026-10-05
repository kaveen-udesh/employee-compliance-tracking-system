<script lang="ts">
  import EmployeeModal from '$lib/components/EmployeeModal.svelte';
  import { api } from '$lib/api';
  import { initials, prettyLabel } from '$lib/format';
  import { DEPARTMENTS, type Employee } from '$lib/types';
  import { onMount } from 'svelte';

  let employees = $state<Employee[]>([]);
  let totalCount = $state(0);
  let search = $state('');
  let filterDepartment = $state('');
  let open = $state(false);
  let searchTimer: ReturnType<typeof setTimeout> | undefined;

  async function load() {
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (filterDepartment) params.set('department', filterDepartment);
    employees = await api.employees(params);
    if (!search.trim() && !filterDepartment) {
      totalCount = employees.length;
    }
  }

  onMount(async () => {
    await load();
    totalCount = employees.length;
  });

  function onSearchInput() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      void load();
    }, 250);
  }

  async function onEmployeeCreated() {
    open = false;
    search = '';
    filterDepartment = '';
    await load();
    totalCount = employees.length;
  }
</script>

<section class="page-head">
  <div>
    <h1>Employees</h1>
    <p class="muted">
      {employees.length}
      {employees.length === 1 ? 'person' : 'people'} shown
      {#if search || filterDepartment}of {totalCount}{/if}.
      Search by name or email, or filter by department.
    </p>
  </div>
  <button class="button" type="button" onclick={() => (open = true)}>Add employee</button>
</section>

<div class="toolbar search">
  <label>
    Search
    <input
      bind:value={search}
      oninput={onSearchInput}
      placeholder="Name or email"
    />
  </label>
  <label>
    Department
    <select bind:value={filterDepartment} onchange={load}>
      <option value="">All departments</option>
      {#each DEPARTMENTS as item}
        <option value={item}>{prettyLabel(item)}</option>
      {/each}
    </select>
  </label>
  <div class="toolbar-actions">
    <button
      class="button secondary"
      type="button"
      onclick={() => {
        search = '';
        filterDepartment = '';
        void load();
      }}
    >
      Clear
    </button>
  </div>
</div>

<div class="table-wrap">
  {#if employees.length === 0}
    <p class="empty">No employees match these filters.</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Department</th>
          <th>Records</th>
        </tr>
      </thead>
      <tbody>
        {#each employees as employee}
          <tr>
            <td>
              <div class="person">
                <span class="avatar">{initials(employee.fullName)}</span>
                <strong>{employee.fullName}</strong>
              </div>
            </td>
            <td>{employee.email}</td>
            <td>{prettyLabel(employee.department)}</td>
            <td>{employee._count?.records ?? 0}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<EmployeeModal
  open={open}
  onClose={() => (open = false)}
  onCreated={onEmployeeCreated}
/>
