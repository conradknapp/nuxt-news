import Vuex from "vuex";
import md5 from "md5";
import slugify from "slugify";
import db from "~/plugins/firestore";
import { saveUserData, clearUserData } from "~/utils";
import defaultImage from "~/assets/default-image.png";

const createStore = () => {
  return new Vuex.Store({
    state: {
      headlines: [],
      headline: null,
      loading: false,
      token: null,
      user: null,
      feed: [],
      country: "us",
      category: "",
      source: ""
    },
    mutations: {
      setHeadlines(state, headlines) {
        state.headlines = headlines;
      },
      setHeadline(state, headline) {
        state.headline = headline;
      },
      setLoading(state, loading) {
        state.loading = loading;
      },
      setToken(state, token) {
        state.token = token;
      },
      setUser(state, user) {
        state.user = user;
      },
      setFeed(state, feed) {
        state.feed = feed;
      },
      setCountry(state, country) {
        state.country = country;
      },
      setCategory(state, category) {
        state.category = category;
      },
      setSource(state, source) {
        state.source = source;
      },
      clearToken: state => (state.token = null),
      clearUser: state => (state.user = null),
      clearFeed: state => (state.feed = [])
    },
    actions: {
      async loadHeadlines({ commit }, newsUrl) {
        commit("setLoading", true);
        const { articles } = await this.$axios.$get(newsUrl);
        commit("setLoading", false);
        const headlines = articles.map(article => {
          const slug = slugify(article.title, {
            replacement: "-",
            remove: /[*+~.()'"!:@?%/]/g,
            lower: true
          });
          if (!article.urlToImage) {
            article.urlToImage = defaultImage;
          }
          return { ...article, slug };
        });
        commit("setHeadlines", headlines);
      },
      async loadHeadline({ commit }, payload) {
        const headlineRef = db.collection("headlines").doc(payload);
        const commentsRef = db
          .collection(`headlines/${payload}/comments`)
          .orderBy("likes", "desc");

        let loadedHeadline = {};
        await headlineRef.get().then(async doc => {
          if (doc.exists) {
            loadedHeadline = doc.data();

            await commentsRef.get().then(querySnapshot => {
              if (querySnapshot.empty) {
                commit("setHeadline", loadedHeadline);
              }
              let loadedComments = [];
              querySnapshot.forEach(doc => {
                loadedComments.push(doc.data());
                loadedHeadline["comments"] = loadedComments;
                commit("setHeadline", loadedHeadline);
              });
            });
          }
        });
      },
      async loadUserFeed({ state, commit }) {
        if (state.user) {
          const feedRef = db.collection(`users/${state.user.email}/feed`);

          await feedRef.onSnapshot(querySnapshot => {
            let headlines = [];
            querySnapshot.forEach(doc => {
              headlines.push(doc.data());
              commit("setFeed", headlines);
            });
          });
        }
      },
      async addHeadlineToFeed({ state }, payload) {
        const feedRef = db.collection(`users/${state.user.email}/feed`);

        await feedRef.doc(payload.title).set(payload);
      },
      async removeHeadlineFromFeed({ state }, payload) {
        const headlineRef = db
          .collection(`users/${state.user.email}/feed`)
          .doc(payload);

        await headlineRef.delete();
      },
      async saveHeadline(context, payload) {
        const headlineRef = db.collection(`headlines`).doc(payload.slug);

        let headlineId;
        await headlineRef.get().then(doc => {
          if (doc.exists) {
            headlineId = doc.id;
          }
        });

        if (!headlineId) {
          await headlineRef.set(payload);
        }
      },
      async sendComment({ state, commit }, payload) {
        const commentsRef = db.collection(
          `headlines/${state.headline.slug}/comments`
        );

        commit("setLoading", true);
        // Add comment
        await commentsRef.doc(payload.id).set(payload);

        // Order comments by likes (in descending order), listen for changes and then update headline
        await commentsRef
          .orderBy("likes", "desc")
          .get()
          .then(querySnapshot => {
            let comments = [];
            querySnapshot.forEach(doc => {
              comments.push(doc.data());
              const updatedHeadline = { ...state.headline, comments };
              commit("setHeadline", updatedHeadline);
            });
          });
        commit("setLoading", false);
      },
      async likeComment({ state, commit }, payload) {
        const commentsRef = db
          .collection(`headlines/${state.headline.slug}/comments`)
          .orderBy("likes", "desc");
        const likedCommentRef = db
          .collection(`headlines`)
          .doc(state.headline.slug)
          .collection("comments")
          .doc(payload);

        await likedCommentRef.get().then(doc => {
          if (doc.exists) {
            const prevLikes = doc.data().likes;
            const currentLikes = prevLikes + 1;
            likedCommentRef.update({
              likes: currentLikes
            });
          }
        });

        await commentsRef.onSnapshot(querySnapshot => {
          let loadedComments = [];
          querySnapshot.forEach(doc => {
            loadedComments.push(doc.data());
            const updatedHeadline = { ...state.headline, comments: loadedComments };
            commit("setHeadline", updatedHeadline);
          });
        });
      },
      async authenticateUser({ commit }, payload) {
        try {
          commit("setLoading", true);
          const userData = await this.$axios.$post(`/${payload.action}/`, {
            email: payload.email,
            password: payload.password,
            returnSecureToken: true
          });
          const avatar = `http://gravatar.com/avatar/${md5(
            userData.email
          )}?d=identicon`;
          const user = { email: payload.email, avatar };
          commit("setLoading", false);
          commit("setUser", user);
          commit("setToken", userData.idToken);
          saveUserData(userData, user);
        } catch (err) {
          commit("setLoading", false);
          console.error(err);
        }
      },
      logoutUser({ commit }) {
        commit("clearToken");
        commit("clearUser");
        commit("clearFeed");
        clearUserData();
      },
      setLogoutTimer({ dispatch }, payload) {
        setTimeout(() => dispatch("logoutUser"), payload);
      }
    },
    getters: {
      headlines: state => state.headlines,
      headline: state => state.headline,
      loading: state => state.loading,
      isAuthenticated: state => !!state.token,
      user: state => state.user,
      feed: state => state.feed,
      country: state => state.country,
      category: state => state.category,
      source: state => state.source
    }
  });
};

export default createStore;
