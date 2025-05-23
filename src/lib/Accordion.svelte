<script>
  import { setContext } from 'svelte';
  import { writable, derived } from 'svelte/store';

  export let allowMultiple = true;

  // A set of IDs for currently open items
  const openItemIds = writable(new Set());

  setContext('accordion', {
    // Function for items to register themselves and their initial open state
    registerItem: (id, initialOpen = false) => {
      if (initialOpen) {
        openItemIds.update(ids => {
          ids.add(id);
          return ids;
        });
      }
    },
    // Function for items to toggle their open state
    toggleItem: (id) => {
      openItemIds.update(ids => {
        if (ids.has(id)) {
          ids.delete(id);
        } else {
          if (!allowMultiple) {
            ids.clear(); // Close all others if only one is allowed
          }
          ids.add(id);
        }
        return ids;
      });
    },
    // A derived store that individual items can subscribe to for their open state
    isOpen: (id) => derived(openItemIds, $ids => $ids.has(id))
  });
</script>

<div class="accordion">
  <slot></slot>
</div>

<style>
  .accordion {
    border: 1px solid #ccc;
    border-radius: 4px;
    /* If items have their own borders, and you want them to look connected: */
    /* display: flex; */
    /* flex-direction: column; */
  }
</style>
