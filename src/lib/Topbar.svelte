<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { menuVisible } from "../stores/stores";
  import MenuIcon from "../assets/menu.svg";
  import addIcon from "../assets/add.svg";
  const dispatch = createEventDispatcher();
  function newChat() {
    dispatch("new-chat");
  }
  export let conversation_title: string;
</script>

<div
  class="bg-secondary text-white/90 py-2 px-4 flex justify-between md:hidden"
>
  <button
    on:click={() => {
      menuVisible.set(true);
    }}
    class="text-lg font-medium"
  >
    <img class="icon-white w-8" alt="Menu" src={MenuIcon} />
  </button>
  <div class="text-lg font-medium pt-[3px] text-center overflow-hidden h-8">
    {conversation_title === "" ? "Conversation title" : conversation_title}
  </div>
  <button on:click={newChat} class="text-lg font-medium">
    <img class="icon-white w-8" alt="+" src={addIcon} />
  </button>
</div>
