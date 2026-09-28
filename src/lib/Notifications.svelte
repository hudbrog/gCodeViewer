<script>
  import { createEventDispatcher } from 'svelte';

  export let messages = []; // Array of { id, type, text }

  const dispatch = createEventDispatcher();

  function clearNotification(id) {
    dispatch('clear', { id });
  }

  function clearAll() {
    dispatch('clearAll');
  }

  function getIcon(type) {
    switch (type) {
      case 'error': return '&#10060;'; // ❌ (Cross Mark) or use an SVG/icon font
      case 'warning': return '&#9888;'; // ⚠️ (Warning Sign)
      case 'info': return '&#8505;'; // ℹ️ (Information Source)
      case 'success': return '&#9989;'; // ✅ (Check Mark Button)
      default: return '';
    }
  }
</script>

{#if messages.length > 0}
  <div class="notifications-container">
    {#each messages as msg (msg.id)}
      <div class="notification" class:error={msg.type === 'error'} class:warning={msg.type === 'warning'} class:info={msg.type === 'info'} class:success={msg.type === 'success'}>
        <span class="notification-icon" role="img" aria-label={msg.type}>{@html getIcon(msg.type)}</span>
        <span class="notification-text">{msg.text}</span>
        <button class="notification-close" on:click={() => clearNotification(msg.id)} aria-label="Close notification">&times;</button>
      </div>
    {/each}
    {#if messages.length > 1}
      <button class="clear-all-button" on:click={clearAll}>Clear All ({messages.length})</button>
    {/if}
  </div>
{/if}

<style>
  .notifications-container {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 300px;
    z-index: 2000; /* Above most other content */
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .notification {
    padding: 12px 15px;
    border-radius: 6px;
    color: #fff;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .notification.info {
    background-color: #007bff; /* Blue */
  }
  .notification.success {
    background-color: #28a745; /* Green */
  }
  .notification.warning {
    background-color: #ffc107; /* Yellow */
    color: #333; /* Darker text for yellow */
  }
  .notification.error {
    background-color: #dc3545; /* Red */
  }

  .notification-icon {
    margin-right: 10px;
    font-size: 1.2em;
    line-height: 1; /* Ensure icon aligns well with text */
  }

  .notification-text {
    flex-grow: 1;
    font-size: 0.9em;
  }

  .notification-close {
    background: none;
    border: none;
    color: inherit; /* Inherits color from parent (white or dark for warning) */
    opacity: 0.7;
    font-size: 1.4em;
    line-height: 1;
    padding: 0 5px;
    margin-left: 10px;
    cursor: pointer;
  }
  .notification-close:hover {
    opacity: 1;
  }
  
  .clear-all-button {
    background-color: #6c757d; /* Secondary grey */
    color: white;
    border: none;
    padding: 8px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8em;
    text-align: center;
    margin-top: 5px; /* Space from last notification */
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .clear-all-button:hover {
    background-color: #5a6268;
  }

</style>
