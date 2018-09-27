module.exports = {
  mode: "spa",
  /*
  ** Headers of the page
  */
  head: {
    title: "nuxt-news",
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { hid: "description", name: "description", content: "Nuxt.js project" }
    ],
    link: [
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      {
        rel: "stylesheet",
        href:
          "//fonts.googleapis.com/css?family=Roboto:100,200,300,400,500,700,400italic|Material+Icons"
      }
    ]
  },
  /*
  ** Customize the progress bar color
  */
  loading: { color: "#448aff" },
  /*
  ** Build configuration
  */
  css: [
    { src: "vue-material/dist/vue-material.min.css", lang: "css" },
    { src: "~/assets/theme.scss", lang: "scss" } // include vue-material theme engine
  ],
  plugins: [
    { src: "~/plugins/vue-material" },
    { src: "~/plugins/axios" },
    { src: "~/plugins/firestore.js", ssr: false }
  ],
  modules: ["@nuxtjs/axios", "@nuxtjs/proxy"],
  axios: {
    credentials: true,
    proxy: true
  },
  proxy: {
    "/api/": {
      target: "https://newsapi.org/v2/",
      pathRewrite: { "^/api/": "" }
    },
    "/register/": {
      target:
        "https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=AIzaSyAk9S2j44Y0gVWGVwlXxqKy9KBec6CLXJE",
      pathRewrite: { "^/register/": "" }
    },
    "/login/": {
      target:
        "https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyAk9S2j44Y0gVWGVwlXxqKy9KBec6CLXJE",
      pathRewrite: { "^/login/": "" }
    }
  },
  env: {
    NEWS_API_KEY: "b23d1bda8d5d47ae9a2abd2db64039b6",
    AUTH_API_KEY: "AIzaSyAk9S2j44Y0gVWGVwlXxqKy9KBec6CLXJE"
  },
  router: {
    middleware: "check-auth"
  },
  build: {
    /*
    ** Run ESLint on save
    */
    // extend (config, { isDev, isClient }) {
    //   if (isDev && isClient) {
    //     config.module.rules.push({
    //       enforce: 'pre',
    //       test: /\.(js|vue)$/,
    //       loader: 'eslint-loader',
    //       exclude: /(node_modules)/
    //     })
    //   }
    // }
  }
};
