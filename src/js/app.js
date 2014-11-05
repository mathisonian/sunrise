'use strict';

//
// app.js is the entry point for the entire client-side
// application. Any necessary top level libraries should be
// required here (e.g. pym.js), and it should also be
// responsible for instantiating correct viewcontrollers.
//


var DesktopViewController = require('./views/desktop-controller');
// var MobileViewController = require('./views/mobile-controller');
var emitter = require('./emitter');
// var _ = require('lodash');

var desktopView = null;
// var mobileView = null;
// var MOBILE_BREAKPOINT = 760;

var $desktopEl = $('#desktopContent');
// var $mobileEl = $('#mobileContent');


var draw = function() {
    emitter.removeAllListeners();
    var state = {};

    if(desktopView) {
        state = desktopView.getState();
        desktopView.destroy();
    }
    // if(mobileView) {
    //     mobileView.destroy();
    // }

    // if($(window).width() > MOBILE_BREAKPOINT) {
        // console.log('drawing desktop');
        desktopView = new DesktopViewController($desktopEl, state);
    // } else {
    //     mobileView = new MobileViewController($mobileView);
    // }
};

window.onresize = draw;
draw();


