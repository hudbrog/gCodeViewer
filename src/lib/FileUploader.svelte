<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  let isDraggingOver = false;
  let fileInput; // Reference to the hidden file input

  function handleFileSelection(fileList) {
    if (fileList && fileList.length > 0) {
      dispatch('filesSelected', fileList);
    }
  }

  // For the <input type="file">
  function onFileInputChange(event) {
    handleFileSelection(event.target.files);
  }

  // For the drop zone
  function onDragOver(event) {
    event.preventDefault(); // Necessary to allow drop
    isDraggingOver = true;
  }

  function onDragLeave(event) {
    // Check if the leave is not to a child element, can be tricky
    // For simplicity, we'll assume any dragleave means it's out.
    // More robust solutions might check event.relatedTarget.
    isDraggingOver = false;
  }

  function onDrop(event) {
    event.preventDefault();
    isDraggingOver = false;
    handleFileSelection(event.dataTransfer.files);
  }

  // Function to trigger the hidden file input when drop zone is clicked
  function triggerFileInput() {
    if (fileInput) {
      fileInput.click();
    }
  }
</script>

<div class="file-uploader-container">
  <!-- Hidden file input, triggered by clicking the drop zone -->
  <input
    type="file"
    bind:this={fileInput}
    on:change={onFileInputChange}
    multiple
    class="file-input-hidden"
    aria-hidden="true"
    tabindex="-1"
  />

  <div
    class="drop-zone"
    class:dragging-over={isDraggingOver}
    on:dragover={onDragOver}
    on:dragleave={onDragLeave}
    on:drop={onDrop}
    on:click={triggerFileInput}
    on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && triggerFileInput()}
    role="button"
    tabindex="0"
    aria-label="File drop zone or click to select files"
  >
    {#if isDraggingOver}
      <p>Drop files here...</p>
    {:else}
      <p>Drag and drop files here, or click to select files.</p>
      <button class="browse-button" type="button" on:click|stopPropagation={triggerFileInput}>Browse Files</button>
    {/if}
  </div>
</div>

<style>
  .file-uploader-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: Arial, sans-serif;
  }

  .file-input-hidden {
    display: none; /* Hidden, triggered programmatically */
  }

  .drop-zone {
    width: 100%;
    max-width: 400px; /* Or adjust as needed */
    min-height: 150px;
    border: 2px dashed #ccc;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 20px;
    cursor: pointer;
    transition: border-color 0.3s ease, background-color 0.3s ease;
  }

  .drop-zone:hover {
    border-color: #aaa;
  }
  .drop-zone:focus {
    outline: 2px solid blue;
    outline-offset: 2px;
  }

  .drop-zone.dragging-over {
    border-color: #007bff;
    background-color: #f0f8ff; /* Light blue background */
  }

  .drop-zone p {
    margin: 0 0 10px 0;
    color: #555;
  }

  .browse-button {
    padding: 8px 15px;
    font-size: 0.9em;
    color: white;
    background-color: #007bff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  .browse-button:hover {
    background-color: #0056b3;
  }
</style>
