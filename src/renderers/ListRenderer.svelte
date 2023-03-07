<script>
  export let ordered;
  export let start;
</script>

{#if ordered}
  <ol {start}><slot /></ol>
{:else}
  <ul><slot /></ul>
{/if}

<style>
  ol,
  ul {
    padding-left: 1rem;
    padding-right: 1rem;
  }
</style>
