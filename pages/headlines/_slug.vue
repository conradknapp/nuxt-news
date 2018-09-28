<template>
  <div class="md-layout md-alignment-center" style="margin: 5em 0">

    <!-- Back Button -->
    <md-button @click="$router.go(-1)" class="md-fab md-fab-bottom-right md-fixed md-primary">
      <md-icon>arrow_back</md-icon>
    </md-button>

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

      <!-- Feed Headlines (if Feed Not Empty) -->
      <md-list class="md-triple-line" v-else v-for="headline in feed" :key="headline.id">

        <md-list-item>
          <md-avatar>
            <img :src="headline.urlToImage" :alt="headline.title">
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

    <div class="md-layout-item md-size-75 md-small-size-80 md-xsmall-size-100">
      <md-card>
        <md-card-media style="height: 300px;" md-ratio="16:9">
          <img :src="headline.urlToImage" :alt="headline.title">
        </md-card-media>

          <md-card-header>
            <div class="md-title">
              <a :href="headline.url" target="_blank">{{headline.title}}</a>
            </div>
            <div>
              {{headline.source.name}}
              <md-icon class="small-icon">book</md-icon>
            </div>
            <span class="md-subhead" v-if="headline.author">{{headline.author}}
              <md-icon class="small-icon">face</md-icon>
            </span>
          </md-card-header>

          <md-card-content>
            {{headline.content}}
          </md-card-content>

      </md-card>

      <!-- Comment Form -->
      <form @submit.prevent="sendComment">
        <md-field>
          <label>Enter your comment</label>
          <md-textarea :disabled="loading || !user" v-model="text"></md-textarea>
          <md-icon>description</md-icon>
        </md-field>
        <md-button :disabled="loading || !user" type="submit" class="md-primary md-raised">Send Comment</md-button>
      </form>

      <!-- Comments -->
      <md-list style="margin-top: 1em" class="md-triple-line">
        <md-list-item v-for="comment in headline.comments" :key="comment.id">
          <md-avatar>
            <img :src="comment.user.avatar" :alt="comment.text">
          </md-avatar>
            <div class="md-list-item-text">
              <span>{{comment.user.username}}</span>
              <span>{{comment.publishedAt | commentTimeToNow}}</span>
              <p>{{comment.text}}</p>
            </div>

            <md-badge class="md-primary" md-position="bottom" :md-content="comment.likes" />
            <md-button :disabled="loading || !user" @click="likeComment(comment.id)" class="md-icon-button">
              <md-icon>thumb_up</md-icon>
            </md-button>
        </md-list-item>
      </md-list>
    </div>
  </div>
</template>

<script>
import uuidv4 from "uuid/v4";
import db from "~/plugins/firestore";
import Navbar from "~/components/Navbar";

export default {
  components: { Navbar },
  data: () => ({
    text: "",
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
    ]
  }),
  watch: {
    async country() {
      await this.$store.dispatch(
        "loadHeadlines",
        `/api/top-headlines?country=${this.country}&category=${this.category}`
      );
    }
  },
  computed: {
    headline() {
      return this.$store.getters.headline;
    },
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
    }
  },
  async fetch({ store, params }) {
    await store.dispatch("loadHeadline", params.slug);
  },
  methods: {
    async sendComment() {
      const comment = {
        id: uuidv4(),
        text: this.text,
        user: this.getUserData(),
        publishedAt: Date.now(),
        likes: 0
      };
      await this.$store.dispatch("sendComment", comment);
      this.text = "";
    },
    async likeComment(commentId) {
      await this.$store.dispatch("likeComment", commentId);
    },
    async loadCategory(category) {
      this.$store.commit("setCategory", category);
      await this.$store.dispatch(
        "loadHeadlines",
        `/api/top-headlines?country=${this.country}&category=${this.category}`
      );
    },
    getUserData() {
      const newUser = { ...this.user };
      newUser["username"] = newUser["email"].split("@")[0];
      return newUser;
    },
    changeCountry(event) {
      this.$store.commit("setCountry", event);
    },
    logoutUser() {
      this.$store.dispatch("logoutUser");
    }
  }
};
</script>