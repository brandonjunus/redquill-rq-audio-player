import React, { Component, SyntheticEvent } from 'react';
import { OnSeek } from './index';
interface ProgressBarForwardRefProps {
    audio: HTMLAudioElement;
    progressUpdateInterval: number;
    showDownloadProgress: boolean;
    showFilledProgress: boolean;
    srcDuration?: number;
    onSeek?: OnSeek;
    onChangeCurrentTimeError?: (err: Error) => void;
    i18nProgressBar: string;
}
interface ProgressBarProps extends ProgressBarForwardRefProps {
    progressBar: React.RefObject<HTMLDivElement>;
}
interface ProgressBarState {
    isDraggingProgress: boolean;
    currentTimePos?: string;
    hasDownloadProgressAnimation: boolean;
    downloadProgressArr: DownloadProgress[];
    waitingForSeekCallback: boolean;
}
interface DownloadProgress {
    left: string;
    width: string;
}
interface TimePosInfo {
    currentTime: number;
    currentTimePos: string;
}
declare class ProgressBar extends Component<ProgressBarProps, ProgressBarState> {
    audio?: HTMLAudioElement;
    timeOnMouseMove: number;
    hasAddedAudioEventListener: boolean;
    downloadProgressAnimationTimer?: number;
    state: ProgressBarState;
    getDuration(): number;
    getCurrentProgress: (event: MouseEvent | TouchEvent) => TimePosInfo;
    handleContextMenu: (event: SyntheticEvent) => void;
    handleMouseDownOrTouchStartProgressBar: (event: React.MouseEvent | React.TouchEvent) => void;
    handleWindowMouseOrTouchMove: (event: TouchEvent | MouseEvent) => void;
    handleWindowMouseOrTouchUp: (event: MouseEvent | TouchEvent) => void;
    handleAudioTimeUpdate: (arg: Event) => void;
    handleAudioDownloadProgressUpdate: (e: Event) => void;
    initialize(): void;
    componentDidMount(): void;
    componentDidUpdate(): void;
    componentWillUnmount(): void;
    render(): React.ReactNode;
}
declare const ProgressBarForwardRef: (props: ProgressBarForwardRefProps, ref: React.Ref<HTMLDivElement>) => React.ReactElement;
declare const _default: React.ForwardRefExoticComponent<ProgressBarForwardRefProps & React.RefAttributes<HTMLDivElement>>;
export default _default;
export { ProgressBar, ProgressBarForwardRef };
