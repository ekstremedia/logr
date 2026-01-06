<script setup lang="ts">
import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";

const greetMsg = ref("");
const name = ref("");

async function greet() {
  greetMsg.value = await invoke("greet", { name: name.value });
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-surface-100 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="/logr.svg" class="w-8 h-8" alt="Logr logo" />
          <h1 class="text-xl font-semibold text-surface-900 dark:text-surface-100">Logr</h1>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-surface-500 dark:text-surface-400">v0.1.0</span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 p-6">
      <div class="max-w-2xl mx-auto">
        <div class="card p-6 text-center">
          <h2 class="text-2xl font-bold mb-4 text-surface-900 dark:text-surface-100">
            Welcome to Logr
          </h2>
          <p class="text-surface-600 dark:text-surface-400 mb-6">
            A modern, beautiful log tailing application.
          </p>

          <form class="flex gap-2 justify-center mb-4" @submit.prevent="greet">
            <input
              v-model="name"
              placeholder="Enter a name..."
              class="input w-64"
            />
            <button type="submit" class="btn-primary">
              Greet
            </button>
          </form>

          <p v-if="greetMsg" class="text-surface-700 dark:text-surface-300 animate-fade-in">
            {{ greetMsg }}
          </p>
        </div>

        <!-- Quick Actions -->
        <div class="mt-6 grid grid-cols-2 gap-4">
          <button class="card p-4 text-left hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
            <div class="text-lg font-medium text-surface-900 dark:text-surface-100">Add Log File</div>
            <p class="text-sm text-surface-500 dark:text-surface-400">Open a file to start tailing</p>
          </button>
          <button class="card p-4 text-left hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
            <div class="text-lg font-medium text-surface-900 dark:text-surface-100">Add Log Folder</div>
            <p class="text-sm text-surface-500 dark:text-surface-400">Watch a folder for log files</p>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>