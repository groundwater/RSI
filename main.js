const {app, BrowserWindow} = require('electron')

var binary = require('node-pre-gyp');
var path = require('path');
var binding_path = binary.find(path.resolve(path.join(__dirname, 'node_modules/os-idle-timer/package.json')));
var idle = require(binding_path);

/* Windows notification */
const appId = 'electron-windows-notifications'
const {ToastNotification} = require('electron-windows-notifications')

function notify(msg) {
  let notification = new ToastNotification({
      appId: appId,
      template: `<toast><visual><binding template="ToastText01"><text id="1">%s</text></binding></visual></toast>`,
      strings: [msg]
  })
  notification.on('activated', () => console.log('Activated!'))
  notification.show()
}
/* END */

function minutesToMS(m) {
  return m * secondsToMS(60)
}

function secondsToMS(s) {
  return s * 1000
}

const store = {
  workTime: 0,
  maxTime: minutesToMS(5),
  idleTime: 0,
  maxIdle: minutesToMS(1),
  lastCheck: Date.now()
}

setInterval(function(){
  let idleTime = idle.getIdleTime_ms()

  // count as idle if inactive for 10 seconds or more
  let now = Date.now()
  let last = store.lastCheck

  let userIsActive = idleTime < 10000

  if (userIsActive) {
    // user is not idle

    store.workTime += (now - last)
    store.idleTime = 0

    let userNeedsABreak = store.workTime > store.maxTime

    if (userNeedsABreak) {
      console.log('Take a Break')
      notify("Take a Break")
      store.workTime = 0
    }
  } else {
    // user is idle

    store.idleTime += (now - last)

    let userIsRested = store.idleTime > store.maxIdle

    if (userIsRested) {
      console.log('Resetting Work Time')
      store.workTime = 0
      store.idleTime = 0
    }
  }

  store.lastCheck = now

  console.log(store.workTime)
}, 1000)
