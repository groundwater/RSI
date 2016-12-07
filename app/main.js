const {app, BrowserWindow, ipcMain} = require('electron')

var binary = require('node-pre-gyp');
var path = require('path');
var binding_path = binary.find(path.resolve(path.join(__dirname, 'node_modules/os-idle-timer/package.json')));
var idle = require(binding_path);

function macNotify(msg) {
  
}

function winNotify(msg) {
  const tn = require('electron-windows-notifications')
  const ToastNotification = tn.ToastNotification

  const notification = new ToastNotification({
    appId: appId,
    template: `<toast><visual><binding template="ToastText01"><text id="1">%s</text></binding></visual></toast>`,
    strings: [msg]
  })
  notification.on('activated', () => console.log('Activated!'))
  notification.show()
}

/* Windows notification */
const appId = 'electron-windows-notifications'
function notify(msg) {
  // if windows machine or mac machine
  if (process.platform === 'win32') {
    winNotify(msg);
  } else if (process.platform === 'darwin') {
    console.log(msg)
  }
}
/* END */

var activeBrowser = null
app.on('ready', function() {
  console.log('app ready')
})

app.on('window-all-closed', () => {
  // prevent close when browser window closes
})


function newBrowser(t) {
  let browser = new BrowserWindow({
    fullscreen: true,
    alwaysOnTop: true,
    show: true,
  })
  browser.loadURL(`file:///${__dirname}/index.html#${t}`)
  browser.on('close', (event) => {
    browser.close()
  })
}

const {Menu, MenuItem} = require('electron')

app.on('ready', () => {

  const contextMenu = new Menu

  let item = new MenuItem({
    role: 'quit',
  })

  contextMenu.append(item)
})

function windowNotify(t) {
  // browser.show()
  newBrowser(t)
}

function minutesToMS(m) {
  return m * secondsToMS(60)
}

function secondsToMS(s) {
  return s * 1000
}

function MSToSeconds(ms) {
  return ms / 1000
}

function MSToMinutes(m) {
  return MSToSeconds(m) / 60
}

function MSToHuman(ms) {
  let lessThanAMinute = ms < secondsToMS(60)
  var fmt = "unknown"
  if (lessThanAMinute) {
    let secs = Math.floor(MSToSeconds(ms))
    fmt = `${secs}s`
  } else {
    let mins = Math.floor(MSToMinutes(ms))
    let secs = Math.floor(MSToSeconds(ms)) % 60
    fmt = `${mins}m ${secs}s`
  }
  return fmt
}

const stores = [{
  workTime: 0,
  maxTime: minutesToMS(20),
  idleTime: 0,
  maxIdle: minutesToMS(10),
  lastCheck: Date.now(),
  notify: () => {
    notify("Long Break Coming Up")
    setTimeout(function() {
      windowNotify(600)
    }, 3000)
  }
}, {
  workTime: 0,
  maxTime: minutesToMS(5),
  idleTime: 0,
  maxIdle: secondsToMS(60),
  lastCheck: Date.now(),
  notify: () => {
    notify("Short Break Coming Up")
    setTimeout(function() {
      windowNotify(15)
    }, 3000)
  }
}]

setInterval(function(){
  let idleTime = idle.getIdleTime_ms()
  for (let store of stores) {
    processStore(store, {idleTime})
  }
}, 1000)

function processStore(store, {idleTime}) {
  // count as idle if inactive for 10 seconds or more
  let now = Date.now()
  let last = store.lastCheck

  let userIsActive = idleTime < 10000

  if (userIsActive) {
    // user is not idle

    store.workTime += (now - last)
    store.idleTime = 0

    let userNeedsABreak = store.workTime > store.maxTime

    if (userNeedsABreak && activeBrowser === null) {
      console.log('Take a Break')
      store.notify()
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

  console.log('Next Break: ', MSToHuman(store.maxTime - store.workTime))
}
