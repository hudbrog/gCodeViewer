<script>
  import { createEventDispatcher, afterUpdate } from 'svelte';

  export let filamentDiameter = 1.75; // mm
  export let nozzleDiameter = 0.4; // mm
  export let hourlyCost = 1.0; // currency units
  export let filamentPrice = 0.05; // currency units per gram
  export let filamentType = 'PLA'; // 'ABS' or 'PLA'
  export let volumetricE = false; // Volumetric E-axis

  const dispatch = createEventDispatcher();

  function handleChange() {
    dispatch('optionsChange', {
      filamentDiameter: Number(filamentDiameter), // Ensure numbers are numbers
      nozzleDiameter: Number(nozzleDiameter),
      hourlyCost: Number(hourlyCost),
      filamentPrice: Number(filamentPrice),
      filamentType,
      volumetricE
    });
  }
  
  let initialLoad = true;
  afterUpdate(() => {
    if (!initialLoad) {
        handleChange();
    }
    initialLoad = false;
  });

</script>

<div class="options-card">
  <h4>Printer & Filament Options</h4>
  <div class="option-group">
    <label for="filamentDiaInput">Filament Diameter (mm):</label>
    <input id="filamentDiaInput" type="number" step="0.01" bind:value={filamentDiameter}>
  </div>
  <div class="option-group">
    <label for="nozzleDiaInput">Nozzle Diameter (mm):</label>
    <input id="nozzleDiaInput" type="number" step="0.01" bind:value={nozzleDiameter}>
  </div>
  <div class="option-group">
    <label for="hourlyCostInput">Hourly Machine Cost (e.g., USD):</label>
    <input id="hourlyCostInput" type="number" step="0.01" bind:value={hourlyCost}>
  </div>
  <div class="option-group">
    <label for="filamentPriceInput">Filament Price (e.g., USD per gram):</label>
    <input id="filamentPriceInput" type="number" step="0.001" bind:value={filamentPrice}>
  </div>

  <div class="option-group filament-type-group">
    <h5>Filament Type:</h5>
    <label>
      <input type="radio" name="filamentType" value="PLA" bind:group={filamentType}> PLA
    </label>
    <label>
      <input type="radio" name="filamentType" value="ABS" bind:group={filamentType}> ABS
    </label>
    <!-- Add more types if necessary -->
  </div>
  
  <div class="option-group">
    <label>
      <input type="checkbox" bind:checked={volumetricE}> Use Volumetric E values
    </label>
    <small>If your GCode uses volumetric extrusion (e.g., G20/G21 for units, M200 D<diameter> T<tool> for volumetric mode, or firmware handles it).</small>
  </div>
</div>

<style>
  .options-card {
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 15px;
    background-color: #f9f9f9;
    font-size: 0.9em;
  }
  .options-card h4 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #333;
    font-size: 1.1em;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
  }
  .option-group {
    margin-bottom: 12px;
  }
  .option-group label {
    display: block;
    margin-bottom: 5px; /* Space between label and input/radio group */
    color: #555;
    font-weight: 500;
  }
  .option-group input[type="number"],
  .option-group input[type="text"] { /* If you add text inputs */
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
    font-size: 1em;
  }
  .option-group input[type="checkbox"],
  .option-group input[type="radio"] {
    margin-right: 6px;
    vertical-align: middle;
  }
  .filament-type-group h5 {
    margin-bottom: 8px;
    font-weight: bold;
    color: #444;
  }
  .filament-type-group label {
    font-weight: normal; /* Radio labels are usually not bold */
    cursor: pointer;
    margin-right: 15px; /* Space out radio buttons */
    display: inline-block; /* Align radio buttons horizontally */
  }
  .option-group small {
      display: block;
      font-size: 0.9em;
      color: #666;
      margin-top: 4px;
  }
</style>
