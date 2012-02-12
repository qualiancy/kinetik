var Seed = require('seed');

module.exports = Seed.Model.extend('task', {

    tag: function (tag) {
      this.set({ 'tag': tag });
      return this;
    }

  , action: function (fn) {
      this.set({ 'action': fn });
      return this;
    }
});
