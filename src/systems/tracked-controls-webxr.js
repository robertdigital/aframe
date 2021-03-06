var registerSystem = require('../core/system').registerSystem;
var utils = require('../utils');

/**
 * Tracked controls system.
 * Maintain list with available tracked controllers.
 */
module.exports.System = registerSystem('tracked-controls-webxr', {
  init: function () {
    this.controllers = [];
    this.oldControllersLength = 0;
    this.throttledUpdateControllerList = utils.throttle(this.updateControllerList, 500, this);
    this.updateReferenceSpace = this.updateReferenceSpace.bind(this);
    this.el.addEventListener('enter-vr', this.updateReferenceSpace);
    this.el.addEventListener('exit-vr', this.updateReferenceSpace);
  },

  tick: function () {
    this.throttledUpdateControllerList();
  },

  updateReferenceSpace: function () {
    var self = this;
    var xrSession = this.el.xrSession;
    if (!xrSession) {
      this.referenceSpace = undefined;
      this.controllers = [];
      if (this.oldControllersLength > 0) {
        this.oldControllersLength = 0;
        this.el.emit('controllersupdated', undefined, false);
      }
      return;
    }
    var refspace = 'local-floor';
    xrSession.requestReferenceSpace(refspace).then(function (referenceSpace) {
      self.referenceSpace = referenceSpace;
    }).catch(function (err) {
      console.warn('Failed to get reference space "' + refspace + '": ' + err);
      self.el.sceneEl.systems.webxr.warnIfFeatureNotRequested(
          refspace,
          'tracked-controls-webxr uses reference space "' + refspace + '".');
    });
  },

  updateControllerList: function () {
    var xrSession = this.el.xrSession;
    if (!xrSession) {
      if (this.oldControllersLength === 0) { return; }
      // Broadcast that we now have zero controllers connected if there is
      // no session
      this.oldControllersLength = 0;
      this.controllers = [];
      this.el.emit('controllersupdated', undefined, false);
      return;
    }
    this.controllers = xrSession.inputSources;
    if (this.oldControllersLength === this.controllers.length) { return; }
    this.oldControllersLength = this.controllers.length;
    this.el.emit('controllersupdated', undefined, false);
  }
});
