// Copyright cantstopthesignals@gmail.com

goog.provide('pics3.Spinner');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.color');
goog.require('goog.dom');
goog.require('goog.style');
goog.require('pics3.Component');


/**
 * @constructor
 * @param {boolean=} opt_darkBackground
 * @param {number=} opt_size
 * @extends {pics3.Component}
 */
pics3.Spinner = function(opt_darkBackground, opt_size) {
  /** @type {Array.<pics3.Spinner.Entry>} */
  this.entries_ = [];

  /** @type {boolean} */
  this.darkBackground_ = opt_darkBackground || false;

  /** @type {?number} */
  this.size_ = opt_size || null;
};
goog.inherits(pics3.Spinner, pics3.Component);

/** @type {number} */
pics3.Spinner.ANIMATION_INTERVAL_MS_ = 50;

/** @type {number} */
pics3.Spinner.prototype.checkTimeoutId_;

/** @type {number} */
pics3.Spinner.prototype.animationIntervalId_;

/** @type {Object} */
pics3.Spinner.prototype.ctx_;

/** @type {number} */
pics3.Spinner.prototype.numBlips_;

/** @type {Array.<number>} */
pics3.Spinner.prototype.blipOpacity_;

/** @type {Element} */
pics3.Spinner.prototype.canvasEl_;

pics3.Spinner.prototype.createDom = function() {
  goog.asserts.assert(!this.el);
  this.el = document.createElement('div');
  goog.dom.classes.add(this.el, 'spinner-wrapper');
  this.canvasEl_ = document.createElement('canvas');
  goog.dom.classes.add(this.canvasEl_, 'spinner');
  this.el.appendChild(this.canvasEl_);

  this.checkVisibility_();
};

/** @param {boolean} floatingStyle */
pics3.Spinner.prototype.setFloatingStyle = function(floatingStyle) {
  goog.dom.classes.enable(this.el, 'float', floatingStyle);
};

/** @return {number} */
pics3.Spinner.prototype.getSize = function() {
  return this.size_ || this.canvasEl_.offsetWidth;
};

/**
 * @param {number=} opt_delay Optional delay in milliseconds before spinning.
 * @return {!pics3.Spinner.Entry}
 */
pics3.Spinner.prototype.spin = function(opt_delay) {
  var entry = new pics3.Spinner.Entry(this,
      goog.now() + (opt_delay || 0));
  this.entries_.push(entry);
  this.checkVisibility_();
  return entry;
};

pics3.Spinner.prototype.releaseEntry = function(entry) {
  var index = this.entries_.indexOf(entry);
  goog.asserts.assert(index >= 0);
  this.entries_.splice(index, 1);
  this.checkVisibility_();
};

/** @override */
pics3.Spinner.prototype.disposeInternal = function() {
  this.clearCheckTimer_();
  this.clearAnimationInterval_();
  goog.base(this, 'disposeInternal');
};

pics3.Spinner.prototype.checkVisibility_ = function() {
  var minTimestamp;
  goog.array.forEach(this.entries_, function(entry) {
    if (!minTimestamp || minTimestamp > entry.getShowTimestamp()) {
      minTimestamp = entry.getShowTimestamp();
    }
  }, this);

  var now = goog.now();
  var triggered = now >= minTimestamp;
  this.clearCheckTimer_();
  if (!triggered && minTimestamp) {
    this.checkTimeoutId_ = window.setTimeout(
        goog.bind(this.handleCheckTimeout_, this), minTimestamp - now);
  }
  goog.style.setStyle(this.el, 'visibility', triggered ? '' : 'hidden');

  if (triggered) {
    this.maybeStartAnimation_();
  } else {
    this.clearAnimationInterval_();
  }
};

pics3.Spinner.prototype.maybeStartAnimation_ = function() {
  if (this.animationIntervalId_) {
    return;
  }

  if (!this.size_ || this.size_ < 16) {
    this.size_ = Math.max(16, Math.min(this.canvasEl_.offsetWidth,
        this.canvasEl_.offsetHeight));
  }

  this.canvasEl_.setAttribute('width', this.size_ + 'px');
  this.canvasEl_.setAttribute('height', this.size_ + 'px');
  this.ctx_ = this.canvasEl_.getContext('2d');

  if (this.size_ >= 128) {
    this.numBlips_ = 15;
  } else if (this.size_ >= 64) {
    this.numBlips_ = 13;
  } else {
    this.numBlips_ = 11;
  }

  this.blipOpacity_ = [];
  for (var i = 0; i < this.numBlips_; i++) {
    this.blipOpacity_.push(Math.min(1, i / (this.numBlips_ - 1)));
  }
  var hotBlip = this.numBlips_ - 1;
  var iteration = 0;
  this.animationIntervalId_ = window.setInterval(goog.bind(function() {
    iteration += 1;
    if (iteration % 2 == 1) {
      hotBlip = (hotBlip + 1) % this.numBlips_;
    }
    for (var i = 0; i < this.numBlips_; i++) {
      this.blipOpacity_[i] = Math.max(0, this.blipOpacity_[i] - 1 /
          this.numBlips_ / 2);
    }
    this.blipOpacity_[hotBlip] = 1;
    this.paint_();
  }, this), pics3.Spinner.ANIMATION_INTERVAL_MS_);
};

pics3.Spinner.prototype.paint_ = function() {
  var blipWidth = Math.ceil(this.size_ * 0.3);
  var blipHeight = Math.ceil(this.size_ / 20);
  var blipReach = this.size_ / 2 - blipWidth;

  this.ctx_.clearRect(0, 0, this.size_, this.size_);
  this.ctx_.save();
  this.ctx_.translate(this.size_ / 2, this.size_ / 2);

  for (var i = 0; i < this.numBlips_; i++) {
    if (this.darkBackground_) {
      this.ctx_.fillStyle = 'rgba(255,255,255,' + this.blipOpacity_[i] + ')';
    } else {
      this.ctx_.fillStyle = 'rgba(0,0,0,' + this.blipOpacity_[i] + ')';
    }

    this.ctx_.beginPath();
    this.ctx_.moveTo(blipReach, -blipHeight/2);
    this.ctx_.lineTo(blipReach + blipWidth, -blipHeight/2);
    this.ctx_.lineTo(blipReach + blipWidth, blipHeight/2);
    this.ctx_.lineTo(blipReach, blipHeight/2);
    this.ctx_.closePath();
    this.ctx_.fill();

    this.ctx_.rotate(Math.PI*2 / this.numBlips_);
  }
  this.ctx_.restore();
};

pics3.Spinner.prototype.handleCheckTimeout_ = function() {
  this.checkVisibility_();
};

pics3.Spinner.prototype.clearCheckTimer_ = function() {
  if (this.checkTimeoutId_) {
    window.clearTimeout(this.checkTimeoutId_);
    delete this.checkTimeoutId_;
  }
};

pics3.Spinner.prototype.clearAnimationInterval_ = function() {
  if (this.animationIntervalId_) {
    window.clearInterval(this.animationIntervalId_);
    delete this.animationIntervalId_;
  }
};

/**
 * @constructor
 * @param {pics3.Spinner} spinner
 */
pics3.Spinner.Entry = function(spinner, showTimestamp) {
  this.spinner_ = spinner;
  this.showTimestamp_ = showTimestamp;
};

pics3.Spinner.Entry.prototype.getShowTimestamp = function() {
  return this.showTimestamp_;
};

pics3.Spinner.Entry.prototype.release = function() {
  goog.asserts.assert(this.spinner_);
  this.spinner_.releaseEntry(this);
  delete this.spinner_;
};
