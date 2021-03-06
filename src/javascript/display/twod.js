// Copyright cantstopthesignals@gmail.com

goog.provide('pics3.display.TwoD');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events.EventType');
goog.require('pics3.Component');
goog.require('pics3.Photo');
goog.require('pics3.PhotoMimeType');
goog.require('pics3.display.Base');


/**
 * @param {!pics3.Photo} photo
 * @constructor
 * @extends {pics3.display.Base}
 */
pics3.display.TwoD = function(photo) {
  goog.base(this, pics3.display.Type.TWO_D, photo);
  goog.asserts.assert(photo.getState() == pics3.Photo.State.LOADED);
  goog.asserts.assert(photo.getMimeType() != pics3.PhotoMimeType.MPO);
  goog.asserts.assert(photo.getImageCount() == 1);
};
goog.inherits(pics3.display.TwoD, pics3.display.Base);

/** @type {Element} */
pics3.display.TwoD.prototype.imageEl_;

pics3.display.TwoD.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'photo-display');

  this.imageEl_ = document.createElement('img');
  goog.dom.classes.add(this.imageEl_, 'image');
  this.eventHandler.listen(this.imageEl_, goog.events.EventType.LOAD,
      this.handleImageLoaded_);
  this.imageEl_.src = this.photo.getImageDataUrl(0);
  goog.style.setStyle(this.imageEl_, 'visibility', 'hidden');
  this.el.appendChild(this.imageEl_);
};

pics3.display.TwoD.prototype.handleImageLoaded_ = function() {
  this.layout();
  goog.style.setStyle(this.imageEl_, 'visibility', '');
};

pics3.display.TwoD.prototype.layout = function() {
  this.resizeImageToFullSize(this.imageEl_);
};
