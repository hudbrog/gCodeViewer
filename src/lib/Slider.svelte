<script>
  import { createEventDispatcher } from 'svelte';

  export let min = 0;
  export let max = 100;
  export let step = 1;
  export let value = Math.min(max, Math.max(min, (min + max) / 2));
  export let orientation = 'horizontal'; // 'horizontal' or 'vertical'

  const dispatch = createEventDispatcher();

  $: {
    if (value < min) value = min;
    if (value > max) value = max;
  }

  function handleChange(event) {
    dispatch('change', { value: event.target.valueAsNumber });
  }

  function handleInput(event) {
    dispatch('input', { value: event.target.valueAsNumber });
  }

</script>

<div class="slider-container" class:vertical={orientation === 'vertical'} class:horizontal={orientation === 'horizontal'}>
  <input
    type="range"
    {min}
    {max}
    {step}
    bind:value
    on:input={handleInput}
    on:change={handleChange}
    class="slider-input"
    orient={orientation === 'vertical' ? 'vertical' : null} <!-- For Firefox -->
  />
  <span class="slider-value">{value}</span>
</div>

<style>
  .slider-container {
    display: flex;
    align-items: center;
    padding: 10px 0;
    width: 100%;
    max-width: 400px;
  }
  .slider-container.vertical {
    flex-direction: column;
    max-width: 80px; /* Adjust for vertical layout */
    min-height: 200px; /* Example height for vertical slider */
    align-items: center;
  }

  .slider-input {
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
    background: #ddd; /* Track background */
    border-radius: 5px;
    outline: none;
  }

  .horizontal .slider-input {
    width: 100%;
    height: 8px; /* Track height */
    margin-right: 15px;
  }

  .vertical .slider-input {
    width: 8px; /* Track width for vertical */
    min-height: 150px; /* Example track height */
    margin-bottom: 15px; /* Space between slider and value for vertical */
    writing-mode: bt-lr; /* IE */
    -webkit-appearance: slider-vertical; /* WebKit */
  }


  /* Webkit (Chrome, Safari, Edge Chromium) */
  .slider-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: #007bff;
    border-radius: 50%;
    cursor: pointer;
    /* margin-top: -6px; for horizontal */
  }
  .horizontal .slider-input::-webkit-slider-thumb {
     margin-top: -6px; /* Adjust thumb position to be centered on the track */
  }
   .vertical .slider-input::-webkit-slider-thumb {
     margin-left: -6px; /* Adjust thumb position for vertical */
  }


  /* Firefox */
  .slider-input::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: #007bff;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }

  .horizontal .slider-input::-moz-range-track {
    width: 100%;
    height: 8px;
    background: #ddd;
    border-radius: 5px;
    cursor: pointer;
  }
  .vertical .slider-input::-moz-range-track {
    width: 8px;
    height: 100%;
    background: #ddd;
    border-radius: 5px;
    cursor: pointer;
  }


  .slider-value {
    font-family: monospace;
    font-size: 1em;
    padding: 5px 8px;
    background-color: #f0f0f0;
    border-radius: 4px;
    min-width: 40px;
    text-align: center;
  }
  .vertical .slider-value {
    margin-top: 5px;
  }
</style>
