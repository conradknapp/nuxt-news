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
      <md-button class="md-primary" @click="showDialog = true">Search</md-button>

      <md-dialog :md-active.sync="showDialog">
        <md-dialog-title>Search Headlines</md-dialog-title>

        <div class="md-layout" style="padding: 1em">
          <md-field>
            <label>Search Term(s)</label>
            <md-input v-model="query" placeholder="Use quotes for exact matches, AND / OR / NOT for multiple terms" maxlength="30"></md-input>
          </md-field>
          <md-datepicker v-model="fromDate" md-immediately>
            <label>Select starting date (optional)</label>
          </md-datepicker>
          <md-datepicker v-model="toDate" md-immediately>
            <label>Select ending date (optional)</label>
          </md-datepicker>
          <md-field>
            <label for="sortBy">Sort search results by (optional)</label>
            <md-select v-model="sortBy" name="sortBy" id="sortBy" md-dense>
              <md-option value="publishedAt">Newest (default)</md-option>
              <md-option value="relevancy">Relevant</md-option>
              <md-option value="popularity">Popular</md-option>
            </md-select>
          </md-field>
        </div>

        <md-dialog-actions>
          <md-button class="md-accent" @click="showDialog = false">Cancel</md-button>
          <md-button class="md-primary" @click="searchHeadlines">Save</md-button>
        </md-dialog-actions>
      </md-dialog>

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
    showDialog: false,
    query: "",
    fromDate: "",
    toDate: "",
    sortBy: ""
  }),
  methods: {
    async searchHeadlines() {
      await this.$store.dispatch(
        "loadHeadlines",
        `/api/everything?q=${this.query}&from=${new Date(
          this.fromDate
        ).toISOString()}&to=${new Date(this.toDate).toISOString()}&sortBy=${
          this.sortBy
        }`
      );
      this.showDialog = false;
    }
  }
};
</script>