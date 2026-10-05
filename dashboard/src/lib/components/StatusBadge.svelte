<script lang="ts">
  interface Props {
    status: string;
  }

  let { status }: Props = $props();
</script>

<span class="badge {status}">{status}</span>
