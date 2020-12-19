/*\
title: $:/plugins/OokTech/Login/login-widget.js
type: application/javascript
module-type: widget

A widget that creates a login interface for a restful server.

\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

const Widget = require("$:/core/modules/widgets/widget.js").widget;
let widgets;
let container;

const Login = function(parseTreeNode,options) {
  this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
Login.prototype = new Widget();

/*
Render this widget into the DOM
*/
Login.prototype.render = function(parent,nextSibling) {
  this.parentDomNode = parent;
  this.computeAttributes();
  this.execute();

  const self = this;

  const domNode = this.document.createElement("div");
  domNode.setAttribute('id', 'logindiv')
  domNode.className='loginclass'
  const statusDiv = this.document.createElement('div')
  statusDiv.setAttribute('id', 'statusdiv')
  domNode.appendChild(statusDiv)
  const urlDiv = this.document.createElement('div')
  domNode.appendChild(urlDiv)
  urlDiv.innerHTML = 'on ' + this.url
  const userSpan = this.document.createElement('div');
  userSpan.appendChild(this.document.createTextNode('Name:'))
  const userNode = this.document.createElement("input")
  userNode.setAttribute('type', 'text')
  userNode.setAttribute('id', 'usertext')
  userSpan.setAttribute('id', 'user')
  userSpan.appendChild(userNode)
  const passSpan = this.document.createElement('div');
  passSpan.appendChild(this.document.createTextNode('Password:'));
  const passNode = this.document.createElement("input");
  passNode.setAttribute('type', 'password');
  passNode.setAttribute('id', 'pwdtext');
  passSpan.appendChild(passNode);
  passSpan.setAttribute('id', 'pwd');
  domNode.appendChild(userSpan);
  domNode.appendChild(passSpan);
  const loginbutton = this.document.createElement('input');
  loginbutton.setAttribute('type', 'button');
  loginbutton.setAttribute('value', 'Login');
  loginbutton.setAttribute('id', 'loginbutton');
  loginbutton.addEventListener('click', function (event) {self.login();});
  domNode.appendChild(loginbutton);
  const logoutbutton = this.document.createElement('input');
  logoutbutton.setAttribute('type', 'button');
  logoutbutton.setAttribute('value', 'Logout');
  logoutbutton.setAttribute('id', 'logoutbutton');
  logoutbutton.addEventListener('click', function (event) {self.logout();});
  domNode.appendChild(logoutbutton);

  let guest = false;
  if (this.guestLogin === 'yes') {
    guest = this.document.createElement('input');
    guest.setAttribute('type', 'button');
    guest.setAttribute('value', 'Login as Guest');
    guest.setAttribute('id', 'guestLoginButton');
    guest.addEventListener('click', function (event) {self.loginGuest();});
    domNode.appendChild(this.document.createElement('br'));
    domNode.appendChild(guest);
  }

  const loginState = this.getLoginState();
  if (loginState) {
    $tw.wiki.setText('$:/state/OokTech/Login', 'text', null, 'true');
    if (this.guestLogin === 'yes') {
      guest.disabled = true;
    }
    passNode.disabled = true;
    userNode.disabled = true;
    statusDiv.innerHTML =  'Logged in as ' + this.name;
    loginbutton.disabled = true;
    logoutbutton.disabled = false;
    domNode.classList.add('loggedin');
    domNode.classList.remove('loggedout');
  } else {
    if (this.guestLogin === 'yes') {
      guest.disabled = false;
    }
    passNode.disabled = false;
    userNode.disabled = false;
    statusDiv.innerHTML =  'Logged Out'
    loginbutton.disabled = false;
    logoutbutton.disabled = true;
    domNode.classList.remove('loggedin');
    domNode.classList.add('loggedout');
  }

  parent.insertBefore(domNode,nextSibling);
  this.renderChildren(domNode,null);
  this.domNodes.push(domNode);
};

/*
Compute the internal state of the widget
*/
Login.prototype.execute = function() {
  //Get widget attributes.
  this.url = this.getAttribute('url', '/authenticate');
  this.saveCookie = this.getAttribute('saveCookie', 'yes');
  this.cookieName = this.getAttribute('cookieName', 'token');
  this.localstorageKey = this.getAttribute('localstorageKey', 'ws-token');
  this.guestLogin = this.getAttribute('guestLogin', 'no');
  this.bobLogin = this.getAttribute('bobLogin', 'true')
  this.token = localStorage.getItem(this.localstorageKey);
  this.name = undefined;
  this.loggedin = false;
  if (!this.previousCheck) {
    this.previousCheck = Date.now()
  }
  if (this.token) {
    try {
      this.name = JSON.parse(window.atob(this.token.split('.')[1])).name;
      this.expires = JSON.parse(window.atob(this.token.split('.')[1])).exp;
      if (this.expires*1000 > Date.now()) {
        this.loggedin = true;
        const self = this;
        this.timeout = setTimeout(function(){self.refreshSelf()}, this.expires*1000 - Date.now() + 100);
      }
    } catch (e) {

    }
  }
};

/*
  This does the normal login but it supplies the username and password 'Guest'
  to allow one-click guest logins.
*/
Login.prototype.loginGuest = function () {
  document.getElementById('usertext').value = 'Guest';
  document.getElementById('pwdtext').value = 'Guest';
  this.login();
}

/*
  This sends a POST with the name and password.
  If it gets a response than it stores the reply token in a cookie and
  localstorage
*/
Login.prototype.login = function() {
  const self = this;
  // We can only do this if the destination is https. So either we are on an
  // https server and it is local (the url doesn't start with http) or we are
  // sending to an https url
  if ((window.location.protocol === 'https:' && (self.url.startsWith('https://') || !self.url.startsWith('http'))) || self.url.startsWith('https://')) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', self.url, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onload = function () {
      // do something to response
      if (this.responseText && this.status == "200") {
        const expires = new Date();
        expires.setTime(expires.getTime() + 24*60*60*1000);
        localStorage.setItem(self.localstorageKey, this.responseText);
        localStorage.setItem('token-eol', expires.getTime());
        self.token = this.responseText;
        self.expires = JSON.parse(window.atob(self.token.split('.')[1])).exp;
        if (self.saveCookie === 'yes' || self.saveCookie === true || self.saveCookie === 'true') {
          document.cookie = self.cookieName + '=' + this.responseText + '; expires=' + expires + '; path=/;'
          document.cookie = 'token-eol' + '=' + expires.getTime() +'; path=/;'
        }
        self.setLoggedIn()
        // take care of the Bob login things, if they exist
        if (typeof this.bobLogin !== 'string') {
          this.bobLogin = '';
        }
        if ($tw.Bob && self.bobLogin.toLowerCase() === 'true') {
          if (typeof $tw.Bob.getSettings === 'function') {
            $tw.Bob.getSettings();
          }
          $tw.connections[0].socket.send(JSON.stringify({
            type: 'setLoggedIn',
            token: self.token,
            heartbeat: true,
            wiki: $tw.wikiName
          }));
        }
      } else {
        self.setLoggedOut();
      }
    }
    const name = document.getElementById('usertext').value;
    const password = document.getElementById('pwdtext').value;
    xhr.send(`name=${name}&pwd=${password}`);
  }
}

Login.prototype.getLoginState = function () {
  if (this.token) {
    if (this.expires * 1000 > Date.now()) {
      return "true";
    } else {
      return "false";
    }
  }
}

function getCookie(name) {
  let value = " " + document.cookie;
  let start = value.indexOf(" " + name + "=");
  if (start == -1) {
    value = null;
  } else {
    start = value.indexOf("=", start) + 1;
    let end = value.indexOf(";", start);
    if (end == -1) {
      end = value.length;
    }
    value = unescape(value.substring(start,end));
  }
  return value;
}

Login.prototype.getLoginState = function () {
  const token = localStorage.getItem(this.localstorageKey)
  let exp = 0;
  if (token) {
    try {
      exp = JSON.parse(atob(token.split('.')[1])).exp*1000;
    } catch (e) {
      // nothing here, if there is no cookie or it isn't what we want than just
      // do nothign.
    }
  }
  return (exp > Date.now());
}

Login.prototype.setLoggedIn = function () {
  // $:/state/OokTech/Login -> true
  this.loggedin = true;
  $tw.wiki.setText('$:/state/OokTech/Login', 'text', null, 'true');
  this.refreshSelf();
  console.log('Yay!!');
}

Login.prototype.setLoggedOut = function () {
  // $:/state/OokTech/Login -> false
  this.loggedin = false;
  $tw.wiki.setText('$:/state/OokTech/Login', 'text', null, 'false');
  this.refreshSelf();
  console.log('Boo!');
}

/*
  This removes the token from the cookie and local storage.
*/
Login.prototype.logout = function () {
  localStorage.removeItem(this.localstorageKey);
  document.cookie = this.cookieName + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  if ($tw.Bob && typeof $tw.Bob.getSettings === 'function') {
    $tw.Bob.getSettings();
  }
  this.setLoggedOut();
}

/*
Refresh the widget by ensuring our attributes are up to date
*/
Login.prototype.refresh = function(changedTiddlers) {
  const changedAttributes = this.computeAttributes();
  if(Object.keys(changedAttributes).length > 0 || (this.loggedin && ((this.expires * 1000 < Date.now()) || !this.expires)) || this.previousCheck + 1000 < Date.now()) {
    this.previousCheck = Date.now();
    this.refreshSelf();
    return true;
  }
  return this.refreshChildren(changedTiddlers);
};

exports["login-widget"] = Login;

})();
