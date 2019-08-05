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
  this.execute();

  const self = this;

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
  nameInput.setAttribute('id', 'usertext');
  nameInputCell.appendChild(nameInput);
  nameRow.appendChild(nameCell);
  nameRow.appendChild(nameInputCell);

  const passwordRow = this.document.createElement('tr');
  const passwordCell = this.document.createElement('td');
  passwordCell.innerHTML = 'Password';
  const passwordInputCell = this.document.createElement('td');
  const passwordInput = this.document.createElement('input');
  passwordInput.setAttribute('type', 'password');
  passwordInput.setAttribute('id', 'pwdtext');
  passwordInputCell.appendChild(passwordInput);
  passwordRow.appendChild(passwordCell);
  passwordRow.appendChild(passwordInputCell);

  const confirmRow = this.document.createElement('tr');
  const confirmCell = this.document.createElement('td');
  confirmCell.innerHTML = 'Confirm';
  const confirmInputCell = this.document.createElement('td');
  const confirmInput = this.document.createElement('input');
  confirmInput.setAttribute('type', 'password');
  confirmInput.setAttribute('id', 'confirmtext');
  confirmInputCell.appendChild(confirmInput);
  confirmRow.appendChild(confirmCell);
  confirmRow.appendChild(confirmInputCell);

  theTable.appendChild(nameRow);
  theTable.appendChild(passwordRow);
  theTable.appendChild(confirmRow);

  const SetPasswordbutton = this.document.createElement('input');
  SetPasswordbutton.setAttribute('type', 'button');
  SetPasswordbutton.setAttribute('value', 'Create Login');
  SetPasswordbutton.setAttribute('id', 'SetPasswordbutton');
  SetPasswordbutton.addEventListener('click', function (event) {self.setPassword();});

  domNode.appendChild(theTable);
  domNode.appendChild(SetPasswordbutton);

  parent.insertBefore(domNode,nextSibling);
  this.renderChildren(domNode,null);
  this.domNodes.push(domNode);
};

/*
Compute the internal state of the widget
*/
SetPassword.prototype.execute = function() {
  //Get widget attributes.
  this.cookieName = this.getAttribute('cookieName', 'token');
  this.name = undefined;
  this.url = '/api/credentials/add/'
};

/*
  This sends a POST with the name and password.
  If it gets a response than it stores the reply token in a cookie and
  localstorage
*/
SetPassword.prototype.setPassword = function() {
  const self = this;
  // make sure that the inputs are set.
  const name = document.getElementById('usertext').value;
  const password = document.getElementById('pwdtext').value;
  const level = 'Admin'
  self.url += name
  //var level = document.getElementById('userlevel').value;
  if (name && password && level) {
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
