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
      <md-button class="md-primary" @click="active = true">Search</md-button>

      <md-dialog-prompt :md-active.sync="active" v-model="value" md-content="<md-progress-spinner></md-progress-spinner>" md-title="Find a headline" md-input-maxlength="25" md-input-placeholder="Search articles" md-confirm-text="Submit" @md-confirm="searchHeadlines" />

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
  ],
  data: () => ({
    active: false,
    value: ""
  }),
  methods: {
    async searchHeadlines() {
      await this.$store.dispatch(
        "loadHeadlines",
        `/api/everything?q=${this.value}`
      );
    }
  }
};
</script>