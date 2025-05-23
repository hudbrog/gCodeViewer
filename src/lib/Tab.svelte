<script>
  import { getContext, onMount, onDestroy } from 'svelte';
  import { v4 as uuidv4 } from 'uuid';

  export let title = "Tab Title";
  // No content prop, content will be via slot

  const { registerTab, unregisterTab, isActiveTab } = getContext('tabs');
  const id = uuidv4();

  let active;
  let unsubscribeIsActiveTab;

  onMount(() => {
    registerTab(id, title);
    unsubscribeIsActiveTab = isActiveTab(id).subscribe(value => {
      active = value;
    });
  });

  onDestroy(() => {
    if (unsubscribeIsActiveTab) {
      unsubscribeIsActiveTab();
    }
    unregisterTab(id);
  });
</script>

{#if active}
  <div class="tab-content" role="tabpanel" aria-labelledby="tab-title-{id}">
    <slot></slot>
  </div>
{/if}

<style>
  .tab-content {
    padding: 15px;
    border: 1px solid #ddd;
    border-top: none; /* The active tab title will form the top border */
    background-color: #fff;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
  }
</style>
