<script>
  import { createEventDispatcher, getContext } from 'svelte';

  const dispatch = createEventDispatcher();
  // Attempt to get a close function from Dropdown context, if provided
  // This is an alternative to dispatching an event that the parent Dropdown listens to.
  const closeDropdown = getContext('closeDropdown');

  function handleClick(event) {
    dispatch('select', event); // Dispatch a select event with the original click event
    if (typeof closeDropdown === 'function') {
      closeDropdown(); // Call context function to close dropdown
    }
    // If not using context, the parent Dropdown would listen for 'select' and close itself.
  }
</script>

<div
  class="dropdown-item"
  on:click={handleClick}
  on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick(e)}
  role="menuitem"
  tabindex="0" <!-- Make it focusable -->
>
  <slot></slot>
</div>

<style>
  .dropdown-item {
    padding: 8px 15px;
    cursor: pointer;
    display: block; /* Make it take full width of parent */
    white-space: nowrap; /* Prevent text wrapping */
    background-color: transparent;
    border: none; /* Assuming it's inside a styled menu */
    text-align: left;
    width: 100%;
  }

  .dropdown-item:hover,
  .dropdown-item:focus {
    background-color: #f0f0f0; /* Highlight on hover/focus */
    outline: none; /* Remove default focus outline if custom styling is preferred */
  }
</style>
