/*\
title: $:/plugins/OokTech/Login/set-password-widget.js
type: application/javascript
module-type: widget

A widget that creates an interface to set a password for a restful server.

\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

const Widget = require("$:/core/modules/widgets/widget.js").widget;

const SetPassword = function(parseTreeNode,options) {
  this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SetPassword.prototype = new Widget();

/*
Render this widget into the DOM
*/
SetPassword.prototype.render = function(parent,nextSibling) {
  this.parentDomNode = parent;
  this.computeAttributes();
  const self = this;
  this.pwd_id = Math.random();
  this.cnfrm_id = Math.random();
  this.user_id = Math.random();

  const domNode = this.document.createElement("div");
  domNode.setAttribute('id', 'setpassworddiv');
  domNode.className='SetPasswordclass';
  const theTable = this.document.createElement('table');

  const nameRow = this.document.createElement('tr');
  const nameCell = this.document.createElement('td');
  nameCell.innerHTML = 'Name';
  const nameInputCell = this.document.createElement('td');
  const nameInput = this.document.createElement('input');
  nameInput.setAttribute('type', 'text');
  nameInput.setAttribute('id', this.user_id);
  nameInputCell.appendChild(nameInput);
  nameRow.appendChild(nameCell);
  nameRow.appendChild(nameInputCell);

  const passwordRow = this.document.createElement('tr');
  const passwordCell = this.document.createElement('td');
  passwordCell.innerHTML = 'Password';
  const passwordInputCell = this.document.createElement('td');
  const passwordInput = this.document.createElement('input');
  passwordInput.setAttribute('type', 'password');
  passwordInput.setAttribute('id', this.pwd_id);
  passwordInputCell.appendChild(passwordInput);
  passwordRow.appendChild(passwordCell);
  passwordRow.appendChild(passwordInputCell);

  const confirmRow = this.document.createElement('tr');
  const confirmCell = this.document.createElement('td');
  confirmCell.innerHTML = 'Confirm';
  const confirmInputCell = this.document.createElement('td');
  const confirmInput = this.document.createElement('input');
  confirmInput.setAttribute('type', 'password');
  confirmInput.setAttribute('id', this.cnfrm_id);
  confirmInputCell.appendChild(confirmInput);
  confirmRow.appendChild(confirmCell);
  confirmRow.appendChild(confirmInputCell);

  theTable.appendChild(nameRow);
  theTable.appendChild(passwordRow);
  theTable.appendChild(confirmRow);

  const setPasswordButton = this.document.createElement('input');
  setPasswordButton.setAttribute('type', 'button');
  setPasswordButton.setAttribute('value', 'Create Login');
  setPasswordButton.setAttribute('id', 'SetPasswordbutton');
  setPasswordButton.addEventListener('click', function (event) {self.setPassword();});

  domNode.appendChild(theTable);
  domNode.appendChild(setPasswordButton);

  // If dispable is set than disable the widget based on  the disable flag
  const disableTiddler = this.wiki.getTiddler(this.disableFlag);
  if (disableTiddler) {
    if (disableTiddler.fields.text === 'disable') {
      confirmInput.disabled = true;
      passwordInput.disabled = true;
      nameInput.disabled = true;
      setPasswordButton.disabled = true;
    }
  }

  this.execute();

  parent.insertBefore(domNode,nextSibling);
  this.renderChildren(domNode,null);
  this.domNodes.push(domNode);
};

/*
Compute the internal state of the widget
*/
SetPassword.prototype.execute = function() {
  //Get widget attributes.
  this.level = this.getAttribute('level', 'Guest');
  this.disableFlag = this.getAttribute('disableState', false);
  this.autologin = this.getAttribute('autoLogin', 'no');
  this.cookieName = this.getAttribute('cookieName', 'token');
  this.localstorageKey = this.getAttribute('localstorageKey', 'ws-token');
  this.bobLogin = this.getAttribute('bobLogin', 'true');
  this.name = undefined;
  this.BaseUrl = '/api/credentials/add/';
};

/*
  This sends a POST with the name and password.
  If it gets a response than it stores the reply token in a cookie and
  localstorage
*/
SetPassword.prototype.setPassword = function() {
  const self = this;
  this.computeAttributes();
  // make sure that the inputs are set.
  const name = document.getElementById(this.user_id).value;
  const password = document.getElementById(this.pwd_id).value;
  const confirm = document.getElementById(this.cnfrm_id).value;
  const level = self.level;
  self.url = self.BaseUrl + name;
  if (name && password && level && (password === confirm)) {
    // We can only do this if the destination is https. So either we are on an
    // https server and it is local (the url doesn't start with http) or we are
    // sending to an https url
    if ((window.location.protocol === 'https:' && (self.url.startsWith('https://') || !self.url.startsWith('http'))) || self.url.startsWith('https://')) {
      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true
      xhr.open('POST', self.url, true);
      xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      xhr.onload = function () {
        // do something to response
        console.log('setPassword response', xhr.responseText)
        if (xhr.responseText === 'Success') {
          // Handle success
          if (self.autologin === 'yes') {
            // If autologin is set than login as the new person
            const xhr2 = new XMLHttpRequest();
            xhr2.open('POST', '/authenticate', true);
            xhr2.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            xhr2.onload = function () {
              // do something to response
              if (self.responseText && self.status == "200") {
                localStorage.setItem(self.localstorageKey, self.responseText);
                self.token = self.responseText;
                self.expires = JSON.parse(window.atob(self.token.split('.')[1])).exp;
                const expires = new Date();
                expires.setTime(expires.getTime() + 24*60*60*1000)
                if (self.saveCookie === 'true') {
                  document.cookie = self.cookieName + '=' + self.responseText + '; expires=' + expires + '; path=/;'
                }
                //self.setLoggedIn()
                // take care of the Bob login things, if they exist
                if (typeof self.bobLogin !== 'string') {
                  self.bobLogin = '';
                }
                if ($tw.Bob && self.bobLogin.toLowerCase() === 'true' || self.bobLogin.toLowerCase() === 'yes') {
                  if ($tw.Bob.Shared) {
                    if (typeof $tw.Bob.Shared.sendMessage === 'function') {
                      const token = self.token;
                      const wikiName = $tw.wiki.getTiddlerText("$:/WikiName");
                      const message = {type: 'setLoggedIn', wiki: wikiName, token: token}
                      const messageData = $tw.Bob.Shared.createMessageData(message)
                      $tw.Bob.Shared.sendMessage(messageData, 0)
                      self.setLoggedIn()
                    }
                  }
                }
              } else {
                
              }
            }
            xhr2.send(`name=${name}&pwd=${password}`);
          }
          if (typeof self.disableFlag === 'string') {
            // Set the text to 'disabled'
            self.wiki.setText(self.disableFlag, 'text', undefined, 'disabled')
          }
        } else {
          // Handle failure
          // Something?
        }
      }
      xhr.send(`name=${name}&pwd=${password}&lvl=${level}`);
    }
  }
}

/*
Refresh the widget by ensuring our attributes are up to date
*/
SetPassword.prototype.refresh = function(changedTiddlers) {
  const changedAttributes = this.computeAttributes();
  if(Object.keys(changedAttributes).length > 0) {
    this.refreshSelf();
    return true;
  }
  return this.refreshChildren(changedTiddlers);
};

exports["setpassword-widget"] = SetPassword;

})();
