"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.ProgressBarForwardRef = exports.ProgressBar = void 0;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var _react = _interopRequireWildcard(require("react"));
var _utils = require("./utils");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
class ProgressBar extends _react.Component {
  timeOnMouseMove = 0;
  hasAddedAudioEventListener = false;
  state = {
    isDraggingProgress: false,
    currentTimePos: '0%',
    hasDownloadProgressAnimation: false,
    downloadProgressArr: [],
    waitingForSeekCallback: false
  };
  getDuration() {
    const {
      audio,
      srcDuration
    } = this.props;
    return typeof srcDuration === 'undefined' ? audio.duration || 0 : srcDuration;
  }
  getCurrentProgress = event => {
    const {
      audio,
      progressBar
    } = this.props;
    const isSingleFileProgressiveDownload = typeof this.props.srcDuration === 'undefined' && (!audio.duration || !isFinite(audio.duration));
    if (isSingleFileProgressiveDownload || !isFinite(audio.currentTime) || !progressBar.current) {
      return {
        currentTime: 0,
        currentTimePos: '0%'
      };
    }
    const progressBarRect = progressBar.current.getBoundingClientRect();
    const maxRelativePos = progressBarRect.width;
    let relativePos = (0, _utils.getPosX)(event) - progressBarRect.left;
    if (relativePos < 0) {
      relativePos = 0;
    } else if (relativePos > maxRelativePos) {
      relativePos = maxRelativePos;
    }
    const duration = this.getDuration();
    const currentTime = duration * relativePos / maxRelativePos;
    return {
      currentTime,
      currentTimePos: `${(relativePos / maxRelativePos * 100).toFixed(2)}%`
    };
  };
  handleContextMenu = event => {
    event.preventDefault();
  };
  handleMouseDownOrTouchStartProgressBar = event => {
    event.stopPropagation();
    const {
      currentTime,
      currentTimePos
    } = this.getCurrentProgress(event.nativeEvent);
    if (isFinite(currentTime)) {
      this.timeOnMouseMove = currentTime;
      this.setState({
        isDraggingProgress: true,
        currentTimePos
      });
      if (event.nativeEvent instanceof MouseEvent) {
        window.addEventListener('mousemove', this.handleWindowMouseOrTouchMove);
        window.addEventListener('mouseup', this.handleWindowMouseOrTouchUp);
      } else {
        window.addEventListener('touchmove', this.handleWindowMouseOrTouchMove);
        window.addEventListener('touchend', this.handleWindowMouseOrTouchUp);
      }
    }
  };
  handleWindowMouseOrTouchMove = event => {
    if (event instanceof MouseEvent) {
      event.preventDefault();
    }
    event.stopPropagation();
    const windowSelection = window.getSelection();
    if (windowSelection && windowSelection.type === 'Range') {
      windowSelection.empty();
    }
    const {
      isDraggingProgress
    } = this.state;
    if (isDraggingProgress) {
      const {
        currentTime,
        currentTimePos
      } = this.getCurrentProgress(event);
      this.timeOnMouseMove = currentTime;
      this.setState({
        currentTimePos
      });
    }
  };
  handleWindowMouseOrTouchUp = event => {
    event.stopPropagation();
    const newTime = this.timeOnMouseMove;
    const {
      audio,
      onChangeCurrentTimeError,
      onSeek
    } = this.props;
    if (onSeek) {
      this.setState({
        isDraggingProgress: false,
        waitingForSeekCallback: true
      }, () => {
        onSeek(audio, newTime).then(() => this.setState({
          waitingForSeekCallback: false
        }), err => {
          this.setState({
            waitingForSeekCallback: false
          });
          if (onChangeCurrentTimeError) {
            onChangeCurrentTimeError(err);
          }
        });
      });
    } else {
      const newProps = {
        isDraggingProgress: false
      };
      if (!isFinite(newTime)) {
        newProps.currentTimePos = '0%';
        return onChangeCurrentTimeError && onChangeCurrentTimeError(new Error('Invalid seek time'));
      }
      try {
        audio.currentTime = newTime;
        this.setState(newProps);
      } catch (err) {
        newProps.currentTimePos = '0%';
        if (onChangeCurrentTimeError) {
          onChangeCurrentTimeError(err);
        }
      }
    }
    if (event instanceof MouseEvent) {
      window.removeEventListener('mousemove', this.handleWindowMouseOrTouchMove);
      window.removeEventListener('mouseup', this.handleWindowMouseOrTouchUp);
    } else {
      window.removeEventListener('touchmove', this.handleWindowMouseOrTouchMove);
      window.removeEventListener('touchend', this.handleWindowMouseOrTouchUp);
    }
  };
  handleAudioTimeUpdate = (() => (0, _utils.throttle)(e => {
    const {
      isDraggingProgress
    } = this.state;
    const audio = e.target;
    if (isDraggingProgress || this.state.waitingForSeekCallback === true) return;
    const {
      currentTime
    } = audio;
    const duration = this.getDuration();
    this.setState({
      currentTimePos: `${(currentTime / duration * 100 || 0).toFixed(2)}%`
    });
  }, this.props.progressUpdateInterval))();
  handleAudioDownloadProgressUpdate = e => {
    const audio = e.target;
    const duration = this.getDuration();
    const downloadProgressArr = [];
    for (let i = 0; i < audio.buffered.length; i++) {
      const bufferedStart = audio.buffered.start(i);
      const bufferedEnd = audio.buffered.end(i);
      downloadProgressArr.push({
        left: `${Math.round(100 / duration * bufferedStart) || 0}%`,
        width: `${Math.round(100 / duration * (bufferedEnd - bufferedStart)) || 0}%`
      });
    }
    clearTimeout(this.downloadProgressAnimationTimer);
    this.setState({
      downloadProgressArr,
      hasDownloadProgressAnimation: true
    });
    this.downloadProgressAnimationTimer = setTimeout(() => {
      this.setState({
        hasDownloadProgressAnimation: false
      });
    }, 200);
  };
  initialize() {
    const {
      audio
    } = this.props;
    if (audio && !this.hasAddedAudioEventListener) {
      this.audio = audio;
      this.hasAddedAudioEventListener = true;
      audio.addEventListener('timeupdate', this.handleAudioTimeUpdate);
      audio.addEventListener('progress', this.handleAudioDownloadProgressUpdate);
    }
  }
  componentDidMount() {
    this.initialize();
  }
  componentDidUpdate() {
    this.initialize();
  }
  componentWillUnmount() {
    if (this.audio && this.hasAddedAudioEventListener) {
      this.audio.removeEventListener('timeupdate', this.handleAudioTimeUpdate);
      this.audio.removeEventListener('progress', this.handleAudioDownloadProgressUpdate);
    }
    clearTimeout(this.downloadProgressAnimationTimer);
  }
  render() {
    const {
      showDownloadProgress,
      showFilledProgress,
      progressBar,
      i18nProgressBar
    } = this.props;
    const {
      currentTimePos,
      downloadProgressArr,
      hasDownloadProgressAnimation
    } = this.state;
    return _react.default.createElement("div", {
      className: "rhap_progress-container",
      ref: progressBar,
      "aria-label": i18nProgressBar,
      role: "progressbar",
      "aria-valuemin": 0,
      "aria-valuemax": 100,
      "aria-valuenow": Number(currentTimePos.split('%')[0]),
      tabIndex: 0,
      onMouseDown: this.handleMouseDownOrTouchStartProgressBar,
      onTouchStart: this.handleMouseDownOrTouchStartProgressBar,
      onContextMenu: this.handleContextMenu
    }, _react.default.createElement("div", {
      className: `rhap_progress-bar ${showDownloadProgress ? 'rhap_progress-bar-show-download' : ''}`
    }, _react.default.createElement("div", {
      className: "rhap_progress-indicator",
      style: {
        left: currentTimePos
      }
    }), showFilledProgress && _react.default.createElement("div", {
      className: "rhap_progress-filled",
      style: {
        width: currentTimePos
      }
    }), showDownloadProgress && downloadProgressArr.map((_ref, i) => {
      let {
        left,
        width
      } = _ref;
      return _react.default.createElement("div", {
        key: i,
        className: "rhap_download-progress",
        style: {
          left,
          width,
          transitionDuration: hasDownloadProgressAnimation ? '.2s' : '0s'
        }
      });
    })));
  }
}
exports.ProgressBar = ProgressBar;
const ProgressBarForwardRef = (props, ref) => _react.default.createElement(ProgressBar, (0, _extends2.default)({}, props, {
  progressBar: ref
}));
exports.ProgressBarForwardRef = ProgressBarForwardRef;
var _default = exports.default = (0, _react.forwardRef)(ProgressBarForwardRef);