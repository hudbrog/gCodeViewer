<script>
  import { createEventDispatcher, onMount, onDestroy, setContext } from 'svelte';

  export let isOpen = false;

  const dispatch = createEventDispatcher();
  let dropdownElement;
  let triggerElement;

  // Provide a way for DropdownItem to close the dropdown
  setContext('closeDropdown', closeDropdown);

  function toggleDropdown() {
    isOpen = !isOpen;
    if (isOpen) {
      dispatch('open');
    } else {
      dispatch('close');
    }
  }

  function closeDropdown() {
    if (isOpen) {
      isOpen = false;
      dispatch('close');
    }
  }

  function handleClickOutside(event) {
    if (dropdownElement && !dropdownElement.contains(event.target) && triggerElement && !triggerElement.contains(event.target)) {
      closeDropdown();
    }
  }

  function handleKeydown(event) {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      closeDropdown();
      triggerElement?.querySelector('button, a, [tabindex]')?.focus(); // Return focus to trigger
    }
    
    if (event.key === 'Tab') {
      const focusableItems = Array.from(
        dropdownElement.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      ).filter(el => el.offsetParent !== null); // Ensure elements are visible

      if (focusableItems.length === 0) return;

      const currentIndex = focusableItems.indexOf(document.activeElement);

      if (event.shiftKey) { // Shift + Tab
        if (document.activeElement === focusableItems[0]) {
          // Optional: close dropdown or move focus to trigger
          // For now, just trap within the menu or let it go to trigger via natural tab order if menu is first
        }
      } else { // Tab
        if (document.activeElement === focusableItems[focusableItems.length - 1]) {
          // Optional: if it's the last item, maybe loop to first, or close
          // focusableItems[0].focus(); // Loop to first
          // event.preventDefault(); 
        }
      }
    }
  }
  
  let menuStyle = '';
  $: if (isOpen && triggerElement && dropdownElement) {
    const triggerRect = triggerElement.getBoundingClientRect();
    const menuRect = dropdownElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    let topPosition;
    if (spaceBelow >= menuRect.height || spaceBelow >= spaceAbove) {
      topPosition = triggerRect.bottom + window.scrollY; // Position below
    } else {
      topPosition = triggerRect.top + window.scrollY - menuRect.height; // Position above
    }
    
    menuStyle = `top: ${topPosition}px; left: ${triggerRect.left + window.scrollX}px; min-width: ${triggerRect.width}px;`;
  }


  onMount(() => {
    document.addEventListener('click', handleClickOutside, true);
    // Keydown listener on document to catch Escape key globally for the dropdown
    // Specific Tab handling might be better on the dropdownElement itself if it's always present in DOM
  });

  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside, true);
  });
</script>

<div class="dropdown-container" on:keydown={handleKeydown}> <!-- Moved keydown here for context -->
  <div bind:this={triggerElement} on:click={toggleDropdown} role="button" aria-haspopup="menu" aria-expanded={isOpen} tabindex="0" on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleDropdown()}>
    <slot name="trigger">
      <button class="default-trigger">Dropdown</button>
    </slot>
  </div>

  {#if isOpen}
    <div
      bind:this={dropdownElement}
      class="dropdown-menu"
      role="menu"
      aria-labelledby={triggerElement?.id || null} <!-- Assuming trigger has an ID for better ARIA -->
      style={menuStyle}
    >
      <slot></slot> <!-- Default slot for DropdownItem components -->
    </div>
  {/if}
</div>

<style>
  .dropdown-container {
    position: relative;
    display: inline-block;
  }

  /* Ensure the trigger slot fills the div if it's a button or similar */
  .dropdown-container > div[role="button"] {
    display: inline-flex; /* Or block, depending on desired layout */
    cursor: pointer;
  }
  .dropdown-container > div[role="button"]:focus {
    outline: 2px solid blue; /* Or your preferred focus style */
     outline-offset: 2px;
  }


  .default-trigger {
    padding: 8px 12px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1em;
  }
  .default-trigger:hover {
    background-color: #0056b3;
  }

  .dropdown-menu {
    position: fixed; /* Changed to fixed for better viewport handling */
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    z-index: 1000; 
    min-width: 160px; 
    padding: 5px 0; 
    max-height: 40vh; /* Prevent menu from being too tall */
    overflow-y: auto; /* Scroll if too many items */
  }
</style>
