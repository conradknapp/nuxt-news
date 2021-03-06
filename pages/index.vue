<template>
  <div class="md-layout md-alignment-center" style="margin: 4em 0">
    <!-- Top Navigation -->
    <navbar :showSidepanel.sync="showSidepanel" :showNavigation.sync="showNavigation" :isAuthenticated="isAuthenticated" :user="user" :logoutUser="logoutUser"></navbar>

    <!-- Personal News Feed (Left Drawer) -->
    <md-drawer md-fixed :md-active.sync="showNavigation">
      <md-toolbar md-elevation="1">
        <span class="md-title">Personal Feed</span>
      </md-toolbar>

      <md-progress-bar v-if="loading" md-mode="indeterminate"></md-progress-bar>

      <md-field>
        <label for="country">Country</label>
        <md-select @input="changeCountry" :value="country" name="country" id="country" md-dense>
          <md-option value="us">United States</md-option>
          <md-option value="ca">Canada</md-option>
          <md-option value="de">Germany</md-option>
          <md-option value="ru">Russia</md-option>
        </md-select>
      </md-field>

      <!-- Default Markup (if Feed Empty) -->
      <md-empty-state v-if="feed.length === 0 && !user" class="md-primary" md-icon="bookmarks" md-label="Nothing in Feed" md-description="Login to bookmark headlines">
        <md-button to="/login" class="md-primary md-raised">Login</md-button>
      </md-empty-state>

      <md-empty-state v-else-if="feed.length === 0" class="md-accent" md-icon="bookmark_outline" md-label="Nothing in Feed" md-description="Anything you bookmark will be safely stored here.">
      </md-empty-state>

      <!-- Feed Content (if Feed Not Empty) -->
      <md-list class="md-triple-line" v-else v-for="headline in feed" :key="headline.id">

        <md-list-item>
          <md-avatar>
            <img :src="headline.urlToImage" alt="People">
          </md-avatar>

            <div class="md-list-item-text">
              <span>
                <a :href="headline.url" target="_blank">{{headline.title}}</a>
              </span>
              <span>{{headline.source.name}}</span>
              <span @click="saveHeadline(headline)">View Comments</span>
            </div>

            <md-button @click="removeHeadlineFromFeed(headline.title)" class="md-icon-button md-list-action">
              <md-icon class="md-accent">delete</md-icon>
            </md-button>
        </md-list-item>
        <md-divider class="md-inset"></md-divider>

      </md-list>
    </md-drawer>

    <!-- News Options (Right Drawer) -->
    <md-drawer md-fixed :md-active.sync="showSidepanel" class="md-right">
      <md-toolbar :md-elevation="1">
        <span class="md-title">News Categories</span>
      </md-toolbar>

      <md-progress-bar v-if="loading" md-mode="indeterminate"></md-progress-bar>

      <md-list>
        <md-subheader class="md-primary">Categories</md-subheader>

        <md-list-item v-for="(newsCategory, i) in newsCategories" :key="i" @click="loadCategory(newsCategory.path)">
          <md-icon :class="newsCategory.path === category ? 'md-primary' : ''">{{newsCategory.icon}}</md-icon>
          <span class="md-list-item-text">{{newsCategory.name}}</span>
        </md-list-item>
      </md-list>
    </md-drawer>

    <!-- App Content -->
    <div class="md-layout-item md-size-95">
      <md-content style="background: #007998; padding: 1em" class="md-layout md-gutter">
        <ul v-for="headline in headlines" :key="headline.id" class="md-layout-item md-large-size-25 md-medium-size-33 md-small-size-50 md-xsmall-size-100">
          <md-card style="margin-top: 1em;" md-with-hover>
            <md-ripple>
              <md-card-media md-ratio="16:9">
                <img :src="headline.urlToImage" :alt="headline.title">
              </md-card-media>

                <md-card-header>
                  <div class="md-title">
                    <a :href="headline.url" target="_blank">{{headline.title}}</a>
                  </div>
                  <div @click="loadSource(headline.source.id)">
                    {{headline.source.name}}
                    <md-icon class="small-icon">book</md-icon>
                  </div>
                  <div class="md-subhead" v-if="headline.author">{{headline.author}}
                    <md-icon class="small-icon">face</md-icon>
                  </div>
                  <div class="md-subhead">
                    {{headline.publishedAt | publishedTimeToNow}}
                    <md-icon class="small-icon">alarm</md-icon>
                  </div>
                </md-card-header>

                <md-card-content>
                  {{headline.description}}
                </md-card-content>

                <md-card-actions>
                  <md-button @click="addHeadlineToFeed(headline)" class="md-icon-button" :class="isInFeed(headline.title)" :disabled="isButtonDisabled(headline.title)">
                    <md-icon class="md-primary">bookmark
                    </md-icon>
                  </md-button>
                  <md-button @click="saveHeadline(headline)" class="md-icon-button">
                    <md-icon>message</md-icon>
                  </md-button>
                </md-card-actions>
            </md-ripple>
          </md-card>
        </ul>
      </md-content>
    </div>
  </div>
</template>

<script>
import db from "~/plugins/firestore.js";
import Navbar from "~/components/Navbar";

export default {
  components: { Navbar },
  data: () => ({
    showNavigation: false,
    showSidepanel: false,
    newsCategories: [
      { name: "Top Headlines", path: "", icon: "today" },
      { name: "Technology", path: "technology", icon: "keyboard" },
      { name: "Business", path: "business", icon: "business_center" },
      { name: "Entertainment", path: "entertainment", icon: "weekend" },
      { name: "Health", path: "health", icon: "fastfood" },
      { name: "Science", path: "science", icon: "fingerprint" },
      { name: "Sports", path: "sports", icon: "golf_course" }
    ],
    sourceId: ""
  }),
  computed: {
    headlines() {
      return this.$store.getters.headlines;
    },
    isAuthenticated() {
      return this.$store.getters.isAuthenticated;
    },
    user() {
      return this.$store.getters.user;
    },
    feed() {
      return this.$store.getters.feed;
    },
    loading() {
      return this.$store.getters.loading;
    },
    country() {
      return this.$store.getters.country;
    },
    category() {
      return this.$store.getters.category;
    },
    source() {
      return this.$store.getters.source;
    }
  },
  async fetch({ store }) {
    await store.dispatch(
      "loadHeadlines",
      `/api/top-headlines?country=${store.state.country}&category=${
        store.state.category
      }`
    );
    await store.dispatch("loadUserFeed");
  },
  watch: {
    async country() {
      await this.$store.dispatch(
        "loadHeadlines",
        `/api/top-headlines?country=${this.country}&category=${this.category}`
      );
    }
  },
  methods: {
    async loadCategory(category) {
      this.$store.commit("setCategory", category);
      await this.$store.dispatch(
        "loadHeadlines",
        `/api/top-headlines?country=${this.country}&category=${this.category}`
      );
    },
    changeCountry(event) {
      this.$store.commit("setCountry", event);
    },
    async loadSource(sourceId) {
      if (sourceId) {
        this.$store.commit("setSource", sourceId);
        await this.$store.dispatch(
          "loadHeadlines",
          `/api/top-headlines?sources=${this.source}`
        );
      }
    },
    logoutUser() {
      this.$store.dispatch("logoutUser");
    },
    async addHeadlineToFeed(headline) {
      if (this.user) {
        await this.$store.dispatch("addHeadlineToFeed", headline);
      }
    },
    async removeHeadlineFromFeed(headline) {
      await this.$store.dispatch("removeHeadlineFromFeed", headline);
    },
    async saveHeadline(headline) {
      await this.$store.dispatch("saveHeadline", headline).then(() => {
        this.$router.push({ path: `/headlines/${headline.slug}` });
      });
    },
    isInFeed(title) {
      const inFeed =
        this.feed.findIndex(headline => headline.title === title) > -1;
      return inFeed ? "md-accent" : "";
    },
    isButtonDisabled(title) {
      return this.feed.findIndex(headline => headline.title === title) > -1;
    }
  }
};
</script>

<style scoped>
.small-icon {
  font-size: 18px !important;
}
</style>
