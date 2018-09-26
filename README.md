- `sudo npm install -g @vue/cli @vue/cli-init` to install vue cli in order to init nuxt project
- To create our project, we’ll use the starter template for next with `vue init vuematerial/nuxtjs nuxt-news`
- Full list of starter templates here: https://github.com/nuxt-community/awesome-nuxt#starter-template
- Accept defaults for project and run `cd nuxt-news && npm install, code .`

- Register for API key from newsapi.org/register
- b23d1bda8d5d47ae9a2abd2db64039b6
- Install axios module `@nuxtjs/axios`, put '@nuxtjs/axios' in modules array
- Add axios setup in nuxt.config.js and add following:

```
axios: {
    credentials: true,
  },
```

- Then add axios plugin file, where you put the authorization header from the API onto every request, and reference the plugin in a plugins array in nuxt.config.js (~/plugins/axios):

```
export default function({ $axios }) {
  $axios.onRequest(config => {
    config.headers.common["Authorization"] =
      "Bearer APIKEY";
  });
}
```

- Use asyncData and display the top headlines:

```
<template>
  <div>
    <ul v-for="headline in headlines" :key="headline.id">
      <li>{{headline}}</li>
    </ul>
  </div>
</template>

<script>
export default {
  async asyncData({ app }) {
    const topHeadlines = await app.$axios.$get("/top-headlines?country=us");
    return { headlines: topHeadlines.articles };
  }
};
</script>
```

- Go from showing how to get data in a given file with asyncData to creating your store and using nuxtServerInit, creating a store and using mapState, and for the time being, show the top headlines
- Then move on to exporting all your markup to a different file, then import it in index.vue as a component, change nuxtServerInit to an action, use the fetch method to dispatch that action and make a number of different pages for each of the different headlines

- Setup Firestore by creating new Firebase project, grab the info for web app integration and put it within firebase.js file
- Create proxy for Firebase database, first install proxy module for nuxt (@nuxtjs/proxy), add it to the modules array (as @nuxtjs/proxy), (set `proxy: true` in axios object in nuxt.config.js), add proxy object in nuxt.config.js

```
proxy: {
    '/api/': 'https://nuxt-newz.firebaseio.com/'
  }
```

NOTE: asyncData -> nuxtServerInit within store, fetch using separate action

- Enable Sign in/up with email Provider
- Create register, login pages
- Create register form
- Execute first action (registerUser), create Vuex store, create setLoading and setRegistered mutations, pass computed values back to register component
- Create token state and setToken mutation, then create middleware
- Create auth middleware that first redirects to the home page if user is authenticated (by first setting token, converting it to boolean to get isAuthenticated value and then checking in middleware with getters)
- Set the token in Cookies (install js-cookie) and in LocalStorage, to create check-auth middleware. Put both token and expiresIn values in LS/Cookies. Have check-auth middleware take then out and execute setUser mutation to update user data. Kick user out when token expires. Make this middleware global by putting it in the router by adding router object to nuxt.config.js

```
  router: {
    middleware: 'check-auth'
  }
```

- Add side panel
- Add Firestore as a plugin and include it in the plugins array in nuxt.config.js
- Populate feed initially by using the getSnapshot method, then use onSnapshot for live updates
  i.e. from

```
 loadUserFeed({ state, commit }) {
        db.collection(`accounts/${state.user}/feed`)
          .get()
          .then(function(querySnapshot) {
            let headlines = [];
            querySnapshot.forEach(function(doc) {
              headlines.push(doc.data());
              commit("setFeed", headlines);
            });
          });
      },
```

to:

```
 loadUserFeed({ state, commit }) {
        db.collection(`accounts/${state.user}/feed`).onSnapshot(
          querySnapshot => {
            let headlines = [];
            querySnapshot.forEach(doc => {
              headlines.push(doc.data());
              commit("setFeed", headlines);
            });
          }
        );
      },
```

NOTE: Because of webpack 4 in Nuxt 2, the vendor array in the build object is removed for optimization. We no longer need to include packages there in order to remove them from our final bundle

When we add comments, we are going to change loadHeadline from this:

```
  async loadHeadline({ commit }, payload) {
        const ref = db.collection("headlines").doc(payload);

        await ref.get().then(doc => {
          if (doc.exists) {
            commit("setHeadline", doc.data());
          }
        });
      },
```

to this:

```
  async loadHeadline({ commit }, payload) {
        const headlineRef = db.collection("headlines").doc(payload);
        const commentsRef = db.collection(`headlines/${payload}/comments`);

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
```

We can listen for new likes to our comments by changing likeComment to so:

```
async likeComment({ state, commit }, payload) {
        const commentRef = db.collection(`headlines`).doc(state.headline.slug).collection('comments').doc(payload);

        await commentRef.get().then(doc => {
          if (doc.exists) {
              const prevLikes = doc.data().likes || 0;
              const currentLikes = prevLikes + 1;
              commentRef.update({
                "likes": currentLikes
              });
          }
        });
      },
```

to this:

```
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
              const prevLikes = doc.data().likes || 0;
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
```