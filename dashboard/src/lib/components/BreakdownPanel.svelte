<script lang="ts">
  import { prettyLabel } from '$lib/format';
  import type { StatusBreakdown } from '$lib/types';

  interface Row extends StatusBreakdown {
    key: string;
  }

  interface Props {
    title: string;
    rows: Row[];
  }

  let { title, rows }: Props = $props();

  function share(count: number, total: number) {
    if (!total) return 0;
    return Math.max(count ? 6 : 0, Math.round((count / total) * 100));
  }

  let visible = $derived(rows.filter((row) => row.total > 0));
</script>

<section class="panel breakdown-panel">
  <h2>{title}</h2>
  <div class="table-scroll">
    <table class="breakdown-table">
      <thead>
        <tr>
          <th class="name-col">Name</th>
          <th class="num ok">Active</th>
          <th class="num warn">Expiring</th>
          <th class="num risk">Expired</th>
          <th class="num renewed">Renewed</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>
        {#each visible as row}
          <tr>
            <td class="name-col">
              <strong>{prettyLabel(row.key)}</strong>
              <div class="bar slim">
                <span class="active" style="width: {share(row.active, row.total)}%"></span>
                <span class="expiring" style="width: {share(row.expiring, row.total)}%"></span>
                <span class="expired" style="width: {share(row.expired, row.total)}%"></span>
                <span class="renewed" style="width: {share(row.renewed, row.total)}%"></span>
              </div>
            </td>
            <td class="num" class:ok={row.active > 0} class:zero={row.active === 0}>{row.active}</td>
            <td class="num" class:warn={row.expiring > 0} class:zero={row.expiring === 0}>{row.expiring}</td>
            <td class="num" class:risk={row.expired > 0} class:zero={row.expired === 0}>{row.expired}</td>
            <td class="num" class:renewed={row.renewed > 0} class:zero={row.renewed === 0}>{row.renewed}</td>
            <td class="num total">{row.total}</td>
          </tr>
        {:else}
          <tr>
            <td colspan="6" class="empty">No live records in this breakdown.</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>
