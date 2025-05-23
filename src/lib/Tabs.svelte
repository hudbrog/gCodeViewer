<script>
  import { setContext, onMount, afterUpdate } from 'svelte';
  import { writable, derived } from 'svelte/store';

  const tabs = writable([]); // Store for tab {id, title} objects
  const activeTabId = writable(null); // Store for the ID of the active tab

  setContext('tabs', {
    registerTab: (id, title) => {
      tabs.update(currentTabs => {
        if (!currentTabs.find(t => t.id === id)) {
          return [...currentTabs, { id, title }];
        }
        return currentTabs;
      });
      // If no tab is active and this is the first tab, make it active
      if (activeTabIdStore === null && tabsStore.length === 1) { // Check store directly
        activeTabId.set(id);
      }
    },
    unregisterTab: (id) => {
      tabs.update(currentTabs => currentTabs.filter(t => t.id !== id));
      activeTabId.update(currentActiveId => {
        if (currentActiveId === id) {
          // If the active tab is being unregistered, try to set a new active tab
          let newActiveId = null;
          tabs.subscribe(currentTabs => { // get latest tabs
            if (currentTabs.length > 0) {
              newActiveId = currentTabs[0].id;
            }
          })(); // IIFE to get the value immediately
          return newActiveId;
        }
        return currentActiveId;
      });
    },
    selectTab: (id) => {
      activeTabId.set(id);
    },
    isActiveTab: (id) => derived(activeTabId, $activeId => $activeId === id)
  });

  let tabsStore = [];
  tabs.subscribe(value => tabsStore = value);

  let activeTabIdStore;
  activeTabId.subscribe(value => activeTabIdStore = value);

  // Ensure an active tab is set on mount if not already
  onMount(() => {
    if (activeTabIdStore === null && tabsStore.length > 0) {
      activeTabId.set(tabsStore[0].id);
    }
  });

  // Ensure an active tab is selected after tabs are updated (e.g. if current active tab is removed)
  afterUpdate(() => {
    if (activeTabIdStore !== null && !tabsStore.find(t => t.id === activeTabIdStore) && tabsStore.length > 0) {
      activeTabId.set(tabsStore[0].id);
    } else if (activeTabIdStore === null && tabsStore.length > 0) {
       activeTabId.set(tabsStore[0].id);
    }
  });

</script>

<div class="tabs-container">
  <div class="tab-titles" role="tablist">
    {#each tabsStore as tab (tab.id)}
      <button
        class="tab-title"
        class:active={tab.id === activeTabIdStore}
        on:click={() => activeTabId.set(tab.id)}
        role="tab"
        aria-selected={tab.id === activeTabIdStore}
        aria-controls="tab-content-{tab.id}" <!-- Assuming Tab.svelte content has this id structure -->
        id="tab-title-{tab.id}"
      >
        {tab.title}
      </button>
    {/each}
  </div>
  <div class="tab-content-area">
    <slot></slot> <!-- Tab components will render their content here if active -->
  </div>
</div>

<style>
  .tabs-container {
    /* border: 1px solid #ccc; */
    border-radius: 4px;
    overflow: hidden; /* To contain the border-radius of children */
  }

  .tab-titles {
    display: flex;
    background-color: #f0f0f0;
    border-bottom: 1px solid #ddd;
  }

  .tab-title {
    padding: 10px 15px;
    cursor: pointer;
    border: none;
    background-color: transparent;
    font-size: 1em;
    position: relative; /* For the active indicator */
    color: #333;
    border-right: 1px solid #ddd; /* Separator */
  }
  .tab-title:last-child {
    border-right: none;
  }


  .tab-title:hover {
    background-color: #e7e7e7;
  }

  .tab-title.active {
    background-color: #fff; /* Match content area background */
    color: #007bff;
    font-weight: bold;
    border-bottom: 1px solid #fff; /* Make it look like it merges with content */
    /* Or a more distinct active style: */
    /* border-bottom: 2px solid #007bff; */
    /* margin-bottom: -1px; /* Overlap the container's border-bottom */
  }

  .tab-title:focus {
    outline: 1px solid blue;
    z-index: 1; /* Ensure focus outline is visible over other elements */
  }

  .tab-content-area {
    /* Styles for the area where active tab content is shown */
    /* If Tab.svelte handles its own border/padding, this might not need much */
  }
</style>
