import firebase from "firebase/app";
import "firebase/firestore";

if (!firebase.apps.length) {
  const config = {
    apiKey: "AIzaSyAk9S2j44Y0gVWGVwlXxqKy9KBec6CLXJE",
    authDomain: "nuxt-news-aggregate.firebaseapp.com",
    databaseURL: "https://nuxt-news-aggregate.firebaseio.com",
    projectId: "nuxt-news-aggregate",
    storageBucket: "nuxt-news-aggregate.appspot.com",
    messagingSenderId: "985972445929"
  };
  firebase.initializeApp(config);
  firebase.firestore().settings({
    timestampsInSnapshots: true
  });
}

const db = firebase.firestore();

export default db;
