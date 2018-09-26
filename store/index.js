import Vuex from "vuex";
import md5 from "md5";
import db from "~/plugins/firestore";
import slugify from "slugify";
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
      feed: []
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
            remove: /[*+~.()'"!:@?/]/g,
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
          .orderBy('likes', 'desc');
          // .orderBy("likes", "desc");

        let loadedHeadline = {};
        await headlineRef.get().then(async doc => {
          if (doc.exists) {
            loadedHeadline = doc.data();

            // await commentsRef.orderBy("likes", "desc");
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
          await db
            .collection(`users/${state.user.email}/feed`)
            .onSnapshot(querySnapshot => {
              let headlines = [];
              querySnapshot.forEach(doc => {
                headlines.push(doc.data());
                commit("setFeed", headlines);
              });
            });
        }
      },
      async addHeadlineToFeed({ state }, payload) {
        const ref = db.collection(`users/${state.user.email}/feed`);

        await ref.doc(payload.title).set(payload);
      },
      async removeHeadlineFromFeed({ state }, payload) {
        const ref = db.collection(`users/${state.user}/feed`).doc(payload);

        await ref.delete();
      },
      async saveHeadline(context, payload) {
        const ref = db.collection(`headlines`).doc(payload.slug);

        let id;
        await ref.get().then(doc => {
          if (doc.exists) {
            id = doc.id;
          }
        });

        if (!id) {
          await ref.set(payload);
        }
      },
      async sendComment({ state, commit }, payload) {
        const commentsRef = db.collection(
          `headlines/${state.headline.slug}/comments`
        )

        commit("setLoading", true);
        // Add comment
        await commentsRef.doc(payload.id).set(payload);

        // Order comments by likes (in descending order), listen for changes and then update headline
        await commentsRef.orderBy('likes', 'desc').get().then(querySnapshot => {
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
        const commentRef = db
          .collection(`headlines`)
          .doc(state.headline.slug)
          .collection("comments")
          .doc(payload);
        const commentsRef = db.collection(
          `headlines/${state.headline.slug}/comments`
        ).orderBy("likes", "desc");

        await commentRef.get().then(doc => {
          if (doc.exists) {
              const prevLikes = doc.data().likes;
              const currentLikes = prevLikes + 1;
              commentRef.update({
                "likes": currentLikes
              });
          }
        });

        await commentsRef.onSnapshot(querySnapshot => {
          let comments = [];
          querySnapshot.forEach(doc => {
            comments.push(doc.data());
            commit('setHeadline', { ...state.headline, comments });
          });
        })
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
      feed: state => state.feed
    }
  });
};

export default createStore;
