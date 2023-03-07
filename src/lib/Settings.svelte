<script lang="ts">
  import { writable } from "svelte/store";
  import {
    apiKey,
    settingsVisible,
    combinedTokens,
    defaultAssistantRole,
    type DefaultAssistantRole,
  } from "../stores/stores";
  let apiTextField = $apiKey === null ? "" : $apiKey;
  let assistantRoleField = $defaultAssistantRole.role;
  let assistantRoleTypeField = $defaultAssistantRole.type;
  import CloseIcon from "../assets/close.svg";

  function clearTokens() {
    combinedTokens.set(0);
  }
  function handleSave() {
    defaultAssistantRole.set({
      role: assistantRoleField,
      type: assistantRoleTypeField,
    });
    apiKey.set(apiTextField);
  }
  function handleClose() {
    settingsVisible.set(false);
  }
</script>

<!-- Settings.svelte -->
<div class="fixed z-10 inset-0  overflow-y-auto animate-fade-in">
  <div class="flex items-center  justify-center min-h-screen">
    <div class="bg-primary text-white rounded-lg shadow-xl p-8 relative">
      <button
        class="absolute top-0 right-0 mt-2 mr-2 text-gray-500 hover:text-gray-600"
        on:click={handleClose}
      >
        <img class="icon-white w-8" alt="Close" src={CloseIcon} />
      </button>
      <h2 class="text-xl font-bold mb-4">Settings</h2>
      <div class="mb-4">
        <label for="api-key" class="block font-medium mb-2">API Key</label>
        <input
          type="password"
          id="api-key"
          name="api-key"
          class="border text-black border-gray-300 p-2 rounded w-full"
          bind:value={apiTextField}
        />
      </div>
      <div class="mb-4">
        <label for="api-key" class="block font-medium mb-2"
          >Default Assistant role</label
        >
        <input
          class="border text-black border-gray-300 p-2 rounded w-full"
          bind:value={assistantRoleField}
        />
        <select
          bind:value={assistantRoleTypeField}
          class="max-w-[86px] text-black bg-white my-2 p-2 rounded focus:outline-none focus:bg-white "
        >
          <option value="system">System</option>
          <option value="user">User</option>
        </select>
      </div>
      <div class="mb-4 flex justify-between items-center ">
        <p class="block font-bold">
          Tokens spent: {$combinedTokens.toFixed(0)} | {(
            ($combinedTokens / 1000) *
            0.002
          ).toFixed(4)} $
        </p>
        <button
          on:click={clearTokens}
          class="bg-warning hover:bg-warningHover transition-colors duration-200 text-white ml-10 w-5 h-5 flex align-middle justify-center rounded"
          style="font-size: 1rem"
        >
          <img class="icon-white w-3" alt="Close" src={CloseIcon} />
        </button>
      </div>
      <button
        class="bg-good hover:bg-good2 transition-colors duration-200 text-white py-2 px-4 rounded"
        on:click={handleSave}>Save</button
      >
    </div>
  </div>
</div>

<style>
  /* Set the background to semi-transparent black */
  .fixed {
    background-color: rgba(0, 0, 0, 0.4);
  }

  /* Center the settings window horizontally and vertically */
  .min-h-screen {
    min-height: calc(100vh - 4rem);
  }

  /* Adjust the width of the settings window */
  .bg-white {
    width: 24rem;
  }

  /* Add some padding to the text input */
  .border {
    padding: 0.5rem;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .animate-fade-in {
    animation-name: fadeIn;
    animation-duration: 0.2s;
    animation-fill-mode: forwards;
  }
</style>
