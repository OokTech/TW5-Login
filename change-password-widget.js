/*\
title: $:/plugins/OokTech/Login/change-password-widget.js
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

var ChangePassword = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ChangePassword.prototype = new Widget();

/*
Render this widget into the DOM
*/
ChangePassword.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();

  var self = this;

	var domNode = this.document.createElement("div");
  domNode.setAttribute('id', 'changepassworddiv')
  domNode.className='changepwdclass'
  var statusDiv = this.document.createElement('div')
  statusDiv.setAttribute('id', 'statusdiv')
  domNode.appendChild(statusDiv)
  var urlDiv = this.document.createElement('div')
  domNode.appendChild(urlDiv)
  urlDiv.innerHTML = 'on ' + this.url
  var passSpan1 = this.document.createElement('div');
  passSpan1.appendChild(this.document.createTextNode('Old Password:'));
  var passNode = this.document.createElement("input");
  passNode.setAttribute('type', 'password');
  passNode.setAttribute('id', 'oldpwdtext');
  passSpan1.appendChild(passNode);
  passSpan1.setAttribute('id', 'oldpwd');
	var passSpan2 = this.document.createElement('div');
  passSpan2.appendChild(this.document.createTextNode('New Password:'));
	var newPassNode1 = this.document.createElement("input");
  newPassNode1.setAttribute('type', 'password');
  newPassNode1.setAttribute('id', 'newpwdtext1');
  passSpan2.appendChild(newPassNode1);
  passSpan2.setAttribute('id', 'newpwd1');
	var passSpan3 = this.document.createElement('div');
  passSpan3.appendChild(this.document.createTextNode('New Password Again:'));
	var newPassNode2 = this.document.createElement("input");
  newPassNode2.setAttribute('type', 'password');
  newPassNode2.setAttribute('id', 'newpwdtext2');
  passSpan3.appendChild(newPassNode2);
  passSpan3.setAttribute('id', 'newpwd2');
  domNode.appendChild(passSpan1);
	domNode.appendChild(passSpan2);
	domNode.appendChild(passSpan3);
	if (this.requireConfirmation) {
		var checkDiv = this.document.createElement('div');
		checkDiv.setAttribute('id', 'checkdiv')
		var confirmationCheckbox = this.document.createElement('input');
		confirmationCheckbox.setAttribute('type','checkbox');
		confirmationCheckbox.setAttribute('id','confirmCheck');
		checkDiv.appendChild(confirmationCheckbox);
		var checkLabel = this.document.createElement('label');
		checkLabel.setAttribute('for', 'confirmCheck');
		checkLabel.innerHTML = ' I do want to change my password';
		checkDiv.appendChild(checkLabel);
		domNode.appendChild(checkDiv);
	}
  var changepasswordbutton = this.document.createElement('input');
  changepasswordbutton.setAttribute('type', 'button');
  changepasswordbutton.setAttribute('value', 'Change Password');
  changepasswordbutton.setAttribute('id', 'changepasswordbutton');
  changepasswordbutton.addEventListener('click', function (event) {self.changePassword();});
  domNode.appendChild(changepasswordbutton);

  var loginState = this.getLoginState();
  if (loginState) {
		statusDiv.innerHTML =  'Logged In As' + this.name;
    domNode.classList.add('loggedin');
    domNode.classList.remove('loggedout');
  } else {
    statusDiv.innerHTML =  'Logged Out'
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
ChangePassword.prototype.execute = function() {
	//Get widget attributes.
	this.url = this.getAttribute('url', '/api/credentials/update/');
	this.cookieName = this.getAttribute('cookieName', 'token');
  this.localstorageKey = this.getAttribute('localstorageKey', 'ws-token');
	this.requireConfirmation = this.getAttribute('requireConfirmation', true);
	this.confirmationTiddler = this.getAttribute('confirmationTiddler', '$:/state/OokTech/Login/ChangePasswordConfirm');
  this.token = localStorage.getItem(this.localstorageKey);
  this.name = undefined;
	this.loggedin = false
  if (this.token) {
    try {
      this.name = JSON.parse(window.atob(this.token.split('.')[1])).name;
      this.expires = JSON.parse(window.atob(this.token.split('.')[1])).exp;
			this.level = JSON.parse(window.atob(this.token.split('.')[1])).level;
			if (this.expires*1000 > Date.now()) {
				this.loggedin = true
			}
    } catch (e) {

    }
  }
};

/*
  This sends a POST with the name and password.
  If it gets a response than it stores the reply token in a cookie and
  localstorage
*/
ChangePassword.prototype.changePassword = function() {
	if ((!this.requireConfirmation || this.document.getElementById('confirmCheck').checked) && this.loggedin) {
	  var self = this;
		var newPassword = document.getElementById('newpwdtext1').value;
		var newPassword2 = document.getElementById('newpwdtext2').value;
		// Make sure that the two new password entry values match
		if (newPassword === newPassword2) {
		  // We can only do this if the destination is https. So either we are on an
		  // https server and it is local (the url doesn't start with http) or we are
		  // sending to an https url
		  if ((window.location.protocol === 'https:' && (self.url.startsWith('https://') || !self.url.startsWith('http'))) || self.url.startsWith('https://')) {
				if (self.name) {
			    var xhr = new XMLHttpRequest();
			    xhr.open('POST', self.url+self.name, true);
			    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			    xhr.onload = function () {
			      // do something to response
			      if (this.status == "200") {
							// We need to parse the response text
							// Remove the stored token
			        localStorage.removeItem(self.localstorageKey);
			        // Log out to make the person log in with the new password
			        self.logout()
			      } else {
			        self.showError(this.status);
			      }
			    }
			    var name = self.name;
			    var password = document.getElementById('oldpwdtext').value;
					var newPassword = document.getElementById('newpwdtext1').value;
					var level = self.level;
			    xhr.send(`name=${name}&pwd=${password}&new=${newPassword}&level=${level}`);
				}
		  }
		}
	}
}

ChangePassword.prototype.showError = function (code) {
	console.log('Error, got code', code)
}

ChangePassword.prototype.getLoginState = function () {
  if (this.token) {
    if (this.expires * 1000 > Date.now()) {
      return "true";
    } else {
      return "false";
    }
  }
}

function getCookie(c_name) {
  var c_value = " " + document.cookie;
  var c_start = c_value.indexOf(" " + c_name + "=");
  if (c_start == -1) {
    c_value = null;
  } else {
    c_start = c_value.indexOf("=", c_start) + 1;
    var c_end = c_value.indexOf(";", c_start);
    if (c_end == -1) {
      c_end = c_value.length;
    }
    c_value = unescape(c_value.substring(c_start,c_end));
  }
  return c_value;
}

ChangePassword.prototype.getLoginState = function () {
  var token = localStorage.getItem(this.localstorageKey)
  var exp = 0;
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

ChangePassword.prototype.setLoggedOut = function () {
  // $:/state/OokTech/Login -> false
  $tw.wiki.setText('$:/state/OokTech/Login', 'text', null, 'false');
  this.refreshSelf();
}

/*
  This removes the token from the cookie and local storage.
*/
ChangePassword.prototype.logout = function () {
  localStorage.removeItem(this.localstorageKey);
  document.cookie = this.cookieName + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  this.setLoggedOut();
}

/*
Refresh the widget by ensuring our attributes are up to date
*/
ChangePassword.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(Object.keys(changedAttributes).length > 0 || (this.expires > Date.now()) || !this.expires) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports["change-password-widget"] = ChangePassword;

})();
