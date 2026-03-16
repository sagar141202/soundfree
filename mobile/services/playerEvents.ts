type PlayHandler = (track: any) => void;

let _playHandler: PlayHandler | null = null;

export function registerPlayHandler(handler: PlayHandler) {
  _playHandler = handler;
}

export function emitPlay(track: any) {
  if (_playHandler) {
    _playHandler(track);
  } else {
    console.warn('No play handler registered');
  }
}
