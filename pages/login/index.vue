<template>
  <div class="md-layout md-alignment-center-center" style="height: 100vh">
    <md-card class="md-layout-item md-size-50">
      <md-card-header>
        <div class="md-title">Login</div>
      </md-card-header>

      <!-- Back Button -->
      <md-button @click="$router.go(-1)" class="md-fab md-fab-bottom-right md-fixed md-primary">
        <md-icon>arrow_back</md-icon>
      </md-button>

      <!-- Login Form -->
      <form @submit.prevent="validateUser">
        <md-card-content>
          <md-field md-clearable :class="getValidationClass('email')">
            <label for="email">Email</label>
            <md-input type="email" name="email" id="email" autocomplete="email" v-model="form.email" :disabled="loading" />
            <span class="md-error" v-if="!$v.form.email.required">The email is required</span>
            <span class="md-error" v-else-if="!$v.form.email.email">Invalid email</span>
          </md-field>

          <md-field :class="getValidationClass('password')">
            <label for="password">Password</label>
            <md-input type="password" name="password" id="password" autocomplete="password" v-model="form.password" :disabled="loading" />

            <span class="md-error" v-if="!$v.form.password.required">The password is required</span>
            <span class="md-error" v-else-if="!$v.form.password.minLength">Password too short</span>
            <span class="md-error" v-else-if="!$v.form.password.maxLength">Password too long</span>
          </md-field>
        </md-card-content>

        <md-card-actions>
          <md-button to="/register">Go to Register</md-button>
          <md-button type="submit" class="md-primary md-raised" :disabled="loading">Submit</md-button>
        </md-card-actions>

      </form>
      <md-snackbar :md-active.sync="isAuthenticated">{{form.email}} was successfully logged in!</md-snackbar>
    </md-card>
  </div>
</template>

<script>
import { validationMixin } from "vuelidate";
import {
  required,
  email,
  minLength,
  maxLength
} from "vuelidate/lib/validators";

export default {
  middleware: "authenticated",
  mixins: [validationMixin],
  data: () => ({
    form: {
      email: null,
      password: null
    }
  }),
  validations: {
    form: {
      email: {
        required,
        email
      },
      password: {
        required,
        minLength: minLength(6),
        maxLength: maxLength(20)
      }
    }
  },
  computed: {
    loading() {
      return this.$store.getters.loading;
    },
    isAuthenticated() {
      return this.$store.getters.isAuthenticated;
    }
  },
  watch: {
    isAuthenticated(value) {
      if (value !== null) {
        setTimeout(() => this.$router.push("/"), 2000);
      }
    }
  },
  methods: {
    async handleSubmit() {
      await this.$store.dispatch("authenticateUser", {
        action: "login",
        email: this.form.email,
        password: this.form.password,
        returnSecureToken: true
      });
    },
    getValidationClass(fieldName) {
      const field = this.$v.form[fieldName];

      if (field) {
        return {
          "md-invalid": field.$invalid && field.$dirty
        };
      }
    },
    validateUser() {
      this.$v.$touch();

      if (!this.$v.$invalid) {
        this.handleSubmit();
      }
    }
  }
};
</script>