"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "RHAP_UI", {
  enumerable: true,
  get: function () {
    return _constants.RHAP_UI;
  }
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _react2 = require("@iconify/react");
var _ProgressBar = _interopRequireDefault(require("./ProgressBar"));
var _CurrentTime = _interopRequireDefault(require("./CurrentTime"));
var _Duration = _interopRequireDefault(require("./Duration"));
var _VolumeBar = _interopRequireDefault(require("./VolumeBar"));
var _constants = require("./constants");
var _utils = require("./utils");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
class H5AudioPlayer extends _react.Component {
  static defaultI18nAriaLabels = {
    player: 'Audio player',
    progressControl: 'Audio progress control',
    volumeControl: 'Volume control',
    play: 'Play',
    pause: 'Pause',
    rewind: 'Rewind',
    forward: 'Forward',
    previous: 'Previous',
    next: 'Skip',
    loop: 'Disable loop',
    loopOff: 'Enable loop',
    volume: 'Mute',
    volumeMute: 'Unmute'
  };
  audio = (() => (0, _react.createRef)())();
  progressBar = (() => (0, _react.createRef)())();
  container = (() => (0, _react.createRef)())();
  lastVolume = (() => this.props.volume ?? 1)();
  togglePlay = e => {
    console.log('RQ AUDIO PLAYER - togglePlay called at:', new Date().toISOString());
    console.log('Event:', e);
    e.stopPropagation();
    const audio = this.audio.current;
    console.log('audio is paused', audio.paused);
    console.log('audio is ended', audio.ended);
    console.log('audio src', audio.src);
    if (audio.paused || audio.ended) {
      this.playAudioPromise();
    } else if (!audio.paused) {
      audio.pause();
    }
  };
  playAudioPromise = () => {
    if (this.audio.current.error) {
      this.audio.current.load();
    }
    const playPromise = this.audio.current.play();
    console.log('playPromise', playPromise);
    if (playPromise) {
      playPromise.then(null).catch(err => {
        console.log('playPromise error', err);
        const {
          onPlayError
        } = this.props;
        onPlayError && onPlayError(new Error(err));
      });
    } else {
      this.forceUpdate();
    }
  };
  isPlaying = () => {
    const audio = this.audio.current;
    if (!audio) return false;
    return !audio.paused && !audio.ended;
  };
  handlePlay = e => {
    this.forceUpdate();
    this.props.onPlay && this.props.onPlay(e);
  };
  handlePause = e => {
    if (!this.audio) return;
    this.forceUpdate();
    this.props.onPause && this.props.onPause(e);
  };
  handleEnded = e => {
    if (!this.audio) return;
    this.forceUpdate();
    this.props.onEnded && this.props.onEnded(e);
  };
  handleAbort = e => {
    this.props.onAbort && this.props.onAbort(e);
  };
  handleClickVolumeButton = () => {
    const audio = this.audio.current;
    if (audio.volume > 0) {
      this.lastVolume = audio.volume;
      audio.volume = 0;
    } else {
      audio.volume = this.lastVolume;
    }
  };
  handleMuteChange = () => {
    this.forceUpdate();
  };
  handleClickLoopButton = () => {
    this.audio.current.loop = !this.audio.current.loop;
    this.forceUpdate();
  };
  handleClickRewind = () => {
    const {
      progressJumpSteps,
      progressJumpStep
    } = this.props;
    const jumpStep = progressJumpSteps.backward || progressJumpStep;
    this.setJumpTime(-jumpStep);
  };
  handleClickForward = () => {
    const {
      progressJumpSteps,
      progressJumpStep
    } = this.props;
    const jumpStep = progressJumpSteps.forward || progressJumpStep;
    this.setJumpTime(jumpStep);
  };
  setJumpTime = time => {
    const audio = this.audio.current;
    const {
      duration,
      currentTime: prevTime
    } = audio;
    if (audio.readyState === audio.HAVE_NOTHING || audio.readyState === audio.HAVE_METADATA || !isFinite(duration) || !isFinite(prevTime)) {
      try {
        audio.load();
      } catch (err) {
        return this.props.onChangeCurrentTimeError && this.props.onChangeCurrentTimeError(err);
      }
    }
    let currentTime = prevTime + time / 1000;
    if (currentTime < 0) {
      audio.currentTime = 0;
      currentTime = 0;
    } else if (currentTime > duration) {
      audio.currentTime = duration;
      currentTime = duration;
    } else {
      audio.currentTime = currentTime;
    }
  };
  setJumpVolume = volume => {
    let newVolume = this.audio.current.volume + volume;
    if (newVolume < 0) newVolume = 0;else if (newVolume > 1) newVolume = 1;
    this.audio.current.volume = newVolume;
  };
  handleKeyDown = e => {
    if (this.props.hasDefaultKeyBindings ?? true) {
      switch (e.key) {
        case ' ':
          if (e.target === this.container.current || e.target === this.progressBar.current) {
            e.preventDefault();
            this.togglePlay(e);
          }
          break;
        case 'ArrowLeft':
          this.handleClickRewind();
          break;
        case 'ArrowRight':
          this.handleClickForward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.setJumpVolume(this.props.volumeJumpStep);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.setJumpVolume(-this.props.volumeJumpStep);
          break;
        case 'l':
          this.handleClickLoopButton();
          break;
        case 'm':
          this.handleClickVolumeButton();
          break;
      }
    }
  };
  renderUIModules = modules => {
    return modules.map((comp, i) => this.renderUIModule(comp, i));
  };
  renderUIModule = (comp, key) => {
    const {
      defaultCurrentTime = '--:--',
      progressUpdateInterval = 20,
      showDownloadProgress = true,
      showFilledProgress = true,
      showFilledVolume = false,
      defaultDuration = '--:--',
      customIcons = {},
      showSkipControls = false,
      onClickPrevious,
      onClickNext,
      onChangeCurrentTimeError,
      showJumpControls = true,
      customAdditionalControls = [_constants.RHAP_UI.LOOP],
      customVolumeControls = [_constants.RHAP_UI.VOLUME],
      muted = false,
      timeFormat = 'auto',
      volume: volumeProp = 1,
      loop: loopProp = false,
      mse,
      i18nAriaLabels = H5AudioPlayer.defaultI18nAriaLabels
    } = this.props;
    switch (comp) {
      case _constants.RHAP_UI.CURRENT_TIME:
        return _react.default.createElement("div", {
          key: key,
          id: "rhap_current-time",
          className: "rhap_time rhap_current-time"
        }, _react.default.createElement(_CurrentTime.default, {
          audio: this.audio.current,
          isLeftTime: false,
          defaultCurrentTime: defaultCurrentTime,
          timeFormat: timeFormat
        }));
      case _constants.RHAP_UI.CURRENT_LEFT_TIME:
        return _react.default.createElement("div", {
          key: key,
          id: "rhap_current-left-time",
          className: "rhap_time rhap_current-left-time"
        }, _react.default.createElement(_CurrentTime.default, {
          audio: this.audio.current,
          isLeftTime: true,
          defaultCurrentTime: defaultCurrentTime,
          timeFormat: timeFormat
        }));
      case _constants.RHAP_UI.PROGRESS_BAR:
        return _react.default.createElement(_ProgressBar.default, {
          key: key,
          ref: this.progressBar,
          audio: this.audio.current,
          progressUpdateInterval: progressUpdateInterval,
          showDownloadProgress: showDownloadProgress,
          showFilledProgress: showFilledProgress,
          onSeek: mse && mse.onSeek,
          onChangeCurrentTimeError: onChangeCurrentTimeError,
          srcDuration: mse && mse.srcDuration,
          i18nProgressBar: i18nAriaLabels.progressControl
        });
      case _constants.RHAP_UI.DURATION:
        return _react.default.createElement("div", {
          key: key,
          className: "rhap_time rhap_total-time"
        }, mse && mse.srcDuration ? (0, _utils.getDisplayTimeBySeconds)(mse.srcDuration, mse.srcDuration, this.props.timeFormat) : _react.default.createElement(_Duration.default, {
          audio: this.audio.current,
          defaultDuration: defaultDuration,
          timeFormat: timeFormat
        }));
      case _constants.RHAP_UI.ADDITIONAL_CONTROLS:
        return _react.default.createElement("div", {
          key: key,
          className: "rhap_additional-controls"
        }, this.renderUIModules(customAdditionalControls));
      case _constants.RHAP_UI.MAIN_CONTROLS:
        {
          const isPlaying = this.isPlaying();
          let actionIcon;
          if (isPlaying) {
            actionIcon = customIcons.pause ? customIcons.pause : _react.default.createElement(_react2.Icon, {
              icon: "mdi:pause-circle"
            });
          } else {
            actionIcon = customIcons.play ? customIcons.play : _react.default.createElement(_react2.Icon, {
              icon: "mdi:play-circle"
            });
          }
          return _react.default.createElement("div", {
            key: key,
            className: "rhap_main-controls"
          }, showSkipControls && _react.default.createElement("button", {
            "aria-label": i18nAriaLabels.previous,
            className: "rhap_button-clear rhap_main-controls-button rhap_skip-button",
            type: "button",
            onClick: onClickPrevious
          }, customIcons.previous ? customIcons.previous : _react.default.createElement(_react2.Icon, {
            icon: "mdi:skip-previous"
          })), showJumpControls && _react.default.createElement("button", {
            "aria-label": i18nAriaLabels.rewind,
            className: "rhap_button-clear rhap_main-controls-button rhap_rewind-button",
            type: "button",
            onClick: this.handleClickRewind
          }, customIcons.rewind ? customIcons.rewind : _react.default.createElement(_react2.Icon, {
            icon: "mdi:rewind"
          })), _react.default.createElement("button", {
            "aria-label": isPlaying ? i18nAriaLabels.pause : i18nAriaLabels.play,
            className: "rhap_button-clear rhap_main-controls-button rhap_play-pause-button",
            type: "button",
            onClick: this.togglePlay
          }, actionIcon), showJumpControls && _react.default.createElement("button", {
            "aria-label": i18nAriaLabels.forward,
            className: "rhap_button-clear rhap_main-controls-button rhap_forward-button",
            type: "button",
            onClick: this.handleClickForward
          }, customIcons.forward ? customIcons.forward : _react.default.createElement(_react2.Icon, {
            icon: "mdi:fast-forward"
          })), showSkipControls && _react.default.createElement("button", {
            "aria-label": i18nAriaLabels.next,
            className: "rhap_button-clear rhap_main-controls-button rhap_skip-button",
            type: "button",
            onClick: onClickNext
          }, customIcons.next ? customIcons.next : _react.default.createElement(_react2.Icon, {
            icon: "mdi:skip-next"
          })));
        }
      case _constants.RHAP_UI.VOLUME_CONTROLS:
        return _react.default.createElement("div", {
          key: key,
          className: "rhap_volume-controls"
        }, this.renderUIModules(customVolumeControls));
      case _constants.RHAP_UI.LOOP:
        {
          const loop = this.audio.current ? this.audio.current.loop : loopProp;
          let loopIcon;
          if (loop) {
            loopIcon = customIcons.loop ? customIcons.loop : _react.default.createElement(_react2.Icon, {
              icon: "mdi:repeat"
            });
          } else {
            loopIcon = customIcons.loopOff ? customIcons.loopOff : _react.default.createElement(_react2.Icon, {
              icon: "mdi:repeat-off"
            });
          }
          return _react.default.createElement("button", {
            key: key,
            "aria-label": loop ? i18nAriaLabels.loop : i18nAriaLabels.loopOff,
            className: "rhap_button-clear rhap_repeat-button",
            type: "button",
            onClick: this.handleClickLoopButton
          }, loopIcon);
        }
      case _constants.RHAP_UI.VOLUME:
        {
          const {
            volume = muted ? 0 : volumeProp
          } = this.audio.current || {};
          let volumeIcon;
          if (volume) {
            volumeIcon = customIcons.volume ? customIcons.volume : _react.default.createElement(_react2.Icon, {
              icon: "mdi:volume-high"
            });
          } else {
            volumeIcon = customIcons.volume ? customIcons.volumeMute : _react.default.createElement(_react2.Icon, {
              icon: "mdi:volume-mute"
            });
          }
          return _react.default.createElement("div", {
            key: key,
            className: "rhap_volume-container"
          }, _react.default.createElement("button", {
            "aria-label": volume ? i18nAriaLabels.volume : i18nAriaLabels.volumeMute,
            onClick: this.handleClickVolumeButton,
            type: "button",
            className: "rhap_button-clear rhap_volume-button"
          }, volumeIcon), _react.default.createElement(_VolumeBar.default, {
            audio: this.audio.current,
            volume: volume,
            onMuteChange: this.handleMuteChange,
            showFilledVolume: showFilledVolume,
            i18nVolumeControl: i18nAriaLabels.volumeControl
          }));
        }
      default:
        if (!(0, _react.isValidElement)(comp)) {
          return null;
        }
        return comp.key ? comp : (0, _react.cloneElement)(comp, {
          key
        });
    }
  };
  componentDidMount() {
    this.forceUpdate();
    const audio = this.audio.current;
    if (this.props.muted) {
      audio.volume = 0;
    } else {
      audio.volume = this.lastVolume;
    }
    audio.addEventListener('error', e => {
      const target = e.target;
      if (target.error && target.currentTime === target.duration) {
        return this.props.onEnded && this.props.onEnded(e);
      }
      this.props.onError && this.props.onError(e);
    });
    audio.addEventListener('canplay', e => {
      this.props.onCanPlay && this.props.onCanPlay(e);
    });
    audio.addEventListener('canplaythrough', e => {
      this.props.onCanPlayThrough && this.props.onCanPlayThrough(e);
    });
    audio.addEventListener('play', this.handlePlay);
    audio.addEventListener('abort', this.handleAbort);
    audio.addEventListener('ended', this.handleEnded);
    audio.addEventListener('playing', e => {
      this.props.onPlaying && this.props.onPlaying(e);
    });
    audio.addEventListener('seeking', e => {
      this.props.onSeeking && this.props.onSeeking(e);
    });
    audio.addEventListener('seeked', e => {
      this.props.onSeeked && this.props.onSeeked(e);
    });
    audio.addEventListener('waiting', e => {
      this.props.onWaiting && this.props.onWaiting(e);
    });
    audio.addEventListener('emptied', e => {
      this.props.onEmptied && this.props.onEmptied(e);
    });
    audio.addEventListener('stalled', e => {
      this.props.onStalled && this.props.onStalled(e);
    });
    audio.addEventListener('suspend', e => {
      this.props.onSuspend && this.props.onSuspend(e);
    });
    audio.addEventListener('loadstart', e => {
      this.props.onLoadStart && this.props.onLoadStart(e);
    });
    audio.addEventListener('loadedmetadata', e => {
      this.props.onLoadedMetaData && this.props.onLoadedMetaData(e);
    });
    audio.addEventListener('loadeddata', e => {
      this.props.onLoadedData && this.props.onLoadedData(e);
    });
    audio.addEventListener('pause', this.handlePause);
    audio.addEventListener('timeupdate', (0, _utils.throttle)(e => {
      this.props.onListen && this.props.onListen(e);
    }, this.props.listenInterval));
    audio.addEventListener('volumechange', e => {
      this.props.onVolumeChange && this.props.onVolumeChange(e);
    });
    audio.addEventListener('encrypted', e => {
      const {
        mse
      } = this.props;
      mse && mse.onEcrypted && mse.onEcrypted(e);
    });
  }
  componentDidUpdate(prevProps) {
    const {
      src,
      autoPlayAfterSrcChange
    } = this.props;
    if (prevProps.src !== src) {
      if (autoPlayAfterSrcChange) {
        this.playAudioPromise();
      } else {
        this.forceUpdate();
      }
    }
  }
  render() {
    const {
      className = '',
      src,
      loop: loopProp = false,
      preload = 'auto',
      autoPlay = false,
      crossOrigin,
      mediaGroup,
      header,
      footer,
      layout = 'stacked',
      customProgressBarSection = [_constants.RHAP_UI.CURRENT_TIME, _constants.RHAP_UI.PROGRESS_BAR, _constants.RHAP_UI.DURATION],
      customControlsSection = [_constants.RHAP_UI.ADDITIONAL_CONTROLS, _constants.RHAP_UI.MAIN_CONTROLS, _constants.RHAP_UI.VOLUME_CONTROLS],
      children,
      style,
      i18nAriaLabels = H5AudioPlayer.defaultI18nAriaLabels
    } = this.props;
    const loop = this.audio.current ? this.audio.current.loop : loopProp;
    const loopClass = loop ? 'rhap_loop--on' : 'rhap_loop--off';
    const isPlayingClass = this.isPlaying() ? 'rhap_play-status--playing' : 'rhap_play-status--paused';
    return _react.default.createElement("div", {
      role: "group",
      tabIndex: 0,
      "aria-label": i18nAriaLabels.player,
      className: `rhap_container ${loopClass} ${isPlayingClass} ${className}`,
      onKeyDown: this.handleKeyDown,
      ref: this.container,
      style: style
    }, _react.default.createElement("audio", {
      src: src,
      controls: false,
      loop: loop,
      autoPlay: autoPlay,
      preload: preload,
      crossOrigin: crossOrigin,
      mediaGroup: mediaGroup,
      ref: this.audio
    }, children), header && _react.default.createElement("div", {
      className: "rhap_header"
    }, header), _react.default.createElement("div", {
      className: `rhap_main ${(0, _utils.getMainLayoutClassName)(layout)}`
    }, _react.default.createElement("div", {
      className: "rhap_progress-section"
    }, this.renderUIModules(customProgressBarSection)), _react.default.createElement("div", {
      className: "rhap_controls-section"
    }, this.renderUIModules(customControlsSection))), footer && _react.default.createElement("div", {
      className: "rhap_footer"
    }, footer));
  }
}
var _default = exports.default = H5AudioPlayer;