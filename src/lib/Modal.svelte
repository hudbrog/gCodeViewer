<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  export let isOpen = false; // Two-way bindable

  const dispatch = createEventDispatcher();

  function closeModal() {
    isOpen = false;
    dispatch('close'); // Dispatch a close event
  }

  function handleKeydown(event) {
    if (isOpen && event.key === 'Escape') {
      closeModal();
    }
  }

  // Focus management
  let modalElement;
  let previouslyFocusedElement;

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  // When isOpen changes
  $: if (isOpen) {
    previouslyFocusedElement = document.activeElement;
    // Wait for modal to be rendered then focus it or a focusable element within it
    // Using a timeout is a common way to wait for the next tick
    setTimeout(() => {
      if (modalElement) {
        const focusable = modalElement.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable) {
          focusable.focus();
        } else {
          modalElement.focus(); // Fallback to modal itself
        }
      }
    }, 0);
  } else {
    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus();
      previouslyFocusedElement = null;
    }
  }

  function trapFocus(event) {
    if (!isOpen || !modalElement) return;

    const focusableElements = Array.from(modalElement.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
    if (focusableElements.length === 0) return;

    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];

    if (event.key === 'Tab') {
      if (event.shiftKey) { // Shift + Tab
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus();
          event.preventDefault();
        }
      } else { // Tab
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus();
          event.preventDefault();
        }
      }
    }
  }

</script>

{#if isOpen}
  <div class="modal-backdrop" on:click={closeModal} role="presentation"></div>
  <div
    class="modal"
    bind:this={modalElement}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-header-title"
    on:keydown={trapFocus}
    tabindex="-1" <!-- Make the modal itself focusable -->
  >
    <header class="modal-header">
      <slot name="header">
        <h2 id="modal-header-title" class="modal-title-default">Modal Title</h2>
      </slot>
      <button class="modal-close-button" on:click={closeModal} aria-label="Close modal">&times;</button>
    </header>

    <section class="modal-body">
      <slot name="body">
        <p>Default modal body content.</p>
      </slot>
    </section>

    <footer class="modal-footer">
      <slot name="footer">
        <button class="button-default" on:click={closeModal}>Close</button>
      </slot>
    </footer>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    z-index: 999; /* Below modal, above other content */
  }

  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    z-index: 1000; /* Above backdrop */
    width: 90%;
    max-width: 500px; /* Default max width */
    max-height: 90vh; /* Prevent modal from being too tall */
    display: flex;
    flex-direction: column;
    overflow: hidden; /* Ensures border-radius is applied to children */
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #e0e0e0;
    background-color: #f8f9fa; /* Light background for header */
  }

  .modal-title-default {
    margin: 0;
    font-size: 1.25em;
    font-weight: 500;
  }

  .modal-close-button {
    background: none;
    border: none;
    font-size: 1.8em;
    line-height: 1;
    padding: 0 5px;
    cursor: pointer;
    color: #666;
  }
  .modal-close-button:hover {
    color: #333;
  }

  .modal-body {
    padding: 20px;
    overflow-y: auto; /* Scrollable body if content is too long */
    flex-grow: 1; /* Allows body to expand and fill space */
  }

  .modal-footer {
    padding: 15px 20px;
    border-top: 1px solid #e0e0e0;
    text-align: right; /* Align footer content (e.g., buttons) to the right */
    background-color: #f8f9fa; /* Light background for footer */
  }

  .modal-footer > :global(button:not(:last-child)) {
    margin-right: 10px;
  }

  /* Default button style if user doesn't slot their own */
  .button-default {
    padding: 8px 15px;
    border: 1px solid #ccc;
    background-color: #f0f0f0;
    border-radius: 4px;
    cursor: pointer;
  }
  .button-default:hover {
    background-color: #e0e0e0;
  }
</style>
