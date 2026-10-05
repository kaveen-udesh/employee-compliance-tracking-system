<script lang="ts">
  import { api } from '$lib/api';
  import { prettyLabel } from '$lib/format';
  import { DEPARTMENTS, type Employee } from '$lib/types';

  interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: (employee: Employee) => void;
  }

  let { open, onClose, onCreated }: Props = $props();
  let fullName = $state('');
  let email = $state('');
  let department = $state('engineering');
  let error = $state('');
  let saving = $state(false);

  function reset() {
    fullName = '';
    email = '';
    department = 'engineering';
    error = '';
    saving = false;
  }

  function close() {
    reset();
    onClose();
  }

  function onKeydown(event: KeyboardEvent) {
    if (open && event.key === 'Escape') close();
  }

  async function submit(event: Event) {
    event.preventDefault();
    error = '';
    saving = true;
    try {
      const employee = await api.createEmployee({
        fullName,
        email,
        department: department as Employee['department'],
      });
      reset();
      onCreated(employee);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Could not create employee';
    } finally {
      saving = false;
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <div
    class="modal-backdrop"
    role="presentation"
    onclick={(event) => {
      if (event.currentTarget === event.target) close();
    }}
  >
    <form class="modal" onsubmit={submit}>
      <h2>Add employee</h2>
      <p class="muted">New people can then be attached to visas, training, and other records.</p>
      {#if error}
        <p class="error">{error}</p>
      {/if}
      <div class="form-grid two">
        <label>
          Full name
          <input bind:value={fullName} required placeholder="Jordan Lee" />
        </label>
        <label>
          Email
          <input type="email" bind:value={email} required placeholder="jordan@abccompany.example" />
        </label>
        <label>
          Department
          <select bind:value={department}>
            {#each DEPARTMENTS as item}
              <option value={item}>{prettyLabel(item)}</option>
            {/each}
          </select>
        </label>
      </div>
      <div class="actions">
        <button class="button" disabled={saving}>{saving ? 'Saving…' : 'Create employee'}</button>
        <button class="button secondary" type="button" onclick={close}>Cancel</button>
      </div>
    </form>
  </div>
{/if}
