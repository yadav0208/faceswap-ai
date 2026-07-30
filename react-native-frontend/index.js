// Expo's web icon loader uses FontFaceObserver. On slower tunnel connections it
// can reject after six seconds even though the application and API are healthy.
// Prevent that optional icon-font timeout from opening Expo's fatal error screen.
if (
  typeof window !== 'undefined' &&
  typeof window.addEventListener === 'function'
) {
  window.addEventListener('unhandledrejection', (event) => {
    const message = String(event.reason?.message || event.reason || '');
    const stack = String(event.reason?.stack || '');
    if (
      message === '6000ms timeout exceeded' &&
      stack.includes('fontfaceobserver')
    ) {
      event.preventDefault();
    }
  });
}

require('expo-router/entry');
