import React, { Component, cloneElement, isValidElement, createRef } from 'react';
import { Icon } from '@iconify/react';
import ProgressBar from './ProgressBar';
import CurrentTime from './CurrentTime';
import Duration from './Duration';
import VolumeBar from './VolumeBar';
import { RHAP_UI } from './constants';
import { throttle, getMainLayoutClassName, getDisplayTimeBySeconds } from './utils';
class H5AudioPlayer extends Component {
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
  audio = (() => createRef())();
  progressBar = (() => createRef())();
  container = (() => createRef())();
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
      customAdditionalControls = [RHAP_UI.LOOP],
      customVolumeControls = [RHAP_UI.VOLUME],
      muted = false,
      timeFormat = 'auto',
      volume: volumeProp = 1,
      loop: loopProp = false,
      mse,
      i18nAriaLabels = H5AudioPlayer.defaultI18nAriaLabels
    } = this.props;
    switch (comp) {
      case RHAP_UI.CURRENT_TIME:
        return React.createElement("div", {
          key: key,
          id: "rhap_current-time",
          className: "rhap_time rhap_current-time"
        }, React.createElement(CurrentTime, {
          audio: this.audio.current,
          isLeftTime: false,
          defaultCurrentTime: defaultCurrentTime,
          timeFormat: timeFormat
        }));
      case RHAP_UI.CURRENT_LEFT_TIME:
        return React.createElement("div", {
          key: key,
          id: "rhap_current-left-time",
          className: "rhap_time rhap_current-left-time"
        }, React.createElement(CurrentTime, {
          audio: this.audio.current,
          isLeftTime: true,
          defaultCurrentTime: defaultCurrentTime,
          timeFormat: timeFormat
        }));
      case RHAP_UI.PROGRESS_BAR:
        return React.createElement(ProgressBar, {
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
      case RHAP_UI.DURATION:
        return React.createElement("div", {
          key: key,
          className: "rhap_time rhap_total-time"
        }, mse && mse.srcDuration ? getDisplayTimeBySeconds(mse.srcDuration, mse.srcDuration, this.props.timeFormat) : React.createElement(Duration, {
          audio: this.audio.current,
          defaultDuration: defaultDuration,
          timeFormat: timeFormat
        }));
      case RHAP_UI.ADDITIONAL_CONTROLS:
        return React.createElement("div", {
          key: key,
          className: "rhap_additional-controls"
        }, this.renderUIModules(customAdditionalControls));
      case RHAP_UI.MAIN_CONTROLS:
        {
          const isPlaying = this.isPlaying();
          let actionIcon;
          if (isPlaying) {
            actionIcon = customIcons.pause ? customIcons.pause : React.createElement(Icon, {
              icon: "mdi:pause-circle"
            });
          } else {
            actionIcon = customIcons.play ? customIcons.play : React.createElement(Icon, {
              icon: "mdi:play-circle"
            });
          }
          return React.createElement("div", {
            key: key,
            className: "rhap_main-controls"
          }, showSkipControls && React.createElement("button", {
            "aria-label": i18nAriaLabels.previous,
            className: "rhap_button-clear rhap_main-controls-button rhap_skip-button",
            type: "button",
            onClick: onClickPrevious
          }, customIcons.previous ? customIcons.previous : React.createElement(Icon, {
            icon: "mdi:skip-previous"
          })), showJumpControls && React.createElement("button", {
            "aria-label": i18nAriaLabels.rewind,
            className: "rhap_button-clear rhap_main-controls-button rhap_rewind-button",
            type: "button",
            onClick: this.handleClickRewind
          }, customIcons.rewind ? customIcons.rewind : React.createElement(Icon, {
            icon: "mdi:rewind"
          })), React.createElement("button", {
            "aria-label": isPlaying ? i18nAriaLabels.pause : i18nAriaLabels.play,
            className: "rhap_button-clear rhap_main-controls-button rhap_play-pause-button",
            type: "button",
            onClick: this.togglePlay
          }, actionIcon), showJumpControls && React.createElement("button", {
            "aria-label": i18nAriaLabels.forward,
            className: "rhap_button-clear rhap_main-controls-button rhap_forward-button",
            type: "button",
            onClick: this.handleClickForward
          }, customIcons.forward ? customIcons.forward : React.createElement(Icon, {
            icon: "mdi:fast-forward"
          })), showSkipControls && React.createElement("button", {
            "aria-label": i18nAriaLabels.next,
            className: "rhap_button-clear rhap_main-controls-button rhap_skip-button",
            type: "button",
            onClick: onClickNext
          }, customIcons.next ? customIcons.next : React.createElement(Icon, {
            icon: "mdi:skip-next"
          })));
        }
      case RHAP_UI.VOLUME_CONTROLS:
        return React.createElement("div", {
          key: key,
          className: "rhap_volume-controls"
        }, this.renderUIModules(customVolumeControls));
      case RHAP_UI.LOOP:
        {
          const loop = this.audio.current ? this.audio.current.loop : loopProp;
          let loopIcon;
          if (loop) {
            loopIcon = customIcons.loop ? customIcons.loop : React.createElement(Icon, {
              icon: "mdi:repeat"
            });
          } else {
            loopIcon = customIcons.loopOff ? customIcons.loopOff : React.createElement(Icon, {
              icon: "mdi:repeat-off"
            });
          }
          return React.createElement("button", {
            key: key,
            "aria-label": loop ? i18nAriaLabels.loop : i18nAriaLabels.loopOff,
            className: "rhap_button-clear rhap_repeat-button",
            type: "button",
            onClick: this.handleClickLoopButton
          }, loopIcon);
        }
      case RHAP_UI.VOLUME:
        {
          const {
            volume = muted ? 0 : volumeProp
          } = this.audio.current || {};
          let volumeIcon;
          if (volume) {
            volumeIcon = customIcons.volume ? customIcons.volume : React.createElement(Icon, {
              icon: "mdi:volume-high"
            });
          } else {
            volumeIcon = customIcons.volume ? customIcons.volumeMute : React.createElement(Icon, {
              icon: "mdi:volume-mute"
            });
          }
          return React.createElement("div", {
            key: key,
            className: "rhap_volume-container"
          }, React.createElement("button", {
            "aria-label": volume ? i18nAriaLabels.volume : i18nAriaLabels.volumeMute,
            onClick: this.handleClickVolumeButton,
            type: "button",
            className: "rhap_button-clear rhap_volume-button"
          }, volumeIcon), React.createElement(VolumeBar, {
            audio: this.audio.current,
            volume: volume,
            onMuteChange: this.handleMuteChange,
            showFilledVolume: showFilledVolume,
            i18nVolumeControl: i18nAriaLabels.volumeControl
          }));
        }
      default:
        if (!isValidElement(comp)) {
          return null;
        }
        return comp.key ? comp : cloneElement(comp, {
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
    audio.addEventListener('timeupdate', throttle(e => {
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
      customProgressBarSection = [RHAP_UI.CURRENT_TIME, RHAP_UI.PROGRESS_BAR, RHAP_UI.DURATION],
      customControlsSection = [RHAP_UI.ADDITIONAL_CONTROLS, RHAP_UI.MAIN_CONTROLS, RHAP_UI.VOLUME_CONTROLS],
      children,
      style,
      i18nAriaLabels = H5AudioPlayer.defaultI18nAriaLabels
    } = this.props;
    const loop = this.audio.current ? this.audio.current.loop : loopProp;
    const loopClass = loop ? 'rhap_loop--on' : 'rhap_loop--off';
    const isPlayingClass = this.isPlaying() ? 'rhap_play-status--playing' : 'rhap_play-status--paused';
    return React.createElement("div", {
      role: "group",
      tabIndex: 0,
      "aria-label": i18nAriaLabels.player,
      className: `rhap_container ${loopClass} ${isPlayingClass} ${className}`,
      onKeyDown: this.handleKeyDown,
      ref: this.container,
      style: style
    }, React.createElement("audio", {
      src: src,
      controls: false,
      loop: loop,
      autoPlay: autoPlay,
      preload: preload,
      crossOrigin: crossOrigin,
      mediaGroup: mediaGroup,
      ref: this.audio
    }, children), header && React.createElement("div", {
      className: "rhap_header"
    }, header), React.createElement("div", {
      className: `rhap_main ${getMainLayoutClassName(layout)}`
    }, React.createElement("div", {
      className: "rhap_progress-section"
    }, this.renderUIModules(customProgressBarSection)), React.createElement("div", {
      className: "rhap_controls-section"
    }, this.renderUIModules(customControlsSection))), footer && React.createElement("div", {
      className: "rhap_footer"
    }, footer));
  }
}
export default H5AudioPlayer;
export { RHAP_UI };