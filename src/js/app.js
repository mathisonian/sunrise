'use strict';

//
// app.js is the entry point for the entire client-side
// application. Any necessary top level libraries should be
// required here (e.g. pym.js), and it should also be
// responsible for instantiating correct viewcontrollers.
//


var DesktopViewController = require('./views/desktop-controller');
var emitter = require('./emitter');
var _ = require('lodash');

var desktopView = null;

var $desktopEl = $('#desktopContent');

var draw = function() {
    emitter.removeAllListeners();
    var state = {};

    if(desktopView) {
        state = desktopView.getState();
        desktopView.destroy();
    }
    
    desktopView = new DesktopViewController($desktopEl, state);
};

window.onresize = _.throttle(draw, 400);
draw();


