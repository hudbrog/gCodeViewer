<script>
  import { createEventDispatcher } from 'svelte';

  export let label = 'Button'; // Default label
  export let disabled = false; // Default disabled state

  const dispatch = createEventDispatcher();

  function handleClick(event) {
    if (!disabled) {
      dispatch('click', event);
    }
  }
</script>

<button class="custom-button" {disabled} on:click={handleClick}>
  {label}
</button>

<style>
  .custom-button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background-color: #007bff; /* Blue color */
    color: white;
    font-size: 1em;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
  }

  .custom-button:hover {
    background-color: #0056b3; /* Darker blue on hover */
  }

  .custom-button:disabled {
    background-color: #cccccc; /* Grey when disabled */
    color: #666666;
    cursor: not-allowed;
  }
</style>
