import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

import 'parse/dist/parse.min.js';

class ParseAuth extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: none;
        }
      </style>
    `;
  }

  static get properties() {
    return {
      app: {
        type: Object
      },
      authenticated: {
        type: Boolean,
        value: false,
        notify: true,
        readOnly: true
      }
    };
  }

  static get observers() {
    return [
      '__isCurrentUserKnown(app)'
    ]
  }

  constructor() {
    super();

    this._loginListener = this.__handleLoginEvent.bind(this);
    this._logoutListener = this.__handleLogoutEvent.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();

    window.addEventListener('login-event', this._loginListener);
    window.addEventListener('logout-event', this._logoutListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    window.removeEventListener('login-event', this._loginListener);
    window.removeEventListener('logout-event', this._logoutListener);
  }

  __isCurrentUserKnown() {

    if (Parse.User.current()) {
      // Note: No invalid session handling here: https://docs.parseplatform.org/js/guide/#handling-invalid-session-token-error
      //       Every request must be able to handle session invalid state anyway.
      // reflect and notify authentication state
      this._setAuthenticated(true);
      this.dispatchEvent(new CustomEvent('user-authenticated', { bubbles: true, composed: true }));
    }
  }

  __handleLoginEvent(event) {
    this.__login(event.detail.username, event.detail.password);
  }

  __login(username, password) {

    var self = this;
    Parse.User.logIn(username, password)
      .then(function (user) {
        // notify listeners about authentication state and set corrensponding attribute value
        self._setAuthenticated(true);
        self.dispatchEvent(new CustomEvent('user-authenticated', { bubbles: true, composed: true }));
        console.info("Login successful.", user);
      }, function (error) {
        // notify listeners about authentication failure and set corrensponding attribute value
        self._setAuthenticated(false);
        self.dispatchEvent(new CustomEvent('login-failed', { bubbles: true, composed: true }));
        console.error("Login failed.", error);
      });
  }

  __handleLogoutEvent() {
    this.__logout();
  }

  __logout() {

    // invalidate user at client site
    try {
      Parse.User.logOut();
    } catch (error) {
      // catch raising server errors while server doen'T accept session anymore
      console.error(error);
    }
    // switch authentication attribute
    this._setAuthenticated(false);
  }
}

window.customElements.define('parse-auth', ParseAuth);