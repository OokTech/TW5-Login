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

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var widgets;
var container;

var Login = function(parseTreeNode,options) {
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

  var self = this;

	var domNode = this.document.createElement("div");
  domNode.setAttribute('id', 'logindiv')
  domNode.className='loginclass'
  var statusDiv = this.document.createElement('div')
  statusDiv.setAttribute('id', 'statusdiv')
  domNode.appendChild(statusDiv);
  var userSpan = this.document.createElement('div');
  userSpan.appendChild(this.document.createTextNode('Name:'))
  var userNode = this.document.createElement("input")
  userNode.setAttribute('type', 'text')
  userNode.setAttribute('id', 'usertext')
  userSpan.setAttribute('id', 'user');
  userSpan.appendChild(userNode);
  var passSpan = this.document.createElement('div');
  passSpan.appendChild(this.document.createTextNode('Password:'))
  var passNode = this.document.createElement("input")
  passNode.setAttribute('type', 'password')
  passNode.setAttribute('id', 'pwdtext')
  passSpan.appendChild(passNode);
  passSpan.setAttribute('id', 'pwd');
  domNode.appendChild(userSpan);
  domNode.appendChild(passSpan);
  var loginbutton = this.document.createElement('input')
  loginbutton.setAttribute('type', 'button')
  loginbutton.setAttribute('value', 'Login')
  loginbutton.setAttribute('id', 'loginbutton')
  loginbutton.addEventListener('click', function (event) {self.login();})
  domNode.appendChild(loginbutton)
  var logoutbutton = this.document.createElement('input')
  logoutbutton.setAttribute('type', 'button')
  logoutbutton.setAttribute('value', 'Logout')
  logoutbutton.setAttribute('id', 'logoutbutton')
  logoutbutton.addEventListener('click', function (event) {self.logout();})
  domNode.appendChild(logoutbutton)

  var loginState = this.wiki.getTiddlerText('$:/state/OokTech/Login');
  if (loginState === 'true' || this.name !== undefined) {
    passNode.disabled = true;
    userNode.disabled = true;
    statusDiv.innerHTML =  'Logged in as ' + this.name;
    loginbutton.disabled = true;
    logoutbutton.disabled = false;
    domNode.classList.add('loggedin')
    domNode.classList.remove('loggedout')
  } else {
    passNode.disabled = false;
    userNode.disabled = false;
    statusDiv.innerHTML =  'Logged Out'
    loginbutton.disabled = false;
    logoutbutton.disabled = true;
    domNode.classList.remove('loggedin')
    domNode.classList.add('loggedout')
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
	this.cookieName = this.getAttribute('cookieName', 'token');
  this.localstorageKey = this.getAttribute('localstorageKey', 'ws-token');
  var token = localStorage.getItem(this.localstorageKey);
  this.name = undefined;
  if (token) {
    this.name = JSON.parse(window.atob(token.split('.')[1])).name;
  }
};

/*
  This sends a POST with the name and password.
  If it gets a response than it stores the reply token in a cookie and
  localstorage
*/
Login.prototype.login = function() {
  var self = this;
  if (window.location.protocol === 'https:') {
    var xhr = new XMLHttpRequest()
    xhr.open('POST', self.url, true)
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
    xhr.onload = function () {
      // do something to response
      if (this.responseText && this.status == "200") {
        localStorage.setItem(self.localstorageKey, this.responseText)
        var expires = new Date();
        expires.setTime(expires.getTime() + 24*60*60*1000)
        document.cookie = self.cookieName + '=' + this.responseText + '; expires=' + expires + '; path=/;'
        self.setLoggedIn()
      } else {
        self.setLoggedOut()
      }
    }
    name = document.getElementById('usertext').value
    var password = document.getElementById('pwdtext').value
    xhr.send(`name=${name}&pwd=${password}`)
  }
}

Login.prototype.setLoggedIn = function () {
  // $:/state/OokTech/Login -> true
  $tw.wiki.setText('$:/state/OokTech/Login', 'text', null, 'true');
  this.refreshSelf();
  console.log('Yay!!')
}

Login.prototype.setLoggedOut = function () {
  // $:/state/OokTech/Login -> false
  $tw.wiki.setText('$:/state/OokTech/Login', 'text', null, 'false');
  this.refreshSelf();
  console.log('Boo!')
}

/*
  This removes the token from the cookie and local storage.
*/
Login.prototype.logout = function () {
  localStorage.removeItem(this.localstorageKey)
  document.cookie = this.cookieName + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  this.setLoggedOut();
}

/*
Refresh the widget by ensuring our attributes are up to date
*/
Login.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(Object.keys(changedAttributes).length > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports["login-widget"] = Login;

})();