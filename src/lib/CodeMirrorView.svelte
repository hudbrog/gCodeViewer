<script>
  import { onMount, onDestroy, afterUpdate } from 'svelte';

  export let gcodeText = "";
  export let highlightedLines = null; // { first: number, last: number }
  export let showLineNumbers = true;
  export let readOnly = true;

  let editor;
  let editorElement; // The div CodeMirror will attach to
  let currentHighlights = []; // To keep track of currently highlighted line handles

  onMount(() => {
    if (window.CodeMirror) {
      editor = window.CodeMirror(editorElement, {
        value: gcodeText,
        lineNumbers: showLineNumbers,
        mode: 'gcode', // Assuming gcode_mode.js defines 'gcode'
        readOnly: readOnly,
        gutters: ['CodeMirror-linenumbers'] // Ensure gutters are explicitly set if using line numbers
      });
      
      // Initial highlight if provided
      if (highlightedLines) {
        highlightLines(highlightedLines.first, highlightedLines.last);
      }

    } else {
      console.error("CodeMirror library not found. Make sure it's loaded globally.");
    }
    
    return () => {
      // CodeMirror's way to destroy is to get the wrapper element and remove it.
      // There isn't a specific .destroy() method on the instance itself.
      if (editor) {
        const wrapperElement = editor.getWrapperElement();
        if (wrapperElement && wrapperElement.parentNode) {
          wrapperElement.parentNode.removeChild(wrapperElement);
        }
        editor = null; 
      }
    };
  });

  // Reactive statement to update editor content when gcodeText prop changes
  $: if (editor && gcodeText !== editor.getValue()) {
    editor.setValue(gcodeText);
    // After setting value, if there's an initial highlight range, apply it
    if (highlightedLines) {
        highlightLines(highlightedLines.first, highlightedLines.last);
    }
  }
  
  // Watch for changes in highlightedLines prop
  $: if (editor && highlightedLines) {
    highlightLines(highlightedLines.first, highlightedLines.last);
  } else if (editor && !highlightedLines) {
    // Clear existing highlights if highlightedLines becomes null
    clearAllHighlights();
  }


  // Method to highlight lines
  export function highlightLines(first, last) {
    if (!editor || first === undefined || last === undefined || first < 0 || last < 0) return;
    
    clearAllHighlights();

    // Ensure first and last are within bounds
    const lineCount = editor.lineCount();
    const safeFirst = Math.max(0, Math.min(first, lineCount - 1));
    const safeLast = Math.max(0, Math.min(last, lineCount - 1));

    for (let i = safeFirst; i <= safeLast; i++) {
      currentHighlights.push(editor.addLineClass(i, 'background', 'activeline'));
    }
  }
  
  function clearAllHighlights() {
    if (!editor) return;
    currentHighlights.forEach(lineHandle => {
      editor.removeLineClass(lineHandle, 'background', 'activeline');
    });
    currentHighlights = [];
  }

  // Method to refresh the editor (e.g., when its container is resized or shown)
  export function refresh() {
    if (editor) {
      editor.refresh();
    }
  }

  // Method to set cursor position
  export function setCursorPosition(line, char = 0) {
    if (editor) {
      // Ensure line is within bounds
      const lineCount = editor.lineCount();
      const safeLine = Math.max(0, Math.min(line, lineCount - 1));
      editor.setCursor(safeLine, char);
      editor.focus(); // Optionally focus the editor
    }
  }
  
  // Update options if they change dynamically (less common for some like readOnly)
  $: if(editor && editor.getOption('lineNumbers') !== showLineNumbers) {
    editor.setOption('lineNumbers', showLineNumbers);
  }
  $: if(editor && editor.getOption('readOnly') !== readOnly) {
    editor.setOption('readOnly', readOnly);
  }

</script>

<div bind:this={editorElement} class="codemirror-wrapper"></div>

<style>
  .codemirror-wrapper {
    width: 100%;
    height: 100%; /* Ensure wrapper takes full height of its container */
    border: 1px solid #ccc;
    position: relative; /* Needed for CodeMirror layout */
  }

  /* Style for highlighted lines, make sure CodeMirror CSS is loaded for this to work well */
  :global(.CodeMirror .activeline) {
    background-color: #e8f2ff !important; /* Light blue background, !important might be needed */
  }
  /* Ensure the CodeMirror instance itself takes up the full space of the wrapper */
  :global(.CodeMirror) {
    height: 100% !important; 
    font-family: monospace;
    font-size: 0.9em;
  }
</style>
