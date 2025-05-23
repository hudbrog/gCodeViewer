<script>
  import { getContext, onMount, onDestroy } from 'svelte';
  import { v4 as uuidv4 } from 'uuid';

  export let title = "Accordion Title";
  export let initialOpen = false; // This prop defines if the item should be open initially

  const { registerItem, toggleItem, isOpen: getIsOpenStore } = getContext('accordion');
  const id = uuidv4(); // Generate a unique ID for this item

  let currentIsOpen; // Local variable to hold the reactive open state
  let unsubscribe;

  onMount(() => {
    registerItem(id, initialOpen); // Register with the parent, indicating initial state
    const isOpenStore = getIsOpenStore(id); // Get the specific store for this item
    unsubscribe = isOpenStore.subscribe(value => {
      currentIsOpen = value;
    });
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe(); // Clean up the subscription
    }
    // Optionally, unregister the item from the parent if needed, though not strictly necessary here
  });

  function handleToggle() {
    toggleItem(id); // Ask the parent to toggle this item's state
  }
</script>

<div class="accordion-item">
  <div class="accordion-title"
       on:click={handleToggle}
       role="button"
       tabindex="0"
       aria-expanded={currentIsOpen}
       aria-controls="accordion-content-{id}"
       on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleToggle()}>
    {title}
    <span class="accordion-icon" aria-hidden="true">{currentIsOpen ? '−' : '+'}</span>
  </div>
  {#if currentIsOpen}
    <div class="accordion-content" id="accordion-content-{id}" role="region">
      <slot name="content">Default content if none provided</slot>
    </div>
  {/if}
</div>

<style>
  .accordion-item {
    /* border: 1px solid #ddd; */ /* Let parent accordion handle overall border */
  }

  /* Styling to make items look connected when part of an accordion */
  :global(.accordion > .accordion-item:not(:first-child)) {
    border-top: 1px solid #ddd;
  }
   :global(.accordion > .accordion-item:first-child) .accordion-title {
    border-top-left-radius: 3px;
    border-top-right-radius: 3px;
  }
  :global(.accordion > .accordion-item:last-child) {
     border-bottom-left-radius: 3px;
     border-bottom-right-radius: 3px;
  }
  /* If the last item is closed, its title should have rounded bottom corners */
  :global(.accordion > .accordion-item:last-child) .accordion-title:not(.open) {
    border-bottom-left-radius: 3px;
    border-bottom-right-radius: 3px;
    border-bottom: none; /* No bottom border if it's the last item and closed */
  }
  /* If the last item is open, its content will make it naturally have square bottom corners before the content block */
 :global(.accordion > .accordion-item:last-child) .accordion-title.open {
    border-bottom: 1px solid #ddd;
 }


  .accordion-title {
    background-color: #f7f7f7;
    padding: 12px 18px; /* Slightly more padding */
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600; /* Slightly bolder */
    user-select: none;
    border-bottom: 1px solid #ddd; /* Default border for separation */
    transition: background-color 0.2s ease;
  }

  .accordion-title:hover {
    background-color: #e9e9e9;
  }

  .accordion-title:focus {
    outline: 2px solid blue; /* Basic focus indicator */
    outline-offset: -2px;
  }

  .accordion-icon {
    font-size: 1.1em; /* Adjusted size */
    font-weight: bold;
    margin-left: 10px; /* Space between title and icon */
  }

  .accordion-content {
    padding: 15px 18px;
    background-color: #fff;
    /* border-top: 1px solid #ddd;  Removed as title now always has bottom border */
  }
</style>
