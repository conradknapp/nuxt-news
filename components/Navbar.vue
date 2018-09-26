<template>
  <md-toolbar style="position: fixed; top: 0; z-index: 5;" elevation="1">
    <md-button class="md-icon-button" @click="$emit('update:showNavigation', true)">
      <md-icon>menu</md-icon>
    </md-button>
    <span to='/' class="md-title">NuxtNews</span>

    <div class="md-toolbar-section-end">
      <template v-if="isAuthenticated">
        <md-button>
          <md-avatar>
            <img :src="user.avatar" :alt="user.email">
          </md-avatar>
          {{user.email}}
        </md-button>
        <md-button @click="logoutUser">
          Logout
        </md-button>
      </template>

      <template v-else>
        <md-button to="/login">
          Login
        </md-button>
        <md-button to="/register">
          Register
        </md-button>
      </template>

      <md-button @click="$emit('update:showSidepanel', true)" class="md-accent">Categories</md-button>
    </div>
  </md-toolbar>

</template>

<script>
export default {
  props: [
    "showSidepanel",
    "showNavigation",
    "logoutUser",
    "user",
    "isAuthenticated"
  ]
};
</script>