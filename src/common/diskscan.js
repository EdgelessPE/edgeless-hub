const { list } = require('drivelist');
const { getDriveName } = require('drive-name');

module.exports = async() => {
  const drives = await list();
  const removable = [];
  const names = [];
  const labels = [];
  drives.forEach(v => {
    v.mountpoints.forEach(({ path }) => {
      labels.push(getDriveName(path));
      names.push(path.slice(0,1));
      removable.push(v.isRemovable);
    });
  });
  return { removable, names, labels };
};