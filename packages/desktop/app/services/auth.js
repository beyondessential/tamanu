const shortid = require('shortid');
const { isArray } = require('lodash');
const { to } = require('await-to-js');

class Auth {
  constructor() {
    this.clientId = localStorage.getItem('clientId');
    this.clientSecret = localStorage.getItem('clientSecret');
    this.userId = localStorage.getItem('userId');
    this.abilities = localStorage.getItem('abilities');
    this.initClient();
  }

  initClient() {
    if (this.clientId === null) {
      const clientId = localStorage.getItem('clientId');
      if (!clientId) {
        this.clientId = shortid.generate();
        localStorage.setItem('clientId', this.clientId);
      }
    }
  }

  isLoggedIn() {
    return (this.clientId && this.clientSecret && this.user !== null);
  }

  async verifyToken() {
    try {
      let res = await fetch(`${process.env.HOST}/auth/verify-credentials`, {
        method: 'POST',
        body: {
          clientId: this.clientId,
          clientSecret: this.clientSecret
        }
      });

      if (res.ok) {
        res = res.json();
        console.log('-verifyToken-', res);
      }

      return Promise.reject(new Error("invalid token"));
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async login({ email, password }) {
    try {
      let res = await fetch(`${process.env.HOST}/auth/login`, {
        method: 'POST',
        body: { clientId: this.clientId, email, password }
      });
      res = await res.json();

      if (res.error) {
        let { error } = res;
        if (isArray(error)) error = error.join("\n");
        return Promise.reject(new Error(error));
      }

      this.user = res;
      return true;
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

module.exports = Auth;
