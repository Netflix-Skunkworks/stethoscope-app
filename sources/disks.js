const drivelist = require('drivelist')

function disks() {
  return new Promise((resolve, reject) => {
    drivelist.list((error, drives) => {
      if (error) {
        reject(error);
      } else {
        resolve(drives);
      }
    });
  })
}

module.exports = disks

if (require.main === module) {
  disks().then(results => {
    console.assert(Array.isArray(results))
  })
}
